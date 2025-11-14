import { SocketConnectionManager } from './SocketConnectionManager';
import { SocketMessageHandlers } from './SocketMessageHandlers';
import { SocketEventHandlers } from './SocketEventHandlers';
import { SocketCallHandlers } from './SocketCallHandlers';

export class SocketService {
  private connectionManager: SocketConnectionManager;
  private messageHandlers: SocketMessageHandlers;
  private eventHandlers: SocketEventHandlers;
  private callHandlers: SocketCallHandlers;

  constructor() {
    this.connectionManager = new SocketConnectionManager();
    this.messageHandlers = new SocketMessageHandlers(null);
    this.eventHandlers = new SocketEventHandlers(null);
    this.callHandlers = new SocketCallHandlers(null);
  }

  // Connection management
  async connect(): Promise<any> {
    const socket = await this.connectionManager.connect();
    if (socket) {
      this.messageHandlers = new SocketMessageHandlers(socket);
      this.eventHandlers = new SocketEventHandlers(socket);
      this.callHandlers = new SocketCallHandlers(socket);
    }
    return socket;
  }

  disconnect() {
    this.connectionManager.disconnect();
    this.messageHandlers = new SocketMessageHandlers(null);
    this.eventHandlers = new SocketEventHandlers(null);
    this.callHandlers = new SocketCallHandlers(null);
  }

  getSocket() {
    return this.connectionManager.getSocket();
  }

  isConnected() {
    return this.connectionManager.isSocketConnected();
  }

  getConnectionStatus() {
    return this.connectionManager.getConnectionStatus();
  }

  // Room management
  joinUserRoom(userId: string) {
    if (!this.connectionManager.getSocket()?.connected) return;
    this.connectionManager.getSocket()?.emit('joinUserRoom', { userId });
  }

  leaveUserRoom(userId: string) {
    if (!this.connectionManager.getSocket()?.connected) return;
    this.connectionManager.getSocket()?.emit('leaveUserRoom', { userId });
  }

  // Group management
  joinGroup(groupId: string) {
    if (!this.connectionManager.getSocket()?.connected) return;
    this.connectionManager.getSocket()?.emit('joinGroup', { groupId });
  }

  leaveGroup(groupId: string) {
    if (!this.connectionManager.getSocket()?.connected) return;
    this.connectionManager.getSocket()?.emit('leaveGroup', { groupId });
  }

  // Connection status
  onConnectionStatusChange(callback: (status: any) => void) {
    this.connectionManager.onConnectionStatusChange(callback);
  }

  // Error handling
  onError(callback: (error: any) => void) {
    this.connectionManager.onError(callback);
  }

  // Message handling
  sendMessage(messageData: any) {
    this.messageHandlers.sendMessage(messageData);
  }

  onReceiveMessage(callback: (message: any) => void) {
    this.messageHandlers.onReceiveMessage(callback);
  }

  onNewMessage(callback: (message: any) => void) {
    // Alias for onReceiveMessage that handles all message types
    this.messageHandlers.onReceiveMessage(callback);
  }

  onMessageSent(callback: (message: any) => void) {
    this.messageHandlers.onMessageSent(callback);
  }

  onMessageError(callback: (error: any) => void) {
    this.messageHandlers.onMessageError(callback);
  }

  formatMessageForSending(message: any, userId: string, groupId?: string) {
    return this.messageHandlers.formatMessageForSending(message, userId, groupId);
  }

  validateMessage(message: any): boolean {
    return this.messageHandlers.validateMessage(message);
  }

  // Event handling
  startTyping(userId: string, groupId?: string) {
    this.eventHandlers.startTyping(userId, groupId);
  }

  stopTyping(userId: string, groupId?: string) {
    this.eventHandlers.stopTyping(userId, groupId);
  }

  onTypingStart(callback: (data: { groupId: string; user: any }) => void) {
    this.eventHandlers.onTypingStart(callback);
  }

  onTypingStop(callback: (data: { groupId: string; user: any }) => void) {
    this.eventHandlers.onTypingStop(callback);
  }

  markMessageAsRead(messageId: string, userId: string, groupId?: string) {
    this.eventHandlers.markMessageAsRead(messageId, userId, groupId);
  }

  onMessageRead(callback: (data: { messageId: string; userId: string; groupId?: string; readAt?: Date }) => void) {
    this.eventHandlers.onMessageRead(callback);
  }

  setOnlineStatus(userId: string, isOnline: boolean) {
    this.eventHandlers.setOnlineStatus(userId, isOnline);
  }

  onUserOnline(callback: (data: { userId: string; isOnline: boolean }) => void) {
    this.eventHandlers.onUserOnline(callback);
  }

  onUserOffline(callback: (data: { userId: string; isOnline: boolean }) => void) {
    this.eventHandlers.onUserOffline(callback);
  }

  onExpenseUpdate(callback: (expense: any) => void) {
    this.eventHandlers.onExpenseUpdate(callback);
  }

  onGroupUpdate(callback: (group: any) => void) {
    this.eventHandlers.onGroupUpdate(callback);
  }

  onBudgetUpdate(callback: (budget: any) => void) {
    this.eventHandlers.onBudgetUpdate(callback);
  }

  onInsightUpdate(callback: (insight: any) => void) {
    this.eventHandlers.onInsightUpdate(callback);
  }

  onSplitBillUpdate(callback: (splitBill: any) => void) {
    this.eventHandlers.onSplitBillUpdate(callback);
  }

  onMessageDeleted(callback: (data: { messageId: string; userId: string }) => void) {
    this.eventHandlers.onMessageDeleted(callback);
  }

  offMessageDeleted() {
    this.eventHandlers.offMessageDeleted();
  }

  offSplitBillUpdate() {
    this.eventHandlers.offSplitBillUpdate();
  }

  // Call handling
  sendCallOffer(offer: any, targetUserId: string, groupId?: string) {
    this.callHandlers.sendCallOffer(offer, targetUserId, groupId);
  }

  sendCallAnswer(answer: any, targetUserId: string, groupId?: string) {
    this.callHandlers.sendCallAnswer(answer, targetUserId, groupId);
  }

  sendIceCandidate(candidate: any, targetUserId: string, groupId?: string) {
    this.callHandlers.sendIceCandidate(candidate, targetUserId, groupId);
  }

  endCall(targetUserId: string, groupId?: string) {
    this.callHandlers.endCall(targetUserId, groupId);
  }

  sendCallEnd(targetUserId: string, groupId?: string) {
    this.callHandlers.sendCallEnd(targetUserId, groupId);
  }

  sendVideoCallOffer(offer: any, targetUserId: string, groupId?: string) {
    this.callHandlers.sendVideoCallOffer(offer, targetUserId, groupId);
  }

  sendVideoCallAnswer(answer: any, targetUserId: string, groupId?: string) {
    this.callHandlers.sendVideoCallAnswer(answer, targetUserId, groupId);
  }

  sendVideoIceCandidate(candidate: any, targetUserId: string, groupId?: string) {
    this.callHandlers.sendVideoIceCandidate(candidate, targetUserId, groupId);
  }

  endVideoCall(targetUserId: string, groupId?: string) {
    this.callHandlers.endVideoCall(targetUserId, groupId);
  }

  sendAddParticipant(data: { callId: string; participantId: string }) {
    this.callHandlers.sendAddParticipant(data);
  }

  onCallOffer(callback: (data: { offer: any; fromUserId: string; groupId?: string }) => void) {
    this.callHandlers.onCallOffer(callback);
  }

  onCallAnswer(callback: (data: { answer: any; fromUserId: string; groupId?: string }) => void) {
    this.callHandlers.onCallAnswer(callback);
  }

  onIceCandidate(callback: (data: { candidate: any; fromUserId: string; groupId?: string }) => void) {
    this.callHandlers.onIceCandidate(callback);
  }

  onCallEnd(callback: (data: { fromUserId: string; groupId?: string }) => void) {
    this.callHandlers.onCallEnd(callback);
  }

  onParticipantJoined(callback: (data: { participant: any; callId: string }) => void) {
    this.callHandlers.onParticipantJoined(callback);
  }

  onParticipantLeft(callback: (data: { participantId: string; callId: string }) => void) {
    this.callHandlers.onParticipantLeft(callback);
  }

  onVideoCallOffer(callback: (data: { offer: any; fromUserId: string; groupId?: string }) => void) {
    this.callHandlers.onVideoCallOffer(callback);
  }

  onVideoCallAnswer(callback: (data: { answer: any; fromUserId: string; groupId?: string }) => void) {
    this.callHandlers.onVideoCallAnswer(callback);
  }

  onVideoIceCandidate(callback: (data: { candidate: any; fromUserId: string; groupId?: string }) => void) {
    this.callHandlers.onVideoIceCandidate(callback);
  }

  onVideoCallEnd(callback: (data: { fromUserId: string; groupId?: string }) => void) {
    this.callHandlers.onVideoCallEnd(callback);
  }

  // Cleanup
  removeAllListeners() {
    this.connectionManager.removeAllListeners();
    this.messageHandlers.removeMessageListeners();
    this.eventHandlers.removeEventListeners();
    this.callHandlers.removeCallListeners();
  }
}

// Export singleton instance for backward compatibility
export const socketService = new SocketService();
export default socketService;