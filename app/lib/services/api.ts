// API configuration
export const API_BASE_URL = __DEV__
  ? 'http://10.120.178.172:3002' // Development server IP
  : 'https://your-production-api.com'; // Production URL

// For React Native, you might need to use different URLs for different platforms
// export const API_BASE_URL = Platform.OS === 'android'
//   ? 'http://10.0.2.2:3002' // Android emulator
//   : 'http://localhost:3002'; // iOS simulator

export const WS_BASE_URL = __DEV__
  ? 'ws://10.120.178.172:3002'
  : 'wss://your-production-api.com';