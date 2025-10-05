const OpenAI = require('openai');
require('dotenv').config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAI() {
  try {
    console.log('Testing OpenAI API connection...');
    console.log('API Key configured:', process.env.OPENAI_API_KEY ? 'Yes' : 'No');

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant.'
        },
        {
          role: 'user',
          content: 'Say hello and confirm you are working! Respond with just a simple greeting.'
        }
      ],
      temperature: 0.7,
      max_tokens: 100
    });

    const response = completion.choices[0].message.content;

    console.log('✅ OpenAI API is working!');
    console.log('Response:', response);

  } catch (error) {
    console.error('❌ OpenAI API test failed:', error.message);
    console.error('Full error:', error);

    // Check if it's an authentication issue
    if (error.message.includes('API key')) {
      console.error('❌ API Key issue detected. Please set your OPENAI_API_KEY in .env file');
    }
  }
}

testOpenAI();