// Test authentication flow
const { useFinanceStore } = require('./lib/store/financeStore');

async function testAuthFlow() {
  console.log('🧪 Testing Authentication Flow...\n');

  try {
    // Test registration
    console.log('1️⃣ Testing user registration...');
    const registerResult = await useFinanceStore.getState().register({
      name: 'Test User',
      email: `test_${Date.now()}@example.com`,
      username: `testuser_${Date.now()}`,
      password: 'test123'
    });
    console.log('✅ Registration successful');

    // Test login
    console.log('\n2️⃣ Testing user login...');
    const loginResult = await useFinanceStore.getState().login(
      registerResult.email,
      'test123'
    );
    console.log('✅ Login successful');

    // Test logout
    console.log('\n3️⃣ Testing user logout...');
    await useFinanceStore.getState().logout();
    console.log('✅ Logout successful');

    console.log('\n🎉 Authentication flow test passed!');
    console.log('✅ Registration, login, and logout all working');

  } catch (error) {
    console.error('❌ Authentication flow test failed:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAuthFlow();