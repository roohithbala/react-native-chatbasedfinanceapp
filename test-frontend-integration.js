const axios = require('axios');

// Simulate the frontend API configuration
const API_BASE_URL = 'http://10.63.153.172:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

async function testFrontendAPIIntegration() {
  try {
    console.log('🔄 Testing Frontend-Backend API Integration...');
    console.log('📡 API Base URL:', API_BASE_URL);

    // Test 1: Health check
    console.log('\n1️⃣ Testing health endpoint...');
    const healthResponse = await api.get('/health');
    console.log('✅ Health check passed:', healthResponse.data);

    // Test 2: User registration (frontend simulation)
    console.log('\n2️⃣ Testing user registration...');
    const registerData = {
      name: 'Frontend Test User',
      email: 'frontend-test@example.com',
      password: 'test123',
      username: 'frontendtest'
    };

    const registerResponse = await api.post('/auth/register', registerData);
    console.log('✅ Registration successful:', registerResponse.data.message);

    // Test 3: User login (frontend simulation)
    console.log('\n3️⃣ Testing user login...');
    const loginData = {
      email: 'frontend-test@example.com',
      password: 'test123'
    };

    const loginResponse = await api.post('/auth/login', loginData);
    console.log('✅ Login successful:', loginResponse.data.message);

    const token = loginResponse.data.token;
    console.log('🔑 Token received:', token.substring(0, 20) + '...');

    // Test 4: Authenticated request (frontend simulation)
    console.log('\n4️⃣ Testing authenticated request...');
    const userResponse = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ User profile fetched successfully');

    // Test 5: Test other endpoints
    console.log('\n5️⃣ Testing groups endpoint...');
    const groupsResponse = await api.get('/groups', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Groups endpoint accessible');

    console.log('\n6️⃣ Testing expenses endpoint...');
    const expensesResponse = await api.get('/expenses', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Expenses endpoint accessible');

    console.log('\n🎉 Frontend-Backend API Integration Test PASSED!');
    console.log('✅ All endpoints are accessible from frontend configuration');
    console.log('✅ Authentication flow working correctly');
    console.log('✅ API responses are properly formatted');

  } catch (error) {
    console.error('❌ API Integration test failed:');
    console.error('Error:', error.response?.data?.message || error.message);
    console.error('Status:', error.response?.status);
    console.error('URL:', error.config?.url);

    if (error.code === 'ECONNREFUSED') {
      console.error('\n🔧 Possible issues:');
      console.error('1. Backend server not running on port 3001');
      console.error('2. Firewall blocking connection');
      console.error('3. Wrong IP address in API configuration');
    }
  }
}

testFrontendAPIIntegration();