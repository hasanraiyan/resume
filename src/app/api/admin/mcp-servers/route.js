import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import McpServer from '@/models/McpServer';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const servers = await McpServer.find({}).sort({ createdAt: -1 });

    return NextResponse.json({ servers });
  } catch (error) {
    console.error('Error fetching MCP servers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();
    const { name, description, type, url, icon, color, adminOnly, isDefault, isActive } = data;

    if (!name || !url) {
      return NextResponse.json({ error: 'Name and URL are required' }, { status: 400 });
    }

    await dbConnect();

    const newServer = new McpServer({
      name,
      description,
      type: type || 'sse',
      url,
      icon: icon || 'Server',
      color: color || 'blue-500',
      adminOnly: adminOnly ?? false,
      isDefault: isDefault ?? false,
      isActive: isActive ?? true,
    });

    await newServer.save();

    return NextResponse.json({ server: newServer }, { status: 201 });
  } catch (error) {
    console.error('Error creating MCP server:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
