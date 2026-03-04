import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import MediaAsset from '@/models/MediaAsset';
import MediaAgentSettings from '@/models/MediaAgentSettings';
import { aiImageAgent } from '@/lib/agents';
import { qdrantClient } from '@/lib/qdrant';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query) {
      return NextResponse.json({ results: [] });
    }

    await dbConnect();
    const settings = await MediaAgentSettings.findOne({});
    const collectionName = settings?.qdrantCollection || 'media_assets';

    // 1. Generate embedding for the search query
    const queryVector = await aiImageAgent.generateEmbedding(query);

    // 2. Search Qdrant for similar vectors
    const searchResults = await qdrantClient.search(collectionName, {
      vector: queryVector,
      limit: limit,
      with_payload: true,
      score_threshold: 0.5, // Reasonable threshold for cosine similarity
    });

    // 3. Extract asset IDs from payload
    // We use the original MongoDB ID stored in the payload since Qdrant IDs are formatted as UUIDs
    const assetIds = searchResults.map((hit) => hit.payload.id);
    const scores = {};
    searchResults.forEach((hit) => {
      scores[hit.payload.id] = hit.score;
    });

    // Maintain order of relevance from Qdrant
    const assets = await MediaAsset.find({ _id: { $in: assetIds } }).lean();

    // Sort MongoDB results by the order of assetIds from Qdrant and attach score
    const orderedResults = assetIds
      .map((id) => {
        const asset = assets.find((a) => a._id.toString() === id.toString());
        if (asset) {
          return { ...asset, score: scores[id] };
        }
        return null;
      })
      .filter(Boolean);

    return NextResponse.json({
      results: orderedResults,
      count: orderedResults.length,
      isSemantic: true,
    });
  } catch (error) {
    console.error('Error in semantic search:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
