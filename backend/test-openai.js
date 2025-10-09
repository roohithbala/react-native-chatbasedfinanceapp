const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize Gemini AI with your API key
const genAI = new GoogleGenerativeAI('AIzaSyCYCPiREIu2ue3ydCCLLAKrWtoS1DyjThc');

async function testGeminiAI() {
  try {
    console.log('Testing Gemini AI API connection...');
    console.log('API Key configured: Yes');

    // Get the generative model (using gemini-1.5-flash - free tier)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = 'Say hello and confirm you are working! Respond with just a simple greeting.';

    console.log('Sending prompt to Gemini AI...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('✅ Gemini AI API is working!');
    console.log('Response:', text);

  } catch (error) {
    console.error('❌ Gemini AI API test failed:', error.message);
    console.error('Full error:', error);

    // Check if it's an authentication issue
    if (error.message.includes('API key') || error.message.includes('API_KEY')) {
      console.error('❌ API Key issue detected. Please verify your Gemini API key');
    }
  }
}

testGeminiAI();