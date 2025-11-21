// API configuration
import { Platform } from 'react-native';

// Dev machine IP for physical devices on the same LAN. Can be overridden with EXPO_PUBLIC_DEV_IP
const DEV_LOCAL_IP = process.env.EXPO_PUBLIC_DEV_IP || (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');
const DEV_PORT = process.env.EXPO_PUBLIC_DEV_PORT || 3001;

// For development we prefer the LAN IP so physical devices / Expo LAN mode can reach the dev server.
// If you are running exclusively on an Android emulator, update this to 10.0.2.2 manually.
export const API_BASE_URL = __DEV__
  ? `http://${DEV_LOCAL_IP}:${DEV_PORT}`
  : 'https://your-production-api.com';

export const WS_BASE_URL = __DEV__
  ? `ws://${DEV_LOCAL_IP}:${DEV_PORT}`
  : 'wss://your-production-api.com';

// Default export to satisfy Expo Router (this is a service file, not a component)
export default null;