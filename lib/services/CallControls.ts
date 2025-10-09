// Call Controls - Provides easy access to call control functions
import { CallManager } from './CallManager';

export class CallControls {
  private callManager: CallManager;

  constructor(callManager: CallManager) {
    this.callManager = callManager;
  }

  // Media controls
  toggleMute(): boolean {
    return this.callManager.toggleMute();
  }

  toggleVideo(): boolean {
    return this.callManager.toggleVideo();
  }

  toggleSpeaker(): boolean {
    return this.callManager.toggleSpeaker();
  }

  async switchCamera(): Promise<boolean> {
    return this.callManager.switchCamera();
  }

  // Call controls
  endCall(): void {
    this.callManager.endCall();
  }

  // State getters
  isCallActive(): boolean {
    return this.callManager.isCallActive();
  }

  getCurrentCall() {
    return this.callManager.getCurrentCall();
  }

  getLocalStream() {
    return this.callManager.getLocalStream();
  }

  getRemoteStreams() {
    return this.callManager.getRemoteStreams();
  }
}