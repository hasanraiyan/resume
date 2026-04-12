import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth/admin';
import dbConnect from '@/lib/dbConnect';
import DriveFolder from '@/models/DriveFolder';
import DriveFile from '@/models/DriveFile';
import StorageCredential from '@/models/StorageCredential';

export async function GET(request) {
  const authResult = await requireAdminSession();
  if (authResult instanceof NextResponse) return authResult;

  await dbConnect();
  const { searchParams } = new URL(request.url);
  const parentId = searchParams.get('parentId');
  const credentialId = searchParams.get('credentialId');

  try {
    if (credentialId) {
      const isDeleted = await StorageCredential.findOne({ _id: credentialId, deleted: true });
      if (isDeleted) {
        return NextResponse.json({ folders: [], files: [] });
      }
    }

    const deletedCreds = await StorageCredential.find({ deleted: true }).select('_id');
    const deletedCredIds = deletedCreds.map((c) => c._id);

    const query = {};
    if (parentId && parentId !== 'null') query.parentId = parentId;
    else query.parentId = null;

    if (credentialId) {
      query.credentialId = credentialId;
    } else if (deletedCredIds.length > 0) {
      query.credentialId = { $nin: deletedCredIds };
    }

    const folders = await DriveFolder.find(query).sort({ name: 1 });
    const fileQuery = { folderId: query.parentId };
    if (credentialId) {
      fileQuery.credentialId = credentialId;
    } else if (deletedCredIds.length > 0) {
      fileQuery.credentialId = { $nin: deletedCredIds };
    }
    const files = await DriveFile.find(fileQuery).sort({ fileName: 1 });

    return NextResponse.json({ folders, files });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const authResult = await requireAdminSession();
  if (authResult instanceof NextResponse) return authResult;

  await dbConnect();
  try {
    const { name, parentId, credentialId } = await request.json();
    const folder = await DriveFolder.create({
      name,
      parentId: parentId || null,
      credentialId,
    });
    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
