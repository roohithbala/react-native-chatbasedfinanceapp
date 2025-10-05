import { Socket } from 'socket.io-client';

export class SocketCallHandlers {
  constructor(private socket: Socket | null) {}

  // Voice call methods
  sendCallOffer(offer: any, targetUserId: string, groupId?: string) {
    if (!this.socket?.connected) return;

    this.socket.emit('callOffer', { offer, targetUserId, groupId });
  }

  sendCallAnswer(answer: any, targetUserId: string, groupId?: string) {
    if (!this.socket?.connected) return;

    this.socket.emit('callAnswer', { answer, targetUserId, groupId });
  }

  sendIceCandidate(candidate: any, targetUserId: string, groupId?: string) {
    if (!this.socket?.connected) return;

    this.socket.emit('iceCandidate', { candidate, targetUserId, groupId });
  }

  endCall(targetUserId: string, groupId?: string) {
    if (!this.socket?.connected) return;

    this.socket.emit('endCall', { targetUserId, groupId });
  }

  sendCallEnd(targetUserId: string, groupId?: string) {
    if (!this.socket?.connected) return;

    this.socket.emit('callEnd', { targetUserId, groupId });
  }

  // Video call methods
  sendVideoCallOffer(offer: any, targetUserId: string, groupId?: string) {
    if (!this.socket?.connected) return;

    this.socket.emit('videoCallOffer', { offer, targetUserId, groupId });
  }

  sendVideoCallAnswer(answer: any, targetUserId: string, groupId?: string) {
    if (!this.socket?.connected) return;

    this.socket.emit('videoCallAnswer', { answer, targetUserId, groupId });
  }

  sendVideoIceCandidate(candidate: any, targetUserId: string, groupId?: string) {
    if (!this.socket?.connected) return;

    this.socket.emit('videoIceCandidate', { candidate, targetUserId, groupId });
  }

  endVideoCall(targetUserId: string, groupId?: string) {
    if (!this.socket?.connected) return;

    this.socket.emit('endVideoCall', { targetUserId, groupId });
  }

  // Participant management
  sendAddParticipant(data: { callId: string; participantId: string }) {
    if (!this.socket?.connected) return;

    this.socket.emit('addParticipant', data);
  }

  // Call event listeners
  onCallOffer(callback: (data: { offer: any; fromUserId: string; groupId?: string }) => void) {
    if (!this.socket) return;

    this.socket.on('callOffer', (data: { offer: any; fromUserId: string; groupId?: string }) => {
      callback(data);
    });
  }

  onCallAnswer(callback: (data: { answer: any; fromUserId: string; groupId?: string }) => void) {
    if (!this.socket) return;

    this.socket.on('callAnswer', (data: { answer: any; fromUserId: string; groupId?: string }) => {
      callback(data);
    });
  }

  onIceCandidate(callback: (data: { candidate: any; fromUserId: string; groupId?: string }) => void) {
    if (!this.socket) return;

    this.socket.on('iceCandidate', (data: { candidate: any; fromUserId: string; groupId?: string }) => {
      callback(data);
    });
  }

  onCallEnd(callback: (data: { fromUserId: string; groupId?: string }) => void) {
    if (!this.socket) return;

    this.socket.on('callEnd', (data: { fromUserId: string; groupId?: string }) => {
      callback(data);
    });
  }

  // Participant event listeners
  onParticipantJoined(callback: (data: { participant: any; callId: string }) => void) {
    if (!this.socket) return;

    this.socket.on('participantJoined', (data: { participant: any; callId: string }) => {
      callback(data);
    });
  }

  onParticipantLeft(callback: (data: { participantId: string; callId: string }) => void) {
    if (!this.socket) return;

    this.socket.on('participantLeft', (data: { participantId: string; callId: string }) => {
      callback(data);
    });
  }

  // Video call event listeners
  onVideoCallOffer(callback: (data: { offer: any; fromUserId: string; groupId?: string }) => void) {
    if (!this.socket) return;

    this.socket.on('videoCallOffer', (data: { offer: any; fromUserId: string; groupId?: string }) => {
      callback(data);
    });
  }

  onVideoCallAnswer(callback: (data: { answer: any; fromUserId: string; groupId?: string }) => void) {
    if (!this.socket) return;

    this.socket.on('videoCallAnswer', (data: { answer: any; fromUserId: string; groupId?: string }) => {
      callback(data);
    });
  }

  onVideoIceCandidate(callback: (data: { candidate: any; fromUserId: string; groupId?: string }) => void) {
    if (!this.socket) return;

    this.socket.on('videoIceCandidate', (data: { candidate: any; fromUserId: string; groupId?: string }) => {
      callback(data);
    });
  }

  onVideoCallEnd(callback: (data: { fromUserId: string; groupId?: string }) => void) {
    if (!this.socket) return;

    this.socket.on('videoCallEnd', (data: { fromUserId: string; groupId?: string }) => {
      callback(data);
    });
  }

  removeCallListeners() {
    if (!this.socket) return;

    this.socket.off('callOffer');
    this.socket.off('callAnswer');
    this.socket.off('iceCandidate');
    this.socket.off('callEnd');
    this.socket.off('videoCallOffer');
    this.socket.off('videoCallAnswer');
    this.socket.off('videoIceCandidate');
    this.socket.off('videoCallEnd');
    this.socket.off('participantJoined');
    this.socket.off('participantLeft');
  }
}