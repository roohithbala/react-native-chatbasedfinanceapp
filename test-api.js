const axios = require('axios');

// Simple test to verify API connectivity
async function testAPI() {
  try {
    console.log('Testing API connectivity...');

    // Test health endpoint
    const healthResponse = await axios.get('http://localhost:3001/api/health');
    console.log('✅ Health check passed:', healthResponse.data);

    // Test registration
    const registerResponse = await axios.post('http://localhost:3001/api/auth/register', {
      name: 'API Test User',
      email: 'api-test@example.com',
      password: 'test123',
      username: 'apitestuser'
    });
    console.log('✅ Registration successful:', registerResponse.data.message);

    // Test login
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'api-test@example.com',
      password: 'test123'
    });
    console.log('✅ Login successful:', loginResponse.data.message);

    const token = loginResponse.data.token;

    // Test authenticated endpoint
    const userResponse = await axios.get('http://localhost:3001/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ User profile fetched successfully');

    console.log('\n🎉 All API tests passed! Backend is fully functional.');

  } catch (error) {
    console.error('❌ API test failed:', error.response?.data?.message || error.message);
  }
}

testAPI();