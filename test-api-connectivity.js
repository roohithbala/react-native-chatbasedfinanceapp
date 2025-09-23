// Simple test to verify API connectivity
const axios = require('axios');

const API_BASE_URL = 'http://10.40.155.172:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

async function testAPI() {
  try {
    console.log('Testing API connectivity...');

    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await api.get('/health');
    console.log('✅ Health check passed:', healthResponse.data);

    // Test registration
    console.log('\n2. Testing user registration...');
    const timestamp = Date.now();
    const registerData = {
      name: 'API Test User',
      email: `api_test_${timestamp}@example.com`,
      password: 'test123',
      username: `apitestuser_${timestamp}`
    };

    const registerResponse = await api.post('/auth/register', registerData);
    console.log('✅ Registration successful:', registerResponse.data.message);

    const token = registerResponse.data.token;
    const user = registerResponse.data.user;

    // Set auth header for subsequent requests
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Test login
    console.log('\n3. Testing user login...');
    const loginData = {
      email: registerData.email,
      password: 'test123'
    };

    const loginResponse = await api.post('/auth/login', loginData);
    console.log('✅ Login successful:', loginResponse.data.message);

    // Test authenticated endpoint
    console.log('\n4. Testing authenticated endpoint...');
    const profileResponse = await api.get('/auth/me');
    console.log('✅ Profile fetch successful');

    console.log('\n🎉 All API tests passed! Backend is fully functional.');

  } catch (error) {
    console.error('❌ API test failed:', error.response?.data?.message || error.message);
    console.error('Status:', error.response?.status);
    console.error('URL:', error.config?.url);
  }
}

testAPI();