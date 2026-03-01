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

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

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

    const { name, description, type, url, icon, isActive, color, adminOnly } = body;

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

    const updatedServer = await McpServer.findByIdAndUpdate(
      id,
      {
        name,
        description,
        type,
        url,
        icon,
        isActive,
        color,
        adminOnly,
      },
      { new: true, runValidators: true }
    );

    if (!updatedServer) {
      return NextResponse.json({ error: 'MCP server not found' }, { status: 404 });
    }

    return NextResponse.json(updatedServer);
  } catch (error) {
    console.error('Error updating MCP server:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await dbConnect();

    const deletedServer = await McpServer.findByIdAndDelete(id);

    if (!deletedServer) {
      return NextResponse.json({ error: 'MCP server not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'MCP server deleted successfully' });
  } catch (error) {
    console.error('Error deleting MCP server:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
