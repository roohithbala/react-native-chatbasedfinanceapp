import api from './apiConfig';

// Auth API
export const authAPI = {
  register: async (userData: {
    name: string;
    email: string;
    username: string;
    password: string;
  }) => {
    try {
      const response = await api.post('/auth/register', userData);
      if (!response.data || !response.data.user || !response.data.token) {
        throw new Error('Invalid response format from server');
      }
      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Registration failed'
      );
    }
  },

  login: async (credentials: { email?: string; username?: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout', {});
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (profileData: {
    name?: string;
    email?: string;
    username?: string;
    avatar?: string;
    preferences?: {
      notifications?: boolean;
      biometric?: boolean;
      darkMode?: boolean;
      currency?: string;
    };
  }) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      if (!response.data || !response.data.user) {
        throw new Error('Invalid response from server');
      }
      return response.data;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Failed to update profile'
      );
    }
  },

  googleAuth: async (idToken: string) => {
    try {
      const response = await api.post('/auth/google', { idToken });
      if (!response.data || !response.data.user || !response.data.token) {
        throw new Error('Invalid response from server');
      }
      return response.data;
    } catch (error: any) {
      console.error('Google auth error:', error);
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Google authentication failed'
      );
    }
  },

  sendOTP: async (email: string) => {
    try {
      const response = await api.post('/auth/send-otp', { email });
      return response.data;
    } catch (error: any) {
      console.error('Send OTP error:', error);
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Failed to send OTP'
      );
    }
  },

  verifyOTP: async (email: string, otp: string) => {
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      return response.data;
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'OTP verification failed'
      );
    }
  },

  otpLogin: async (email: string, otp: string) => {
    try {
      const response = await api.post('/auth/otp-login', { email, otp });
      if (!response.data || !response.data.user || !response.data.token) {
        throw new Error('Invalid response from server');
      }
      return response.data;
    } catch (error: any) {
      console.error('OTP login error:', error);
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'OTP login failed'
      );
    }
  },
};