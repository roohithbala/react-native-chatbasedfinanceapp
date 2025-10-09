const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize Gemini AI with your API key
const API_KEY = 'AIzaSyCYCPiREIu2ue3ydCCLLAKrWtoS1DyjThc';
const genAI = new GoogleGenerativeAI(API_KEY);

async function testGeminiAI() {
  try {
    console.log('Testing Gemini AI API connection...');
    console.log('API Key configured: Yes');
    console.log('Using model: gemini-1.5-flash\n');

    // Try with gemini-1.5-flash (latest free model)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = 'Say hello and confirm you are working! Respond with just a simple greeting.';

    console.log('Sending prompt to Gemini AI...');
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log('\n✅ Gemini AI API is working!');
    console.log('Response:', text);

  } catch (error) {
    console.error('\n❌ Gemini AI API test failed:', error.message);
    
    // Try alternate model if first fails
    console.log('\nTrying alternate model: gemini-pro...');
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent('Say hello!');
      const response = result.response;
      const text = response.text();
      
      console.log('✅ Gemini Pro is working!');
      console.log('Response:', text);
    } catch (err2) {
      console.error('❌ Gemini Pro also failed:', err2.message);
      console.error('\nPlease verify:');
      console.error('1. API key is correct');
      console.error('2. Gemini API is enabled in Google Cloud Console');
      console.error('3. You have billing enabled (even for free tier)');
    }
  }
}

testGeminiAI();