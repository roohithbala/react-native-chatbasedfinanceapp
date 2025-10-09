const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI('AIzaSyCYCPiREIu2ue3ydCCLLAKrWtoS1DyjThc');

async function listModels() {
  try {
    console.log('Fetching available Gemini models...\n');
    
    const models = await genAI.listModels();
    
    console.log('Available models:');
    for await (const model of models) {
      console.log('\n---');
      console.log('Name:', model.name);
      console.log('Display Name:', model.displayName);
      console.log('Description:', model.description);
      console.log('Supported Methods:', model.supportedGenerationMethods);
    }
  } catch (error) {
    console.error('Error listing models:', error.message);
  }
}

listModels();
