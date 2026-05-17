import { QdrantVectorStore } from '@langchain/qdrant';
import { PollinationsEmbeddings } from './PollinationsEmbeddings';
import dbConnect from '@/lib/dbConnect';
import CoursifyResearch from '@/models/CoursifyResearch';

function extractCleanSnippet(content, length = 200) {
  // Remove block markers and headers
  let cleaned = content
    .replace(/^-{3,}.*$/gm, '') // Remove "---" lines (full line)
    .replace(/##\s*\[\w+\]/g, '') // Remove "## [BlockType]" markers
    .replace(/^#+\s+/gm, ''); // Remove headers at line start

  // Remove markdown formatting but keep readable
  cleaned = cleaned
    .replace(/`{3}[\s\S]*?`{3}/g, '') // Remove code blocks
    .replace(/`([^`]+)`/g, '$1') // Remove inline code
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
    .replace(/^\s*[-*+]\s+/gm, '') // Remove bullet points
    .replace(/\n+/g, ' ') // Replace newlines with space
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();

  // Get first N chars and ensure it ends naturally
  let snippet = cleaned.substring(0, length).trim();

  // Find last space to avoid cutting mid-word
  const lastSpace = snippet.lastIndexOf(' ');
  if (lastSpace > length - 50) {
    snippet = snippet.substring(0, lastSpace);
  }

  return snippet + '...';
}

export async function getRelatedArticles(slug, limit = 3, includeSnippet = false) {
  try {
    const qdrantUrl = process.env.QDRANT_URL;

    if (!qdrantUrl) {
      console.log('[CoursifyRelated] QDRANT_URL not set, skipping related articles');
      return [];
    }

    const embeddings = new PollinationsEmbeddings();

    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
      url: qdrantUrl,
      apiKey: process.env.QDRANT_API_KEY,
      collectionName: 'coursify_research',
    });

    // Search for similar documents by slug
    const results = await vectorStore.similaritySearch(slug, limit + 1); // +1 to account for excluding current

    if (!includeSnippet) {
      // Fast path: just metadata
      return results
        .filter((doc) => doc.metadata?.slug !== slug)
        .slice(0, limit)
        .map((doc) => ({
          title: doc.metadata?.title || '',
          slug: doc.metadata?.slug || '',
          topic: doc.metadata?.topic || '',
        }));
    }

    // Fetch content for each result
    const relatedWithContent = await Promise.all(
      results
        .filter((doc) => doc.metadata?.slug !== slug)
        .slice(0, limit)
        .map(async (doc) => {
          try {
            await dbConnect();
            const research = await CoursifyResearch.findOne(
              { slug: doc.metadata?.slug, deletedAt: null },
              'title topic content slug'
            ).lean();

            if (!research) return null;

            // Extract clean snippet
            const snippet = extractCleanSnippet(research.content, 150);

            return {
              title: research.title,
              slug: research.slug,
              topic: research.topic,
              snippet,
            };
          } catch (err) {
            console.error('[CoursifyRelated] Error fetching content:', err);
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

// For debugging - log related articles data
export function logRelatedArticles(data) {
  console.log('[CoursifyRelated Debug]', {
    count: data.length,
    articles: data.map((a) => ({
      title: a.title,
      slug: a.slug,
      topic: a.topic,
      snippetLength: a.snippet?.length || 0,
    })),
  });
}
