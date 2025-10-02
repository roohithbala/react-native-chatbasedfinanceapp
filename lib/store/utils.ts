// Generate random invite code
export const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Generate MongoDB ObjectId format
export const generateObjectId = () => {
  const timestamp = Math.floor(Date.now() / 1000).toString(16);
  const randomHex = 'xxxxxxxxxxxx'.replace(/[x]/g, () => {
    return (Math.random() * 16 | 0).toString(16);
  });
  return timestamp + randomHex;
};

// Mock API functions for demo
export const mockAPI = {
  auth: {
    login: async (credentials: { email?: string; username?: string; password: string }) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const identifier = credentials.email || credentials.username;
      if (identifier && credentials.password) {
        return {
          token: 'mock-jwt-token-' + Date.now(),
          user: {
            _id: 'user_' + Date.now(),
            name: identifier.split('@')[0],
            email: credentials.email || '',
            username: credentials.username || '',
            avatar: '👤',
            preferences: {
              notifications: true,
              biometric: false,
              darkMode: false,
              currency: 'INR',
            }
          }
        };
      }
      throw new Error('Invalid credentials');
    },
    register: async (userData: { name: string; email: string; password: string }) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (userData.name && userData.email && userData.password) {
        return {
          token: 'mock-jwt-token-' + Date.now(),
          user: {
            _id: 'user_' + Date.now(),
            name: userData.name,
            email: userData.email,
            avatar: '👤',
            preferences: {
              notifications: true,
              biometric: false,
              darkMode: false,
              currency: 'INR',
            }
          }
        };
      }
      throw new Error('Registration failed');
    }
  }
};