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
        console.warn('⚠️ No auth token found for socket connection');
        throw new Error('No auth token found');
      }

      console.log('🔌 Initializing socket connection...');
      const SOCKET_URL = __DEV__ 
        ? 'http://10.247.4.172:3001' 
        : 'https://your-production-api.com';

      console.log('🔌 Connecting to socket server:', SOCKET_URL);

      this.socket = io(SOCKET_URL, {
        auth: {
          token
        },
        transports: ['websocket', 'polling'], // Allow fallback to polling
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        forceNew: true, // Force new connection
        upgrade: true, // Allow upgrade to websocket
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket connected successfully');
        this.isConnected = true;
        this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
        this.isConnected = false;
        
        // Try to reconnect if not intentionally disconnected
        if (reason !== 'io client disconnect' && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectTimeout = setTimeout(() => {
            this.reconnectAttempts++;
            console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            this.connect();
          }, 1000);
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        this.isConnected = false;
        
        // Don't retry automatically in React Native to avoid excessive retries
        // The connection will be re-established when the app comes back online
      });

      return this.socket;
    } catch (error) {
      console.error('❌ Socket connection failed:', error instanceof Error ? error.message : error);
      this.isConnected = false;
      
      // Don't throw error, just log it - socket will retry automatically
      return null;
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
          // Handle direct socket messages from backend
          if (data && typeof data === 'object' && data.text && data.user) {
            const message = {
              _id: data._id || Date.now().toString(),
              text: data.text,
              createdAt: data.createdAt || new Date().toISOString(),
              user: {
                _id: data.user._id?.toString() || data.user._id,
                name: data.user.name || '',
                avatar: data.user.avatar || '',
                username: data.user.username || ''
              },
              type: data.type || 'text',
              status: data.status || 'sent',
              readBy: data.readBy || [],
              commandType: data.commandType,
              systemMessage: data.type === 'system',
              groupId: data.groupId?.toString(),
              commandData: data.commandData || {},
              systemData: data.systemData || {},
              mediaUrl: data.mediaUrl,
              mediaType: data.mediaType,
              mediaSize: data.mediaSize,
              mentions: data.mentions || [],
              reactions: data.reactions || []
            };
            callback(message);
            return;
          }

          // Handle API response format
          if (data.status === 'success' && data.data?.message) {
            const msg = data.data.message;
            const message = {
              _id: msg._id?.toString() || Date.now().toString(),
              text: msg.text,
              createdAt: msg.createdAt || new Date().toISOString(),
              user: {
                _id: msg.user?._id?.toString() || msg.user?._id,
                name: msg.user?.name || '',
                avatar: msg.user?.avatar || '',
                username: msg.user?.username || ''
              },
              type: msg.type || 'text',
              status: msg.status || 'sent',
              readBy: msg.readBy || [],
              commandType: msg.commandType,
              systemMessage: msg.type === 'system',
              groupId: msg.groupId?.toString(),
              commandData: msg.commandData || {},
              systemData: msg.systemData || {},
              mediaUrl: msg.mediaUrl,
              mediaType: msg.mediaType,
              mediaSize: msg.mediaSize,
              mentions: msg.mentions || [],
              reactions: msg.reactions || []
            };
            callback(message);
            return;
          }

          console.warn('Invalid message format received:', data);
        } catch (error) {
          console.error('Error handling received message:', error);
        }
      });

      // Also listen for system messages
      this.socket.on('system-message', (data) => {
        try {
          const message = {
            _id: data._id || 'sys-' + Date.now(),
            text: data.text,
            createdAt: data.createdAt || new Date().toISOString(),
            user: {
              _id: 'system',
              name: 'AI Assistant',
              avatar: '🤖'
            },
            type: 'system',
            status: 'sent',
            readBy: [],
            commandType: data.commandType,
            systemMessage: true,
            groupId: data.groupId?.toString(),
            commandData: data.commandData || {},
            systemData: data.systemData || {},
            mediaUrl: null,
            mediaType: null,
            mediaSize: 0,
            mentions: [],
            reactions: []
          };
          callback(message);
        } catch (error) {
          console.error('Error handling system message:', error);
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

  // WhatsApp-like features
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private typingUsers: Map<string, Set<string>> = new Map();
  private offlineQueue: Array<{
    groupId?: string;
    userId?: string;
    message: any;
    timestamp: number;
  }> = [];
  private isOnline = true;

  // Typing indicators
  startTyping(groupId: string) {
    if (!this.socket || !this.isConnected) return;

    this.socket.emit('typing-start', { groupId });
  }

  stopTyping(groupId: string) {
    if (!this.socket || !this.isConnected) return;

    this.socket.emit('typing-stop', { groupId });
  }

  onTypingStart(callback: (data: { groupId: string; user: any }) => void) {
    if (this.socket) {
      this.socket.on('user-typing-start', (data) => {
        callback(data);
      });
    }
  }

  onTypingStop(callback: (data: { groupId: string; user: any }) => void) {
    if (this.socket) {
      this.socket.on('user-typing-stop', (data) => {
        callback(data);
      });
    }
  }

  // Read receipts
  markMessageAsRead(messageId: string, groupId: string) {
    if (!this.socket || !this.isConnected) {
      // Queue for offline
      this.offlineQueue.push({
        groupId,
        message: { messageId, action: 'mark-read' },
        timestamp: Date.now()
      });
      return;
    }

    this.socket.emit('mark-read', { messageId, groupId });
  }

  onMessageRead(callback: (data: { messageId: string; userId: string; readAt: Date }) => void) {
    if (this.socket) {
      this.socket.on('message-read', (data) => {
        callback(data);
      });
    }
  }

  // Message status updates
  onMessageStatusUpdate(callback: (data: { messageId: string; status: string; userId: string }) => void) {
    if (this.socket) {
      this.socket.on('message-status-update', (data) => {
        callback(data);
      });
    }
  }

  // Online/offline support
  setOnlineStatus(online: boolean) {
    this.isOnline = online;
    if (online && this.offlineQueue.length > 0) {
      this.processOfflineQueue();
    }
  }

  private async processOfflineQueue() {
    if (!this.socket || !this.isConnected) return;

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const item of queue) {
      try {
        if (item.message.action === 'mark-read') {
          this.socket.emit('mark-read', {
            messageId: item.message.messageId,
            groupId: item.groupId
          });
        } else if (item.groupId) {
          // Resend message
          this.socket.emit('send-message', {
            groupId: item.groupId,
            message: item.message,
            type: 'group'
          });
        }
      } catch (error) {
        console.error('Failed to process offline queue item:', error);
        // Re-queue failed items
        this.offlineQueue.push(item);
      }
    }
  }

  // Connection status monitoring
  onConnectionStatusChange(callback: (online: boolean) => void) {
    // For React Native, we'll use a simpler approach
    // Monitor network connectivity using NetInfo or basic connectivity checks
    const checkConnection = () => {
      // In React Native, we can use a basic connectivity check
      // For now, we'll just assume we're online when socket is connected
      const wasOnline = this.isOnline;
      this.isOnline = this.isConnected;
      
      if (wasOnline !== this.isOnline) {
        callback(this.isOnline);
        if (this.isOnline) {
          this.processOfflineQueue();
        }
      }
    };

    // Check immediately
    checkConnection();

    // Set up periodic checks every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    // Return cleanup function
    return () => {
      clearInterval(interval);
    };
  }

  // Get offline queue status
  getOfflineQueueStatus() {
    return {
      queued: this.offlineQueue.length,
      isOnline: this.isOnline,
      isConnected: this.isConnected
    };
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      socketExists: !!this.socket
    };
  }
}

export const socketService = new SocketService();
export default socketService;