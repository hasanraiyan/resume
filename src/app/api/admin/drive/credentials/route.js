import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth/admin';
import dbConnect from '@/lib/dbConnect';
import StorageCredential from '@/models/StorageCredential';

export async function GET(request) {
  const authResult = await requireAdminSession();
  if (authResult instanceof NextResponse) return authResult;

  await dbConnect();
  try {
    const credentials = await StorageCredential.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ credentials });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const authResult = await requireAdminSession();
  if (authResult instanceof NextResponse) return authResult;

  await dbConnect();
  try {
    const data = await request.json();
    const { name, provider, credentials } = data;

    const cred = await StorageCredential.create({
      name,
      provider,
      credentials, // Will be automatically encrypted by the mongoose setter
    });

    return NextResponse.json({ credential: cred }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
