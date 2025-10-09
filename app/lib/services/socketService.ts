import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './api';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    try {
      if (this.socket?.connected) {
        return;
      }

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('No auth token available for socket connection');
        return;
      }

      this.socket = io(API_BASE_URL, {
        auth: {
          token: token.replace('Bearer ', ''),
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id);
        this.isConnected = true;
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        this.isConnected = false;
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });

    } catch (error) {
      console.error('Failed to initialize socket connection:', error);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Join user room for receiving direct messages
  joinUserRoom(userId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('joinUserRoom', { userId });
    }
  }

  // Leave user room
  leaveUserRoom(userId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('leaveUserRoom', { userId });
    }
  }

  // Listen for new messages
  onNewMessage(callback: (message: any) => void): void {
    if (this.socket) {
      this.socket.on('newMessage', callback);
    }
  }

  // Remove message listener
  offNewMessage(): void {
    if (this.socket) {
      this.socket.off('newMessage');
    }
  }

  // Listen for group messages
  onGroupMessage(callback: (message: any) => void): void {
    if (this.socket) {
      this.socket.on('groupMessage', callback);
    }
  }

  // Remove group message listener
  offGroupMessage(): void {
    if (this.socket) {
      this.socket.off('groupMessage');
    }
  }

  // Listen for message deletions
  onMessageDeleted(callback: (data: { messageId: string; userId: string }) => void): void {
    if (this.socket) {
      this.socket.on('messageDeleted', callback);
    }
  }

  // Remove message deleted listener
  offMessageDeleted(): void {
    if (this.socket) {
      this.socket.off('messageDeleted');
    }
  }

  // Listen for messages being read
  onMessagesRead(callback: (data: { userId: string; readAt: Date }) => void): void {
    if (this.socket) {
      console.log('🔔 Registering messagesRead listener');
      this.socket.on('messagesRead', (data) => {
        console.log('🔔 messagesRead event received:', data);
        callback(data);
      });
    } else {
      console.warn('⚠️ Cannot register messagesRead listener - socket not connected');
    }
  }

  // Remove messages read listener
  offMessagesRead(): void {
    if (this.socket) {
      this.socket.off('messagesRead');
    }
  }

  // Listen for split bill updates
  onSplitBillUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      console.log('🔔 Registering splitBillUpdate listener');
      this.socket.on('splitBillUpdate', (data) => {
        console.log('🔔 splitBillUpdate event received in socketService:', data);
        callback(data);
      });
    } else {
      console.warn('⚠️ Cannot register splitBillUpdate listener - socket not connected');
    }
  }

  // Remove split bill update listener
  offSplitBillUpdate(): void {
    if (this.socket) {
      this.socket.off('splitBillUpdate');
    }
  }

  // Join group room
  joinGroup(groupId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('joinGroup', { groupId });
    }
  }

  // Leave group room
  leaveGroup(groupId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('leaveGroup', { groupId });
    }
  }

  // Voice call events
  onCallOffer(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('callOffer', callback);
    }
  }

  emitCallOffer(data: { offer: any; targetUserId: string; groupId?: string }): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('callOffer', data);
    }
  }

  onCallAnswer(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('callAnswer', callback);
    }
  }

  emitCallAnswer(data: { answer: any; targetUserId: string; groupId?: string }): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('callAnswer', data);
    }
  }

  onIceCandidate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('iceCandidate', callback);
    }
  }

  emitIceCandidate(data: { candidate: any; targetUserId: string; groupId?: string }): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('iceCandidate', data);
    }
  }

  onCallEnd(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('callEnd', callback);
    }
  }

  emitCallEnd(data: { targetUserId?: string; groupId?: string }): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('callEnd', data);
    }
  }

  // Video call events
  onVideoCallOffer(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('videoCallOffer', callback);
    }
  }

  emitVideoCallOffer(data: { offer: any; targetUserId: string; groupId?: string }): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('videoCallOffer', data);
    }
  }

  onVideoCallAnswer(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('videoCallAnswer', callback);
    }
  }

  emitVideoCallAnswer(data: { answer: any; targetUserId: string; groupId?: string }): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('videoCallAnswer', data);
    }
  }

  onVideoIceCandidate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('videoIceCandidate', callback);
    }
  }

  emitVideoIceCandidate(data: { candidate: any; targetUserId: string; groupId?: string }): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('videoIceCandidate', data);
    }
  }

  onVideoCallEnd(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('videoCallEnd', callback);
    }
  }

  emitVideoCallEnd(data: { targetUserId?: string; groupId?: string }): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('videoCallEnd', data);
    }
  }

  // Group call events
  onParticipantJoined(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('participantJoined', callback);
    }
  }

  emitAddParticipant(data: { callId: string; participantId: string }): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('addParticipant', data);
    }
  }

  get isSocketConnected(): boolean {
    return this.isConnected;
  }

  get socketInstance(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();