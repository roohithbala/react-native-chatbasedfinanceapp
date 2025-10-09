// WebRTC Manager - Handles peer connections and WebRTC setup
export class WebRTCManager {
  private peerConnection: any = null;
  private remoteStreams: Map<string, any> = new Map();

  // ICE servers for WebRTC
  private iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      // Add TURN servers for production
      // { urls: 'turn:your-turn-server.com', username: 'user', credential: 'pass' }
    ]
  };

  constructor() {
    this.initializeWebRTC();
  }

  private initializeWebRTC() {
    // Static import with error handling for WebRTC availability
    let WebRTC: any = null;
    let RTCPeerConnection: any = null;
    let RTCIceCandidate: any = null;
    let RTCSessionDescription: any = null;

    try {
      const webrtcModule = require('react-native-webrtc');
      WebRTC = webrtcModule;
      RTCPeerConnection = webrtcModule.RTCPeerConnection;
      RTCIceCandidate = webrtcModule.RTCIceCandidate;
      RTCSessionDescription = webrtcModule.RTCSessionDescription;
      console.log('✅ WebRTC module loaded successfully');
    } catch (error) {
      console.warn('⚠️ WebRTC native module not available. Call functionality will be simulated.');
      console.warn('Error details:', error);
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
    }

    // Assign to global scope for use in methods
    (global as any).WebRTC = WebRTC;
    (global as any).RTCPeerConnection = RTCPeerConnection;
    (global as any).RTCIceCandidate = RTCIceCandidate;
    (global as any).RTCSessionDescription = RTCSessionDescription;
  }

  createPeerConnection(): any {
    const RTCPeerConnection = (global as any).RTCPeerConnection;
    if (!RTCPeerConnection) {
      throw new Error('WebRTC not available');
    }

    this.peerConnection = new RTCPeerConnection(this.iceServers);
    this.setupPeerConnectionHandlers();
    return this.peerConnection;
  }

  async createOffer(): Promise<any> {
    if (!this.peerConnection) throw new Error('No peer connection');
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(): Promise<any> {
    if (!this.peerConnection) throw new Error('No peer connection');
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  async setRemoteDescription(description: any): Promise<void> {
    if (!this.peerConnection) throw new Error('No peer connection');
    const RTCSessionDescription = (global as any).RTCSessionDescription;
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(description));
  }

  async addIceCandidate(candidate: any): Promise<void> {
    if (!this.peerConnection) throw new Error('No peer connection');
    const RTCIceCandidate = (global as any).RTCIceCandidate;
    if (candidate) {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  addTrack(track: any, stream: any): void {
    if (this.peerConnection) {
      this.peerConnection.addTrack(track, stream);
    }
  }

  getSenders(): any[] {
    return this.peerConnection ? this.peerConnection.getSenders() : [];
  }

  close(): void {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }

  private setupPeerConnectionHandlers() {
    if (!this.peerConnection) return;

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event: any) => {
      // ICE candidate handling will be done by the call manager
      if (event.candidate) {
        // Emit event for call manager to handle
        if ((global as any).onIceCandidate) {
          (global as any).onIceCandidate(event.candidate);
        }
      }
    };

    // Handle remote stream
    this.peerConnection.ontrack = (event: any) => {
      console.log('📡 Remote track received:', event.streams[0]);
      const remoteStream = event.streams[0];
      // In a multi-party call, you'd identify the participant
      this.remoteStreams.set('remote', remoteStream);
      if ((global as any).onStreamReceived) {
        (global as any).onStreamReceived('remote', remoteStream);
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', this.peerConnection?.connectionState);
      // Connection state handling will be done by the call manager
    };
  }

  getRemoteStreams(): Map<string, any> {
    return this.remoteStreams;
  }

  clearRemoteStreams(): void {
    this.remoteStreams.clear();
  }
}