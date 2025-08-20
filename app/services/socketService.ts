import io, { Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: any = null;

  async connect() {
    try {
      // Clear any existing connection first
      this.disconnect();
      
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('No auth token found');
      }

      const SOCKET_URL = __DEV__ 
        ? 'http://10.30.251.172:5000' 
        : 'https://your-production-api.com';

      this.socket = io(SOCKET_URL, {
        auth: {
          token
        },
        transports: ['websocket'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
        this.isConnected = false;
        
        // Try to reconnect if not intentionally disconnected
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectTimeout = setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
          }, 1000);
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        this.isConnected = false;
      });

      return this.socket;
    } catch (error) {
      console.error('Socket connection failed:', error);
      throw error;
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
    }
  }

  joinGroup(groupId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-group', groupId);
    }
  }

  joinPrivateChat(userId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-private-chat', userId);
    }
  }

  sendMessage(groupId: string | null, message: { text: string; user?: any; type?: string }, userId: string | null) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }

    if (!message.text?.trim()) {
      throw new Error('Message text is required');
    }

    // Validate that groupId is a valid MongoDB ObjectId (24 character hex)
    if (groupId && !/^[0-9a-fA-F]{24}$/.test(groupId)) {
      throw new Error('Invalid group ID format');
    }

    if (userId && !/^[0-9a-fA-F]{24}$/.test(userId)) {
      throw new Error('Invalid user ID format');
    }

    const isCommand = message.text.trim().startsWith('@');
    
    if (groupId) {
      this.socket.emit('send-message', {
        groupId,
        message: {
          text: message.text.trim(),
          user: message.user,
          type: message.type || (isCommand ? 'system' : 'text'),
          status: 'sent',
          createdAt: new Date().toISOString()
        },
        type: 'group'
      });
    } else if (userId) {
      this.socket.emit('send-message', {
        userId,
        message: {
          text: message.text.trim(),
          user: message.user,
          createdAt: new Date().toISOString(),
          type: message.type || 'text',
          status: 'sent'
        },
        type: 'private'
      });
    }
  }

  onReceiveMessage(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.on('receive-message', (data) => {
        try {
          // Validate basic message structure
          if (!data || typeof data !== 'object') {
            throw new Error('Invalid message format: message is not an object');
          }

          // For direct socket events (no status wrapper)
          if (data.text && data.user && data._id) {
            const message = data;
            // Handle system messages
            const user = message.type === 'system' ? {
              _id: 'system',
              name: 'AI Assistant',
              avatar: '🤖'
            } : message.user;

            const formattedMessage = {
              _id: message._id.toString(),
              text: message.text,
              createdAt: message.createdAt || new Date().toISOString(),
              user: {
                _id: user._id.toString(),
                name: user.name || '',
                avatar: user.avatar || '',
                username: user.username || ''
              },
              type: message.type || 'text',
              status: message.status || 'sent',
              readBy: message.readBy || [],
              commandType: message.commandType,
              systemMessage: message.type === 'system',
              groupId: message.groupId?.toString(),
              commandData: message.commandData || {},
              systemData: message.systemData || {},
              mediaUrl: message.mediaUrl,
              mediaType: message.mediaType,
              mediaSize: message.mediaSize,
              mentions: message.mentions || [],
              reactions: message.reactions || []
            };
            callback(formattedMessage);
            return;
          }

          // For API response format
          if (data.status === 'success' && data.data?.message) {
            const message = data.data.message;
            const user = message.type === 'system' ? {
              _id: 'system',
              name: 'AI Assistant',
              avatar: '🤖'
            } : message.user;

            const formattedMessage = {
              _id: message._id.toString(),
              text: message.text,
              createdAt: message.createdAt || new Date().toISOString(),
              user: {
                _id: user._id.toString(),
                name: user.name || '',
                avatar: user.avatar || '',
                username: user.username || ''
              },
              type: message.type || 'text',
              status: message.status || 'sent',
              readBy: message.readBy || [],
              commandType: message.commandType,
              systemMessage: message.type === 'system',
              groupId: message.groupId?.toString(),
              commandData: message.commandData || {},
              systemData: message.systemData || {},
              mediaUrl: message.mediaUrl,
              mediaType: message.mediaType,
              mediaSize: message.mediaSize,
              mentions: message.mentions || [],
              reactions: message.reactions || []
            };
            callback(formattedMessage);
            return;
          }

          throw new Error('Invalid message format: missing required fields');
        } catch (error) {
          console.error('Error handling received message:', error);
        }
      });
    }
  }

  onError(callback: (error: any) => void) {
    if (this.socket) {
      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
        callback(error);
      });
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

export const socketService = new SocketService();
export default socketService;