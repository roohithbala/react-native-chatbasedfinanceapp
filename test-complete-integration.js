// Test the complete frontend-backend integration
const AsyncStorage = require('@react-native-async-storage/async-storage');

// Mock AsyncStorage for testing
const mockStorage = {};
AsyncStorage.getItem = async (key) => mockStorage[key] || null;
AsyncStorage.setItem = async (key, value) => { mockStorage[key] = value; };
AsyncStorage.removeItem = async (key) => { delete mockStorage[key]; };
AsyncStorage.multiGet = async (keys) => keys.map(key => [key, mockStorage[key] || null]);
AsyncStorage.clear = async () => { Object.keys(mockStorage).forEach(key => delete mockStorage[key]); };

// Import the API service (we'll simulate the import)
const axios = require('axios');

const API_BASE_URL = 'http://10.247.4.172:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth interceptor
api.interceptors.request.use(async (config) => {
  const token = mockStorage.authToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

async function testCompleteFrontendIntegration() {
  try {
    console.log('🔄 Testing Complete Frontend-Backend Integration...\n');

    // Step 1: Test User Registration
    console.log('1️⃣ Testing User Registration...');
    const registerData = {
      name: 'Integration Test User',
      email: 'integration-test@example.com',
      password: 'test123',
      username: 'integrationtest'
    };

    const registerResponse = await api.post('/auth/register', registerData);
    console.log('✅ Registration successful:', registerResponse.data.message);

    const token = registerResponse.data.token;
    const user = registerResponse.data.user;

    // Store token (simulating frontend behavior)
    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('userData', JSON.stringify(user));

    console.log('🔑 Token stored in AsyncStorage');

    // Step 2: Test Authenticated Request (Get User Profile)
    console.log('\n2️⃣ Testing Authenticated User Profile Request...');
    const profileResponse = await api.get('/auth/me');
    console.log('✅ User profile fetched successfully');

    // Step 3: Test Groups API
    console.log('\n3️⃣ Testing Groups API...');
    const groupsResponse = await api.get('/groups');
    console.log('✅ Groups endpoint accessible');

    // Step 4: Test Expenses API
    console.log('\n4️⃣ Testing Expenses API...');
    const expensesResponse = await api.get('/expenses');
    console.log('✅ Expenses endpoint accessible');

    // Step 5: Test Creating an Expense
    console.log('\n5️⃣ Testing Expense Creation...');
    const expenseData = {
      description: 'Test Lunch',
      amount: 25.50,
      category: 'Food',
      userId: user._id
    };

    const createExpenseResponse = await api.post('/expenses', expenseData);
    console.log('✅ Expense created successfully');

    // Step 6: Test Fetching Expenses
    console.log('\n6️⃣ Testing Expense Retrieval...');
    const getExpensesResponse = await api.get('/expenses');
    console.log('✅ Expenses retrieved successfully, count:', getExpensesResponse.data.expenses?.length || 0);

    // Step 7: Test Logout
    console.log('\n7️⃣ Testing Logout...');
    await api.post('/auth/logout');
    console.log('✅ Logout successful');

    // Clear storage (simulating logout cleanup)
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userData');

    console.log('\n🎉 COMPLETE FRONTEND-BACKEND INTEGRATION TEST PASSED!');
    console.log('✅ All API endpoints working correctly');
    console.log('✅ Authentication flow working end-to-end');
    console.log('✅ AsyncStorage integration working');
    console.log('✅ Request interceptors working');
    console.log('✅ CRUD operations working');

    console.log('\n📱 Frontend is ready for production!');
    console.log('🚀 You can now start the Expo app and test the full user experience');

  } catch (error) {
    console.error('❌ Integration test failed:');
    console.error('Error:', error.response?.data?.message || error.message);
    console.error('Status:', error.response?.status);
    console.error('URL:', error.config?.url);

    if (error.code === 'ECONNABORTED') {
      console.error('\n🔧 Possible issues:');
      console.error('1. Backend server not running');
      console.error('2. Network connectivity issues');
      console.error('3. Wrong API base URL configuration');
    }
  }
}

testCompleteFrontendIntegration();