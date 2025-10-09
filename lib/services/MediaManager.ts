// Media Manager - Handles camera/microphone permissions and media streams
export class MediaManager {
  private localStream: any = null;
  private isMuted = false;
  private isVideoOff = false;
  private isSpeakerOn = false;

  constructor() {
    this.initializeMediaDevices();
  }

  private initializeMediaDevices() {
    // Initialize media devices
    let mediaDevices: any = null;
    let MediaStream: any = null;

    try {
      const webrtcModule = require('react-native-webrtc');
      mediaDevices = webrtcModule.mediaDevices;
      MediaStream = webrtcModule.MediaStream;
    } catch (error) {
      console.warn('WebRTC media devices not available, using mock implementations');
      MediaStream = class MockMediaStream {
        getTracks() { return []; }
        getAudioTracks() { return []; }
        getVideoTracks() { return []; }
      };

      mediaDevices = {
        getUserMedia: (constraints: any) => {
          console.log('🎤 Mock getUserMedia called with constraints:', constraints);
          return Promise.resolve(new MediaStream());
        },
        enumerateDevices: () => Promise.resolve([])
      };
    }

    (global as any).mediaDevices = mediaDevices;
    (global as any).MediaStream = MediaStream;
  }

  // Request camera and microphone permissions
  async requestPermissions(type: 'voice' | 'video' = 'voice'): Promise<boolean> {
    let Camera: any = null;
    let Audio: any = null;

    try {
      console.log('🎤 Requesting permissions for type:', type);

      // Import Expo permissions
      try {
        Camera = require('expo-camera');
        // Use expo-av for audio permissions
        const expoAv = require('expo-av');
        Audio = expoAv.Audio;
      } catch (error) {
        console.warn('Expo permissions modules not available:', error);
      }

      console.log('📷 Camera module available:', !!Camera);
      console.log('🎵 Audio module available:', !!Audio);

      if (Camera && type === 'video') {
        console.log('📷 Requesting camera permissions...');
        const cameraPermission = await Camera.requestCameraPermissionsAsync();
        console.log('📷 Camera permission result:', cameraPermission);
        if (cameraPermission.status !== 'granted') {
          console.error('❌ Camera permission denied');
          return false;
        }
      }

      if (Audio && typeof Audio.requestPermissionsAsync === 'function') {
        console.log('🎵 Requesting audio permissions...');
        const audioPermission = await Audio.requestPermissionsAsync();
        console.log('🎵 Audio permission result:', audioPermission);
        if (audioPermission.status !== 'granted') {
          console.error('❌ Audio permission denied by user');
          return false;
        }
      } else {
        console.error('❌ Audio.requestPermissionsAsync not available - expo-av module not loaded');
        console.warn('⚠️ Voice/video calls require expo-av module');
        return false;
      }

      console.log('✅ Permissions granted for', type, 'call');
      return true;
    } catch (error) {
      console.error('❌ Failed to request permissions:', error);

      // If Expo modules are not available, show user-friendly message
      if (!Camera || !Audio) {
        console.warn('⚠️ Expo Camera/Audio modules not available');
        console.warn('⚠️ This may be due to:');
        console.warn('   1. Modules not properly installed (run: npx expo install expo-camera expo-av)');
        console.warn('   2. App.json plugins not configured');
        console.warn('   3. Native build required after config changes (run: npx expo prebuild --clean)');
        console.warn('   4. Metro cache needs clearing (run: npx expo start -c)');
        console.warn('⚠️ For Expo Go, voice/video calls require a development build.');
        console.warn('⚠️ Run: npx expo run:android or npx expo run:ios');
        
        // Return false to prevent confusing errors downstream
        return false;
      }

      return false;
    }
  }

  // Initialize media devices
  async initializeMedia(type: 'voice' | 'video' = 'voice'): Promise<any> {
    // Request permissions first
    const permissionsGranted = await this.requestPermissions(type);
    if (!permissionsGranted) {
      throw new Error('Permissions not granted');
    }

    const mediaDevices = (global as any).mediaDevices;
    const MediaStream = (global as any).MediaStream;

    if (!mediaDevices) {
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
    if (!this.localStream) return false;

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

    const mediaDevices = (global as any).mediaDevices;

    try {
      const newStream: any = await mediaDevices.getUserMedia(constraints);
      const newVideoTrack: any = newStream.getVideoTracks()[0];

      // Replace track in peer connection (will be handled by WebRTCManager)
      if ((global as any).replaceVideoTrack) {
        (global as any).replaceVideoTrack(newVideoTrack);
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

  // Get local stream
  getLocalStream(): any {
    return this.localStream;
  }

  // Stop media stream
  stopStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track: any) => track.stop());
      this.localStream = null;
    }

    // Reset state
    this.isMuted = false;
    this.isVideoOff = false;
    this.isSpeakerOn = false;
  }

  // Get current state
  getState() {
    return {
      isMuted: this.isMuted,
      isVideoOff: this.isVideoOff,
      isSpeakerOn: this.isSpeakerOn
    };
  }
}