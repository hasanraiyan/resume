const { GoogleGenAI } = require('@google/genai');
// No API key needed for listing public models? Usually we need one.
// The user has a provider with an API key. I'll just use a dummy to see if it lists.
// Actually, I'll just check if the list method works.
const ai = new GoogleGenAI({ apiKey: 'dummy' });

async function main() {
  try {
    const models = await ai.models.list();
    console.log('Available models:', JSON.stringify(models, null, 2));
  } catch (e) {
    console.error('Failed to list models:', e.message);
  }
}
main();
