const EMBEDDING_CONFIG = {
  baseUrl: 'https://gen.pollinations.ai/v1',
  model: 'openai-3-small',
  dimensions: 1536,
};

export async function getEmbeddingApiKey() {
  try {
    // Try DynamicSettingsManager first (for server routes with DB access)
    const DynamicSettingsManager = (await import('@/lib/DynamicSettingsManager')).default;
    const settingsManager = new DynamicSettingsManager();
    const apiKey = await settingsManager.get('POLLINATIONS_API_KEY');

    if (apiKey) {
      return apiKey;
    }
  } catch (err) {
    console.debug('[Embeddings] DynamicSettingsManager not available, falling back to env');
  }

  // Fallback to environment variable
  const apiKey = process.env.POLLINATIONS_API_KEY;
  if (!apiKey) {
    throw new Error('POLLINATIONS_API_KEY not configured in DynamicSettings or .env');
  }
  return apiKey;
}

export async function generateEmbedding(text) {
  try {
    const apiKey = await getEmbeddingApiKey();

    const response = await fetch(`${EMBEDDING_CONFIG.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_CONFIG.model,
        input: text,
        dimensions: EMBEDDING_CONFIG.dimensions,
        encoding_format: 'float',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Embedding API error: ${error.detail || response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (err) {
    console.error('[Embeddings] Error generating embedding:', err);
    throw err;
  }
}

export async function generateEmbeddings(texts) {
  try {
    const apiKey = await getEmbeddingApiKey();

    const response = await fetch(`${EMBEDDING_CONFIG.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_CONFIG.model,
        input: texts,
        dimensions: EMBEDDING_CONFIG.dimensions,
        encoding_format: 'float',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Embedding API error: ${error.detail || response.statusText}`);
    }

    const data = await response.json();
    return data.data.map((item) => item.embedding);
  } catch (err) {
    console.error('[Embeddings] Error generating embeddings:', err);
    throw err;
  }
}
