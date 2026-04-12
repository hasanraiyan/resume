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
    const { credentialId, fileName, fileSize, fileType } = await request.json();

    const cred = await StorageCredential.findById(credentialId);
    if (!cred) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
    }

    const provider = StorageFactory.getProvider(cred.provider, cred.credentials);
    const intent = await provider.getUploadIntent(fileName, fileSize, fileType);

    return NextResponse.json({ intent });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
