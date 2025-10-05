import io, { Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class SocketConnectionManager {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: any = null;
  private connectionStatusCallbacks: ((status: any) => void)[] = [];

  async connect(): Promise<Socket | null> {
    try {
      // Clear any existing connection first
      this.disconnect();

      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.warn('⚠️ No auth token found for socket connection');
        throw new Error('No auth token found');
      }

      console.log('🔌 Initializing socket connection...');
      const EXPO_PUBLIC_API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.120.178.172:8081/api';
      const SOCKET_URL = EXPO_PUBLIC_API_URL.replace('/api', '');

      console.log('🔌 Connecting to socket server:', SOCKET_URL);

      this.socket = io(SOCKET_URL, {
        auth: {
          token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        forceNew: true,
        upgrade: true,
        rememberUpgrade: true
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket connected successfully');
        this.isConnected = true;
        this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        this.emitConnectionStatusChange();
      });

      this.socket.on('disconnect', (reason: string) => {
        console.log('❌ Socket disconnected:', reason);
        this.isConnected = false;
        this.emitConnectionStatusChange();

        // Try to reconnect if not intentionally disconnected
        if (reason !== 'io client disconnect' && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectTimeout = setTimeout(() => {
            this.reconnectAttempts++;
            console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            this.connect();
          }, 1000);
        }
      });

      this.socket.on('connect_error', (error: Error) => {
        console.error('Socket connection error:', error.message);
        this.isConnected = false;
        this.emitConnectionStatusChange();

        // Don't retry automatically in React Native to avoid excessive retries
        // The connection will be re-established when the app comes back online
      });

      return this.socket;
    } catch (error) {
      console.error('❌ Socket connection failed:', error instanceof Error ? error.message : error);
      this.isConnected = false;

      // Don't throw error, just log it - socket will retry automatically
      return null;
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
      this.emitConnectionStatusChange();
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isSocketConnected(): boolean {
    return this.isConnected;
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      socketExists: !!this.socket
    };
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
    this.connectionStatusCallbacks = [];
  }

  private emitConnectionStatusChange() {
    const status = this.getConnectionStatus();
    this.connectionStatusCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in connection status callback:', error);
      }
    });
  }

  onConnectionStatusChange(callback: (status: any) => void) {
    this.connectionStatusCallbacks.push(callback);
    // Immediately call with current status
    callback(this.getConnectionStatus());
  }

  onError(callback: (error: any) => void) {
    if (!this.socket) return;

    this.socket.on('error', (error: any) => {
      callback(error);
    });
  }
}