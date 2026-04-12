import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth/admin';
import dbConnect from '@/lib/dbConnect';
import StorageCredential from '@/models/StorageCredential';
import StorageFactory from '@/lib/storage/StorageFactory';

export async function POST(request) {
  const authResult = await requireAdminSession();
  if (authResult instanceof NextResponse) return authResult;

  await dbConnect();
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const credentialId = formData.get('credentialId');

    if (!file || !credentialId) {
      return NextResponse.json({ error: 'Missing file or credentialId' }, { status: 400 });
    }

    const cred = await StorageCredential.findById(credentialId);
    if (!cred) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
    }

    const provider = StorageFactory.getProvider(cred.provider, cred.credentials);
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await provider.upload(buffer, file.name, file.type);

    return NextResponse.json(uploadResult, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
