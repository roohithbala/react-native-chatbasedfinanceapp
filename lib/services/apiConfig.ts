import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const getApiBaseUrl = () => {
  // For React Native development, localhost doesn't work from emulator/device
  // Try common development IPs or use environment variable
  const serverIP = process.env.EXPO_PUBLIC_SERVER_IP ||
                   '10.0.2.2' || // Android emulator localhost
                   '192.168.1.100' || // Common local network IP
                   'localhost';

  const serverPort = process.env.EXPO_PUBLIC_BACKEND_PORT || '3001';

  if (__DEV__) {
    return `http://${serverIP}:${serverPort}/api`;
  } else {
    return 'https://your-production-api.com/api';
  }
};

export const API_BASE_URL = getApiBaseUrl();

console.log('API Base URL:', API_BASE_URL);
console.log('Server IP being used:', process.env.EXPO_PUBLIC_SERVER_IP || '10.0.2.2');
console.log('Server Port:', process.env.EXPO_PUBLIC_BACKEND_PORT || '3001');

// Network connectivity check
export const checkServerConnectivity = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('Server connectivity check failed:', error);
    return false;
  }
};

// Auto-detect server IP (useful for development)
export const detectServerIP = async (): Promise<string | null> => {
  const commonIPs = [
    '10.120.178.172', // Current configured IP
    '10.27.93.172', // Previous configured IP
    '10.42.112.172', // Previous configured IP
    '10.40.155.172', // Previous configured IP
    '192.168.1.100',
    '192.168.1.101',
    '192.168.1.102',
    '192.168.0.100',
    '192.168.0.101',
    '192.168.0.102',
    'localhost',
    '127.0.0.1'
  ];

  for (const ip of commonIPs) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const testUrl = `http://${ip}:3001/api/health`;
      const response = await fetch(testUrl, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('Server found at IP:', ip);
        return ip;
      }
    } catch (error) {
      // Continue to next IP
    }
  }

  console.log('No server found on common IPs');
  return null;
};

// Create axios instance
const api: ReturnType<typeof axios.create> = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Increased timeout for slower connections
  headers: {
    'Content-Type': 'application/json',
  },
  // Add retry configuration
  validateStatus: (status: number) => status >= 200 && status < 500, // Don't reject if not 5xx
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response for debugging
    console.log('API Response:', {
      status: response.status,
      url: response.config.url,
      dataType: typeof response.data,
      dataKeys: response.data ? Object.keys(response.data) : [],
      contentType: response.headers['content-type']
    });

    // Check if response is HTML instead of JSON
    if (response.headers['content-type']?.includes('text/html')) {
      console.error('Received HTML response instead of JSON:', response.data);
      throw new Error('Server returned HTML instead of JSON. Check server configuration.');
    }

    return response;
  },
  (error: AxiosError) => {
    console.error('API Error:', error.message);
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers
    });

    // Handle rate limiting
    if (error.response?.status === 429) {
      console.warn('Rate limit exceeded. Retrying after delay...');
      // Could implement retry logic here
    }

    return Promise.reject(error);
  }
);

export default api;
