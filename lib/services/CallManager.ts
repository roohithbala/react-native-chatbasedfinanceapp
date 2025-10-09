// Call Manager - Handles call lifecycle and state management
import socketService from './socketService';
import { useCallStore } from '../store/callStore';
import { WebRTCManager } from './WebRTCManager';
import { MediaManager } from './MediaManager';

export interface CallParticipant {
  userId: string;
  name: string;
  avatar?: string;
  stream?: any;
  isMuted?: boolean;
  isVideoOff?: boolean;
}

export interface CallData {
  callId: string;
  callerId: string;
  callerName: string;
  participants: CallParticipant[];
  type: 'voice' | 'video';
  status: 'ringing' | 'connecting' | 'connected' | 'ended';
  startTime?: Date;
  endTime?: Date;
  groupId?: string;
}

export class CallManager {
  private currentCall: CallData | null = null;
  private webRTCManager: WebRTCManager;
  private mediaManager: MediaManager;

  // Event callbacks
  private onCallReceived?: (callData: CallData) => void;
  private onCallAccepted?: (callData: CallData) => void;
  private onCallEnded?: (callData: CallData) => void;
  private onParticipantJoined?: (participant: CallParticipant) => void;
  private onParticipantLeft?: (participantId: string) => void;
  private onStreamReceived?: (participantId: string, stream: any) => void;

  constructor() {
    this.webRTCManager = new WebRTCManager();
    this.mediaManager = new MediaManager();
    this.setupSocketListeners();
    this.setupGlobalCallbacks();
  }

  private setupGlobalCallbacks() {
    // Set up global callbacks for WebRTC manager
    (global as any).onIceCandidate = (candidate: any) => {
      if (this.currentCall) {
        socketService.sendIceCandidate({
          callId: this.currentCall.callId,
          candidate,
          participants: this.currentCall.participants.map(p => p.userId)
        }, this.currentCall.participants[0].userId, this.currentCall.groupId);
      }
    };

    (global as any).onStreamReceived = (participantId: string, stream: any) => {
      this.onStreamReceived?.(participantId, stream);
    };

    (global as any).replaceVideoTrack = (newVideoTrack: any) => {
      const senders = this.webRTCManager.getSenders();
      const sender = senders.find((s: any) => s.track?.kind === 'video');
      if (sender) {
        sender.replaceTrack(newVideoTrack);
      }
    };
  }

  private setupSocketListeners() {
    // Listen for incoming call offers
    socketService.onCallOffer((data: any) => {
      console.log('📞 Incoming call offer:', data);
      this.currentCall = {
        callId: data.callId,
        callerId: data.callerId,
        callerName: data.callerName,
        participants: data.participants || [],
        type: data.type,
        status: 'ringing'
      };
      // Directly update call store for global incoming call handling
      useCallStore.getState().setIncomingCall(this.currentCall);
      this.onCallReceived?.(this.currentCall);
    });

    // Listen for call answers
    socketService.onCallAnswer((data: any) => {
      console.log('📞 Call answered:', data);
      if (data.answer) {
        this.webRTCManager.setRemoteDescription(data.answer);
        this.currentCall!.status = 'connecting';
        this.onCallAccepted?.(this.currentCall!);
      }
    });

    // Listen for ICE candidates
    socketService.onIceCandidate((data: any) => {
      console.log('🧊 ICE candidate received:', data);
      if (data.candidate) {
        this.webRTCManager.addIceCandidate(data.candidate);
      }
    });

    // Listen for call end
    socketService.onCallEnd((data: any) => {
      console.log('📞 Call ended:', data);
      this.endCall();
      this.onCallEnded?.(this.currentCall!);
    });

    // Listen for participant updates
    socketService.onParticipantJoined((data: any) => {
      console.log('👥 Participant joined:', data);
      if (this.currentCall) {
        this.currentCall.participants.push(data.participant);
        this.onParticipantJoined?.(data.participant);
      }
    });

    socketService.onParticipantLeft((data: any) => {
      console.log('👋 Participant left:', data);
      if (this.currentCall) {
        this.currentCall.participants = this.currentCall.participants.filter(
          p => p.userId !== data.participantId
        );
        this.webRTCManager.getRemoteStreams().delete(data.participantId);
        this.onParticipantLeft?.(data.participantId);
      }
    });
  }

  // Start a call
  async startCall(participants: string[], type: 'voice' | 'video' = 'voice'): Promise<CallData> {
    try {
      console.log('📞 Starting call with participants:', participants);

      // Initialize media
      const localStream = await this.mediaManager.initializeMedia(type);

      // Create peer connection
      const peerConnection = this.webRTCManager.createPeerConnection();

      // Add local stream to peer connection
      if (localStream) {
        localStream.getTracks().forEach((track: any) => {
          this.webRTCManager.addTrack(track, localStream);
        });
      }

      // Create call data
      this.currentCall = {
        callId: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        callerId: 'current_user', // Will be set by caller
        callerName: 'You',
        participants: participants.map(id => ({
          userId: id,
          name: 'Participant',
          isMuted: false,
          isVideoOff: false
        })),
        type,
        status: 'connecting',
        startTime: new Date()
      };

      // Create offer
      const offer = await this.webRTCManager.createOffer();

      // Send call offer via socket
      socketService.sendCallOffer({
        callId: this.currentCall.callId,
        participants,
        type,
        offer
      }, this.currentCall.participants[0].userId, this.currentCall.groupId);

      console.log('📞 Call started successfully');
      return this.currentCall;
    } catch (error) {
      console.error('❌ Failed to start call:', error);
      this.cleanup();
      throw error;
    }
  }

  // Answer an incoming call
  async answerCall(): Promise<void> {
    try {
      if (!this.currentCall) throw new Error('No incoming call');

      console.log('📞 Answering call:', this.currentCall.callId);

      // Initialize media
      const localStream = await this.mediaManager.initializeMedia(this.currentCall.type);

      // Create peer connection
      const peerConnection = this.webRTCManager.createPeerConnection();

      // Add local stream to peer connection
      if (localStream) {
        localStream.getTracks().forEach((track: any) => {
          this.webRTCManager.addTrack(track, localStream);
        });
      }

      // Create answer
      const answer = await this.webRTCManager.createAnswer();

      // Send answer via socket
      socketService.sendCallAnswer({
        callId: this.currentCall.callId,
        answer
      }, this.currentCall.participants[0].userId, this.currentCall.groupId);

      this.currentCall.status = 'connected';
      console.log('📞 Call answered successfully');
    } catch (error) {
      console.error('❌ Failed to answer call:', error);
      this.cleanup();
      throw error;
    }
  }

  // End current call
  endCall(): void {
    console.log('📞 Ending call');

    if (this.currentCall) {
      socketService.sendCallEnd(this.currentCall.participants[0].userId, this.currentCall.groupId);
    }

    this.cleanup();
    this.currentCall = null;
  }

  // Add participant to ongoing call
  async addParticipant(participantId: string): Promise<void> {
    if (!this.currentCall) throw new Error('No active call');

    socketService.sendAddParticipant({
      callId: this.currentCall.callId,
      participantId
    });
  }

  // Get current call data
  getCurrentCall(): CallData | null {
    return this.currentCall;
  }

  // Get local stream
  getLocalStream(): any {
    return this.mediaManager.getLocalStream();
  }

  // Get remote streams
  getRemoteStreams(): Map<string, any> {
    return this.webRTCManager.getRemoteStreams();
  }

  // Check if call is active
  isCallActive(): boolean {
    return this.currentCall !== null && this.currentCall.status === 'connected';
  }

  // Set event callbacks
  setEventCallbacks(callbacks: {
    onCallReceived?: (callData: CallData) => void;
    onCallAccepted?: (callData: CallData) => void;
    onCallEnded?: (callData: CallData) => void;
    onParticipantJoined?: (participant: CallParticipant) => void;
    onParticipantLeft?: (participantId: string) => void;
    onStreamReceived?: (participantId: string, stream: any) => void;
  }) {
    this.onCallReceived = callbacks.onCallReceived;
    this.onCallAccepted = callbacks.onCallAccepted;
    this.onCallEnded = callbacks.onCallEnded;
    this.onParticipantJoined = callbacks.onParticipantJoined;
    this.onParticipantLeft = callbacks.onParticipantLeft;
    this.onStreamReceived = callbacks.onStreamReceived;
  }

  // Media controls
  toggleMute(): boolean {
    return this.mediaManager.toggleMute();
  }

  toggleVideo(): boolean {
    return this.mediaManager.toggleVideo();
  }

  toggleSpeaker(): boolean {
    return this.mediaManager.toggleSpeaker();
  }

  async switchCamera(): Promise<boolean> {
    return this.mediaManager.switchCamera();
  }

  private cleanup() {
    // Close peer connection
    this.webRTCManager.close();

    // Stop local stream
    this.mediaManager.stopStream();

    // Clear remote streams
    this.webRTCManager.clearRemoteStreams();
  }
}