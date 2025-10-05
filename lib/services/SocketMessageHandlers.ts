import { Socket } from 'socket.io-client';

export class SocketMessageHandlers {
  constructor(private socket: Socket | null) {}

  sendMessage(messageData: any) {
    if (!this.socket?.connected) {
      console.warn('⚠️ Socket not connected, cannot send message');
      return;
    }

    console.log('📤 Sending message:', messageData);
    this.socket.emit('sendMessage', messageData);
  }

  onReceiveMessage(callback: (message: any) => void) {
    if (!this.socket) return;

    this.socket.on('receiveMessage', (message: any) => {
      console.log('📥 Received message:', message);
      callback(message);
    });
  }

  onMessageSent(callback: (message: any) => void) {
    if (!this.socket) return;

    this.socket.on('messageSent', (message: any) => {
      console.log('✅ Message sent confirmation:', message);
      callback(message);
    });
  }

  onMessageError(callback: (error: any) => void) {
    if (!this.socket) return;

    this.socket.on('messageError', (error: any) => {
      console.error('❌ Message error:', error);
      callback(error);
    });
  }

  formatMessageForSending(message: any, userId: string, groupId?: string) {
    return {
      ...message,
      senderId: userId,
      groupId: groupId || null,
      timestamp: new Date().toISOString(),
      messageId: `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  validateMessage(message: any): boolean {
    return !!(
      message &&
      typeof message === 'object' &&
      (message.text || message.image || message.audio || message.video) &&
      message.senderId
    );
  }

  removeMessageListeners() {
    if (!this.socket) return;

    this.socket.off('receiveMessage');
    this.socket.off('messageSent');
    this.socket.off('messageError');
  }
}