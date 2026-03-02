// src/app/(admin)/admin/media/page.js
import dbConnect from '@/lib/dbConnect';
import MediaAsset from '@/models/MediaAsset';
import MediaLibraryClient from '@/components/admin/MediaLibraryClient';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';

export const dynamic = 'force-dynamic';

export default async function MediaLibraryPage() {
  await dbConnect();
  const assets = await MediaAsset.find({}).sort({ createdAt: -1 }).lean();
  const serializedAssets = JSON.parse(JSON.stringify(assets));

  return (
    <AdminPageWrapper title="Media Library" description="Upload and manage your images and assets.">
      <MediaLibraryClient initialAssets={serializedAssets} />
    </AdminPageWrapper>
  );
}
