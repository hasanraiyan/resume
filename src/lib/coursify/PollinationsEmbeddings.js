import { Embeddings } from '@langchain/core/embeddings';

export class PollinationsEmbeddings extends Embeddings {
  constructor(config = {}) {
    super(config);
    this.baseUrl = config.baseUrl || 'https://gen.pollinations.ai/v1';
    this.model = config.model || 'openai-3-small';
    this.dimensions = config.dimensions || 1536;
  }

  async getEmbeddingApiKey() {
    try {
      const DynamicSettingsManager = (await import('@/lib/DynamicSettingsManager')).default;
      const settingsManager = new DynamicSettingsManager();
      const apiKey = await settingsManager.get('POLLINATIONS_API_KEY');

      if (apiKey) {
        return apiKey;
      }
    } catch (err) {
      // Fallback to env
    }

    const apiKey = process.env.POLLINATIONS_API_KEY;
    if (!apiKey) {
      throw new Error('POLLINATIONS_API_KEY not configured');
    }
    return apiKey;
  }

  async embedDocuments(texts) {
    const apiKey = await this.getEmbeddingApiKey();

    // Pollinations API has a max batch size of 32
    const BATCH_SIZE = 32;
    const results = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);

      try {
        const response = await fetch(`${this.baseUrl}/embeddings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            input: batch,
            dimensions: this.dimensions,
            encoding_format: 'float',
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('[PollinationsEmbeddings] API Error:', {
            status: response.status,
            error: error,
            batchSize: batch.length,
            batchStart: i,
          });
          throw new Error(`Embedding API error: ${error.detail || response.statusText}`);
        }

        const data = await response.json();
        results.push(...data.data.map((item) => item.embedding));
        console.log(
          `[PollinationsEmbeddings] Batch ${Math.floor(i / BATCH_SIZE) + 1} done (${batch.length} texts)`
        );
      } catch (err) {
        console.error('[PollinationsEmbeddings] Batch request failed:', err.message);
        throw err;
      }

      // Small delay between batches
      if (i + BATCH_SIZE < texts.length) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    return results;
  }

  async embedQuery(text) {
    const apiKey = await this.getEmbeddingApiKey();

    try {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          input: text,
          dimensions: this.dimensions,
          encoding_format: 'float',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[PollinationsEmbeddings] Query API Error:', {
          status: response.status,
          error: error,
        });
        throw new Error(`Embedding API error: ${error.detail || response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (err) {
      console.error('[PollinationsEmbeddings] Query failed:', err.message);
      throw err;
    }
  }
}
