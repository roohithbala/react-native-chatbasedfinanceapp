import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://10.120.178.172:3001/api';

class ReportsAPI {
  private async getAuthHeaders() {
    try {
      const token = await AsyncStorage.getItem('authToken'); // Fixed: was 'token', should be 'authToken'
      console.log('🔑 ReportsAPI: Retrieved token from storage:', !!token ? 'Token exists' : 'No token found');
      console.log('🔑 ReportsAPI: Token length:', token?.length || 0);

      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };
    } catch (error) {
      console.error('🔑 ReportsAPI: Error getting auth headers:', error);
      throw error;
    }
  }

  async reportUser(reportedUserId: string, reportedUsername: string, reason?: string, description?: string): Promise<void> {
    try {
      console.log('📡 ReportsAPI: Starting report submission...');
      console.log('📡 ReportsAPI: API URL:', `${API_BASE_URL}/reports/user`);
      console.log('📡 ReportsAPI: Report data:', { reportedUserId, reportedUsername, reason, description });

      const headers = await this.getAuthHeaders();
      console.log('📡 ReportsAPI: Headers:', headers);

      const requestBody = JSON.stringify({
        reportedUserId,
        reportedUsername,
        reason,
        description,
      });
      console.log('📡 ReportsAPI: Request body:', requestBody);

      const response = await fetch(`${API_BASE_URL}/reports/user`, {
        method: 'POST',
        headers,
        body: requestBody,
      });

      console.log('📡 ReportsAPI: Response status:', response.status);
      console.log('📡 ReportsAPI: Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('📡 ReportsAPI: Error response:', errorText);
        const error = await response.json().catch(() => ({ message: errorText }));
        throw new Error(error.message || 'Failed to submit report');
      }

      console.log('📡 ReportsAPI: Report submitted successfully');
    } catch (error: any) {
      console.error('📡 ReportsAPI: Network or other error:', error);
      throw error;
    }
  }
}

export default new ReportsAPI();