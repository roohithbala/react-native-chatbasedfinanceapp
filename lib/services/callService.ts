// Refactored Call Service - Uses composition of smaller modules
import { CallManager, CallData, CallParticipant } from './CallManager';
import { CallControls } from './CallControls';

class CallService {
  private callManager: CallManager;
  private callControls: CallControls;

  constructor() {
    this.callManager = new CallManager();
    this.callControls = new CallControls(this.callManager);
  }

  // Call lifecycle methods
  async startCall(participants: string[], type: 'voice' | 'video' = 'voice'): Promise<CallData> {
    return this.callManager.startCall(participants, type);
  }

  async answerCall(): Promise<void> {
    return this.callManager.answerCall();
  }

  endCall(): void {
    this.callControls.endCall();
  }

  async addParticipant(participantId: string): Promise<void> {
    return this.callManager.addParticipant(participantId);
  }

  // Media control methods
  toggleMute(): boolean {
    return this.callControls.toggleMute();
  }

  toggleVideo(): boolean {
    return this.callControls.toggleVideo();
  }

  toggleSpeaker(): boolean {
    return this.callControls.toggleSpeaker();
  }

  async switchCamera(): Promise<boolean> {
    return this.callControls.switchCamera();
  }

  // State getter methods
  getCurrentCall(): CallData | null {
    return this.callControls.getCurrentCall();
  }

  getLocalStream(): any {
    return this.callControls.getLocalStream();
  }

  getRemoteStreams(): Map<string, any> {
    return this.callControls.getRemoteStreams();
  }

  isCallActive(): boolean {
    return this.callControls.isCallActive();
  }

  // Event callback methods
  setEventCallbacks(callbacks: {
    onCallReceived?: (callData: CallData) => void;
    onCallAccepted?: (callData: CallData) => void;
    onCallEnded?: (callData: CallData) => void;
    onParticipantJoined?: (participant: CallParticipant) => void;
    onParticipantLeft?: (participantId: string) => void;
    onStreamReceived?: (participantId: string, stream: any) => void;
  }) {
    this.callManager.setEventCallbacks(callbacks);
  }
}

// Export interfaces for backward compatibility
export type { CallData, CallParticipant };

// Export singleton instance for backward compatibility
export const callService = new CallService();
export default callService;