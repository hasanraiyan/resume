import dbConnect from '@/lib/dbConnect';
import CoursifyResearch from '@/models/CoursifyResearch';
import { QdrantVectorStore } from '@langchain/qdrant';
import { PollinationsEmbeddings } from '@/lib/coursify/PollinationsEmbeddings';

const COLLECTION = 'coursify_research';

function qdrantHeaders() {
  return {
    'Content-Type': 'application/json',
    ...(process.env.QDRANT_API_KEY ? { 'api-key': process.env.QDRANT_API_KEY } : {}),
  };
}

// Upload an article to Qdrant on-demand and persist the UUID back to MongoDB
async function lazyUpload(qdrantUrl, article) {
  try {
    const embeddings = new PollinationsEmbeddings();
    const text = `${article.title}\n${article.topic}`;
    const [vector] = await embeddings.embedDocuments([text]);
    const qdrantId = crypto.randomUUID();

    const res = await fetch(`${qdrantUrl}/collections/${COLLECTION}/points`, {
      method: 'PUT',
      headers: qdrantHeaders(),
      body: JSON.stringify({
        points: [
          {
            id: qdrantId,
            vector,
            payload: {
              page_content: text,
              metadata: { slug: article.slug, title: article.title, topic: article.topic },
            },
          },
        ],
      }),
    });

    if (!res.ok) throw new Error(`Qdrant PUT failed: ${res.status}`);

    await CoursifyResearch.findByIdAndUpdate(article._id, { qdrantId });
    console.log(`[CoursifyRelated] Lazy-uploaded "${article.slug}" to Qdrant (id: ${qdrantId})`);
    return qdrantId;
  } catch (err) {
    console.error('[CoursifyRelated] Lazy upload error:', err.message);
    return null;
  }
}

async function getQdrantVectorStore() {
  const embeddings = new PollinationsEmbeddings();
  const qdrantUrl = process.env.QDRANT_URL;

  return new QdrantVectorStore(embeddings, {
    url: qdrantUrl,
    apiKey: process.env.QDRANT_API_KEY,
    collectionName: COLLECTION,
  });
}

export async function getRelatedArticles(slug, limit = 3, includeSnippet = false) {
  try {
    const qdrantUrl = process.env.QDRANT_URL;
    if (!qdrantUrl) {
      console.log('[CoursifyRelated] QDRANT_URL not set, skipping related articles');
      return [];
    }

    await dbConnect();

    const article = await CoursifyResearch.findOne(
      { slug, deletedAt: null },
      '_id title topic slug qdrantId'
    ).lean();

    if (!article) {
      console.log(`[CoursifyRelated] Article not found in DB for slug: ${slug}`);
      return [];
    }

    // Lazy-upload if qdrantId was never set (pre-fix articles or cache hits)
    if (!article.qdrantId) {
      await lazyUpload(qdrantUrl, article);
    }

    const vectorStore = await getQdrantVectorStore();
    const query = `${article.title}\n${article.topic}`;

    // Use LangChain's MMR search for diverse results
    const similar = await vectorStore.maxMarginalRelevanceSearch(query, {
      k: limit + 1,
      fetchK: limit * 4, // Fetch more candidates for better diversity
    });

    // Filter out the query article itself
    const filtered = similar.filter((doc) => doc.metadata?.slug !== slug).slice(0, limit);

    if (!includeSnippet) {
      return filtered.map((doc) => ({
        title: doc.metadata?.title || '',
        slug: doc.metadata?.slug || '',
      }));
    }

    const relatedWithContent = await Promise.all(
      filtered.map(async (doc) => {
        const relSlug = doc.metadata?.slug;
        if (!relSlug) return null;
        try {
          const research = await CoursifyResearch.findOne(
            { slug: relSlug, deletedAt: null },
            'title summary slug'
          ).lean();
          if (!research) return null;
          return { title: research.title, slug: research.slug, snippet: research.summary || null };
        } catch {
          return null;
        }
      })
    );

    return relatedWithContent.filter(Boolean);
  } catch (err) {
    console.error('[CoursifyRelated] Error:', err.message);
    return [];
  }
}

export function logRelatedArticles(data) {
  console.log('[CoursifyRelated Debug]', {
    count: data.length,
    articles: data.map((a) => ({
      title: a.title,
      slug: a.slug,
      snippetLength: a.snippet?.length || 0,
    })),
  });
}
