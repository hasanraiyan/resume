import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import agentRegistry from '@/lib/agents';
import { AGENT_IDS } from '@/lib/constants/agents';
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

    // Delegate all semantic search logic to the VisualSearchAgent
    const result = await agentRegistry.execute(AGENT_IDS.VISUAL_SEARCH, {
      query,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in semantic search:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
