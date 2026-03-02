import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import McpServer from '@/models/McpServer';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';

async function testMcpConnection(url) {
  try {
    const client = new MultiServerMCPClient({
      test_conn: { transport: 'sse', url },
    });

    // Timeout to prevent hanging
    const toolsPromise = client.getTools();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timed out after 8s')), 8000)
    );

    await Promise.race([toolsPromise, timeoutPromise]);
    return { ok: true };
  } catch (e) {
    console.error('MCP Connection Test Failed:', e);
    return { ok: false, error: e.message || 'Unknown connection error' };
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const servers = await McpServer.find({}).sort({ createdAt: -1 });

    return NextResponse.json(servers);
  } catch (error) {
    console.error('Error fetching MCP servers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Check if the request body is empty
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Unsupported media type' }, { status: 415 });
    }

    const bodyText = await request.text();
    if (!bodyText || bodyText.trim() === '') {
      return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
    }

    let body;
    try {
      body = JSON.parse(bodyText);
    } catch (e) {
      console.error('[Admin API] JSON Parse Error:', e);
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { name, description, type, url, icon, isActive, color, adminOnly, isDefault } = body;

    // Validate required fields
    if (!name || !url) {
      return NextResponse.json({ error: 'Name and URL are required' }, { status: 400 });
    }

    // Test connection to the MCP server
    const testResult = await testMcpConnection(url);
    if (!testResult.ok) {
      return NextResponse.json(
        { error: `Could not connect to MCP server: ${testResult.error}` },
        { status: 400 }
      );
    }

    const newServer = new McpServer({
      name,
      description,
      type: type || 'sse',
      url,
      icon: icon || 'Server',
      isActive: isActive !== undefined ? isActive : true,
      color: color || 'blue-500',
      adminOnly: adminOnly !== undefined ? adminOnly : false,
      isDefault: isDefault !== undefined ? isDefault : false,
    });

    await newServer.save();

    return NextResponse.json(newServer, { status: 201 });
  } catch (error) {
    console.error('Error creating MCP server:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
