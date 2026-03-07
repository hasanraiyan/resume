import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import McpServer from '@/models/McpServer';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    await dbConnect();

    const server = await McpServer.findById(id);
    if (!server) {
      return NextResponse.json({ error: 'MCP Server not found' }, { status: 404 });
    }

    return NextResponse.json({ server });
  } catch (error) {
    console.error('Error fetching MCP server:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const data = await request.json();

    await dbConnect();

    const server = await McpServer.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!server) {
      return NextResponse.json({ error: 'MCP Server not found' }, { status: 404 });
    }

    return NextResponse.json({ server });
  } catch (error) {
    console.error('Error updating MCP server:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    await dbConnect();

    const deletedServer = await McpServer.findByIdAndDelete(id);

    if (!deletedServer) {
      return NextResponse.json({ error: 'MCP Server not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'MCP Server deleted successfully' });
  } catch (error) {
    console.error('Error deleting MCP server:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
