// src/app/api/media/models/route.js
export async function GET() {
  console.log('=== FETCH MODELS DEBUG ===');
  console.log('Fetching available models from Pollinations...');

  try {
    const response = await fetch('https://image.pollinations.ai/models');

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }

    const models = await response.json();
    console.log('Fetched models:', models);

    return Response.json({ models });
  } catch (error) {
    console.error('Error fetching models:', error);
    return Response.json({ error: 'Failed to fetch models' }, { status: 500 });
  }
}
