import { Socket } from 'socket.io-client';

export class SocketEventHandlers {
  constructor(private socket: Socket | null) {}

  // Typing indicators
  startTyping(userId: string, groupId?: string) {
    if (!this.socket?.connected) return;

    this.socket.emit('startTyping', { userId, groupId });
  }

  stopTyping(userId: string, groupId?: string) {
    if (!this.socket?.connected) return;

    this.socket.emit('stopTyping', { userId, groupId });
  }

  onTypingStart(callback: (data: { groupId: string; user: any }) => void) {
    if (!this.socket) return;

    this.socket.on('user-typing-start', (data: { groupId: string; user: any }) => {
      callback(data);
    });
  }

  onTypingStop(callback: (data: { groupId: string; user: any }) => void) {
    if (!this.socket) return;

    this.socket.on('user-typing-stop', (data: { groupId: string; user: any }) => {
      callback(data);
    });
  }

  // Read receipts
  markMessageAsRead(messageId: string, userId: string, groupId?: string) {
    if (!this.socket?.connected) return;

    this.socket.emit('markAsRead', { messageId, userId, groupId });
  }

  onMessageRead(callback: (data: { messageId: string; userId: string; groupId?: string; readAt?: Date }) => void) {
    if (!this.socket) return;

    this.socket.on('messageRead', (data: { messageId: string; userId: string; groupId?: string; readAt?: Date }) => {
      callback(data);
    });
  }

  // Online status
  setOnlineStatus(userId: string, isOnline: boolean) {
    if (!this.socket?.connected) return;

    this.socket.emit('setOnlineStatus', { userId, isOnline });
  }

  onUserOnline(callback: (data: { userId: string; isOnline: boolean }) => void) {
    if (!this.socket) return;

    this.socket.on('userOnline', (data: { userId: string; isOnline: boolean }) => {
      callback(data);
    });
  }

  onUserOffline(callback: (data: { userId: string; isOnline: boolean }) => void) {
    if (!this.socket) return;

    this.socket.on('userOffline', (data: { userId: string; isOnline: boolean }) => {
      callback(data);
    });
  }

  // Real-time updates
  onExpenseUpdate(callback: (expense: any) => void) {
    if (!this.socket) return;

    this.socket.on('expenseUpdate', (expense: any) => {
      callback(expense);
    });
  }

  onGroupUpdate(callback: (group: any) => void) {
    if (!this.socket) return;

    this.socket.on('groupUpdate', (group: any) => {
      callback(group);
    });
  }

  onBudgetUpdate(callback: (budget: any) => void) {
    if (!this.socket) return;

    this.socket.on('budgetUpdate', (budget: any) => {
      callback(budget);
    });
  }

  onInsightUpdate(callback: (insight: any) => void) {
    if (!this.socket) return;

    this.socket.on('insightUpdate', (insight: any) => {
      callback(insight);
    });
  }

  onSplitBillUpdate(callback: (splitBill: any) => void) {
    if (!this.socket) return;

    this.socket.on('splitBillUpdate', (splitBill: any) => {
      callback(splitBill);
    });
  }

  removeEventListeners() {
    if (!this.socket) return;

    this.socket.off('typingStart');
    this.socket.off('typingStop');
    this.socket.off('messageRead');
    this.socket.off('userOnline');
    this.socket.off('userOffline');
    this.socket.off('expenseUpdate');
    this.socket.off('groupUpdate');
    this.socket.off('budgetUpdate');
    this.socket.off('insightUpdate');
    this.socket.off('splitBillUpdate');
  }
}