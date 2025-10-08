import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

export async function GET() {
  try {
    const response = await openai.models.list();

    // Extract model IDs from the response
    const models = response.data.map((model) => model.id);

    return Response.json(models);
  } catch (error) {
    console.error('Error fetching models:', error);
    return Response.json({ error: 'Failed to fetch available models' }, { status: 500 });
  }
}
