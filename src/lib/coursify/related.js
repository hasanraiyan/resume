import dbConnect from '@/lib/dbConnect';
import CoursifyResearch from '@/models/CoursifyResearch';

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
    const { PollinationsEmbeddings } = await import('@/lib/coursify/PollinationsEmbeddings');
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

async function recommendByPointId(qdrantUrl, pointId, limit) {
  const res = await fetch(`${qdrantUrl}/collections/${COLLECTION}/points/recommend`, {
    method: 'POST',
    headers: qdrantHeaders(),
    body: JSON.stringify({
      positive: [pointId],
      limit,
      with_payload: true,
      with_vector: false,
    }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.result || [];
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
    const qdrantId = article.qdrantId || (await lazyUpload(qdrantUrl, article));

    if (!qdrantId) {
      console.log(`[CoursifyRelated] Could not obtain qdrantId for slug: ${slug}`);
      return [];
    }

    const similar = (await recommendByPointId(qdrantUrl, qdrantId, limit + 1))
      .filter((p) => p.payload?.metadata?.slug !== slug)
      .slice(0, limit);

    if (!includeSnippet) {
      return similar.map((p) => ({
        title: p.payload?.metadata?.title || '',
        slug: p.payload?.metadata?.slug || '',
      }));
    }

    const relatedWithContent = await Promise.all(
      similar.map(async (p) => {
        const relSlug = p.payload?.metadata?.slug;
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
