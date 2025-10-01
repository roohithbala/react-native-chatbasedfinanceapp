// Dynamic import to handle WebRTC availability
let WebRTC: any = null;
let RTCPeerConnection: any = null;
let RTCIceCandidate: any = null;
let RTCSessionDescription: any = null;
let mediaDevices: any = null;
let MediaStream: any = null;

try {
  const webrtcModule = require('react-native-webrtc');
  WebRTC = webrtcModule;
  RTCPeerConnection = webrtcModule.RTCPeerConnection;
  RTCIceCandidate = webrtcModule.RTCIceCandidate;
  RTCSessionDescription = webrtcModule.RTCSessionDescription;
  mediaDevices = webrtcModule.mediaDevices;
  MediaStream = webrtcModule.MediaStream;
} catch (error) {
  console.warn('WebRTC native module not available. Call functionality will be simulated.');
  // Create mock classes for when WebRTC isn't available
  RTCPeerConnection = class MockRTCPeerConnection {
    constructor() {}
    addEventListener() {}
    createOffer() { return Promise.resolve({ type: 'offer', sdp: 'mock-sdp' }); }
    createAnswer() { return Promise.resolve({ type: 'answer', sdp: 'mock-sdp' }); }
    setLocalDescription() { return Promise.resolve(); }
    setRemoteDescription() { return Promise.resolve(); }
    addIceCandidate() { return Promise.resolve(); }
    close() {}
  };

  RTCIceCandidate = class MockRTCIceCandidate {};
  RTCSessionDescription = class MockRTCSessionDescription {};
  MediaStream = class MockMediaStream {
    getTracks() { return []; }
    getAudioTracks() { return []; }
    getVideoTracks() { return []; }
  };

  mediaDevices = {
    getUserMedia: () => Promise.resolve(new MediaStream()),
    enumerateDevices: () => Promise.resolve([])
  };
}

import socketService from './socketService';
import { useCallStore } from '../store/callStore';

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
}

class CallService {
  private peerConnection: any = null;
  private localStream: any = null;
  private remoteStreams: Map<string, any> = new Map();
  private currentCall: CallData | null = null;
  private isMuted = false;
  private isVideoOff = false;
  private isSpeakerOn = false;

  // ICE servers for WebRTC
  private iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      // Add TURN servers for production
      // { urls: 'turn:your-turn-server.com', username: 'user', credential: 'pass' }
    ]
  };

  // Event callbacks
  private onCallReceived?: (callData: CallData) => void;
  private onCallAccepted?: (callData: CallData) => void;
  private onCallEnded?: (callData: CallData) => void;
  private onParticipantJoined?: (participant: CallParticipant) => void;
  private onParticipantLeft?: (participantId: string) => void;
  private onStreamReceived?: (participantId: string, stream: MediaStream) => void;

  constructor() {
    this.setupSocketListeners();
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
      if (this.peerConnection && data.answer) {
        this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        this.currentCall!.status = 'connecting';
        this.onCallAccepted?.(this.currentCall!);
      }
    });

    // Listen for ICE candidates
    socketService.onIceCandidate((data: any) => {
      console.log('🧊 ICE candidate received:', data);
      if (this.peerConnection && data.candidate) {
        this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
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
        this.remoteStreams.delete(data.participantId);
        this.onParticipantLeft?.(data.participantId);
      }
    });
  }

  // Initialize media devices
  async initializeMedia(type: 'voice' | 'video' = 'voice'): Promise<any> {
    if (!WebRTC) {
      console.warn('WebRTC not available, simulating media initialization');
      this.localStream = new MediaStream();
      return this.localStream;
    }

    try {
      const constraints = {
        audio: true,
        video: type === 'video' ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false
      };

      console.log('🎤 Initializing media with constraints:', constraints);
      this.localStream = await mediaDevices.getUserMedia(constraints);
      console.log('✅ Media initialized successfully');
      return this.localStream;
    } catch (error) {
      console.error('❌ Failed to initialize media:', error);
      throw error;
    }
  }

  // Start a call
  async startCall(participants: string[], type: 'voice' | 'video' = 'voice'): Promise<CallData> {
    try {
      console.log('📞 Starting call with participants:', participants);

      // Initialize media
      await this.initializeMedia(type);

      // Create peer connection
      this.peerConnection = new RTCPeerConnection(this.iceServers);

      // Add local stream to peer connection
      if (this.localStream && WebRTC) {
        this.localStream.getTracks().forEach((track: any) => {
          this.peerConnection!.addTrack(track, this.localStream!);
        });
      }

      // Set up peer connection event handlers
      this.setupPeerConnectionHandlers();

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
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      // Send call offer via socket
      socketService.sendCallOffer({
        callId: this.currentCall.callId,
        participants,
        type,
        offer
      });

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
      await this.initializeMedia(this.currentCall.type);

      // Create peer connection
      this.peerConnection = new RTCPeerConnection(this.iceServers);

      // Add local stream to peer connection
      if (this.localStream && WebRTC) {
        this.localStream.getTracks().forEach((track: any) => {
          this.peerConnection!.addTrack(track, this.localStream!);
        });
      }

      // Set up peer connection event handlers
      this.setupPeerConnectionHandlers();

      // Create answer
      // Note: In a real implementation, you'd receive the offer first
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      // Send answer via socket
      socketService.sendCallAnswer({
        callId: this.currentCall.callId,
        answer
      });

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
      socketService.sendCallEnd({
        callId: this.currentCall.callId,
        participants: this.currentCall.participants.map(p => p.userId)
      });
    }

    this.cleanup();
    this.currentCall = null;
  }

  // Toggle mute
  toggleMute(): boolean {
    if (!this.localStream) return false;

    const audioTracks = this.localStream.getAudioTracks();
    audioTracks.forEach((track: any) => {
      track.enabled = this.isMuted;
    });

    this.isMuted = !this.isMuted;
    console.log('🎤 Mute toggled:', this.isMuted);
    return this.isMuted;
  }

  // Toggle video
  toggleVideo(): boolean {
    if (!this.localStream) return false;

    const videoTracks = this.localStream.getVideoTracks();
    videoTracks.forEach((track: any) => {
      track.enabled = this.isVideoOff;
    });

    this.isVideoOff = !this.isVideoOff;
    console.log('📹 Video toggled:', this.isVideoOff);
    return this.isVideoOff;
  }

  // Toggle speaker
  toggleSpeaker(): boolean {
    // Note: Speaker toggle is handled at OS level in React Native
    this.isSpeakerOn = !this.isSpeakerOn;
    console.log('🔊 Speaker toggled:', this.isSpeakerOn);
    return this.isSpeakerOn;
  }

  // Switch camera (front/back)
  async switchCamera(): Promise<boolean> {
    if (!WebRTC || !this.localStream) return false;

    const videoTracks = this.localStream.getVideoTracks();
    if (videoTracks.length === 0) return false;

    const videoTrack = videoTracks[0];
    const currentFacingMode = videoTrack.getSettings().facingMode || 'user';
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

    // Stop current track
    videoTrack.stop();

    // Get new stream with switched camera
    const constraints = {
      audio: true,
      video: {
        facingMode: newFacingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      }
    };

    try {
      const newStream: any = await mediaDevices.getUserMedia(constraints);
      const newVideoTrack: any = newStream.getVideoTracks()[0];

      // Replace track in peer connection
      if (this.peerConnection) {
        const sender: any = this.peerConnection.getSenders().find((s: any) => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(newVideoTrack);
        }
      }

      // Replace track in local stream
      this.localStream!.removeTrack(videoTrack);
      this.localStream!.addTrack(newVideoTrack);

      console.log('📹 Camera switched to:', newFacingMode);
      return true;
    } catch (error: any) {
      console.error('❌ Failed to switch camera:', error);
      return false;
    }
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
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  // Get remote streams
  getRemoteStreams(): Map<string, MediaStream> {
    return this.remoteStreams;
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
    onStreamReceived?: (participantId: string, stream: MediaStream) => void;
  }) {
    this.onCallReceived = callbacks.onCallReceived;
    this.onCallAccepted = callbacks.onCallAccepted;
    this.onCallEnded = callbacks.onCallEnded;
    this.onParticipantJoined = callbacks.onParticipantJoined;
    this.onParticipantLeft = callbacks.onParticipantLeft;
    this.onStreamReceived = callbacks.onStreamReceived;
  }

  private setupPeerConnectionHandlers() {
    if (!this.peerConnection) return;

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event: any) => {
      if (event.candidate && this.currentCall) {
        socketService.sendIceCandidate({
          callId: this.currentCall.callId,
          candidate: event.candidate,
          participants: this.currentCall.participants.map(p => p.userId)
        });
      }
    };

    // Handle remote stream
    this.peerConnection.ontrack = (event: any) => {
      console.log('📡 Remote track received:', event.streams[0]);
      const remoteStream = event.streams[0];
      // In a multi-party call, you'd identify the participant
      this.remoteStreams.set('remote', remoteStream);
      this.onStreamReceived?.('remote', remoteStream);
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', this.peerConnection?.connectionState);
      if (this.peerConnection?.connectionState === 'connected' && this.currentCall) {
        this.currentCall.status = 'connected';
      }
    };
  }

  private cleanup() {
    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach((track: any) => track.stop());
      this.localStream = null;
    }

    // Clear remote streams
    this.remoteStreams.clear();

    // Reset state
    this.isMuted = false;
    this.isVideoOff = false;
    this.isSpeakerOn = false;
  }
}

export const callService = new CallService();
export default callService;