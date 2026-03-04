const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: 'dummy' });
console.log('Instance properties:', Object.keys(ai));
if (ai.models) {
  console.log('ai.models properties:', Object.keys(ai.models));
}
console.log('ai.getGenerativeModel type:', typeof ai.getGenerativeModel);
