// src/app/api/media/route.js
import dbConnect from '@/lib/dbConnect';
import MediaAsset from '@/models/MediaAsset';

export async function GET() {
  console.log('=== MEDIA FETCH DEBUG ===');
  console.log('Fetching media assets...');

  try {
    await dbConnect();
    console.log('Database connected for media fetch');

    const assets = await MediaAsset.find({}).sort({ createdAt: -1 }).lean();
    console.log(`Found ${assets.length} assets`);

    return Response.json({ assets: JSON.parse(JSON.stringify(assets)) });
  } catch (error) {
    console.error('Media fetch error:', error);
    return Response.json({ error: 'Failed to fetch assets' }, { status: 500 });
  }
}
