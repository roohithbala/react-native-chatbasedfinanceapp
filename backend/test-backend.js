const axios = require('axios');

async function testBackend() {
  try {
    console.log('🔄 Testing backend connection...');

    // Test health endpoint
    const healthResponse = await axios.get('http://localhost:3002/api/health');
    console.log('✅ Health check passed:', healthResponse.data);

    // Test user registration with unique email
    const timestamp = Date.now();
    console.log('🔄 Testing user registration...');
    const registerResponse = await axios.post('http://localhost:3002/api/auth/register', {
      name: 'Test User',
      email: `test${timestamp}@example.com`,
      username: `testuser${timestamp}`,
      password: 'test123'
    });
    console.log('✅ User registered:', registerResponse.data.user.name);

    // Test login
    console.log('🔄 Testing login...');
    const loginResponse = await axios.post('http://localhost:3002/api/auth/login', {
      email: `test${timestamp}@example.com`,
      password: 'test123'
    });
    console.log('✅ Login successful for:', loginResponse.data.user.name);

    const token = loginResponse.data.token;

    // Test expenses endpoint
    console.log('🔄 Testing expenses endpoint...');
    const expensesResponse = await axios.get('http://localhost:3002/api/expenses', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Expenses endpoint working, found', expensesResponse.data.expenses?.length || 0, 'expenses');

    // Test groups endpoint
    console.log('🔄 Testing groups endpoint...');
    const groupsResponse = await axios.get('http://localhost:3002/api/groups', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Groups endpoint working, found', groupsResponse.data.data?.groups?.length || 0, 'groups');

    console.log('🎉 All tests passed! Backend is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.status) {
      console.error('Status code:', error.response.status);
    }
  }
}

testBackend();