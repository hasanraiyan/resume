'use server';

import dbConnect from '@/lib/dbConnect';
import SiteConfig from '@/models/SiteConfig';
import { serializeForClient } from '@/lib/serialize';

export async function getSiteConfig() {
  try {
    await dbConnect();
    const config = await SiteConfig.getSettings();
    return serializeForClient(config);
  } catch (error) {
    console.error('[getSiteConfig] Error:', error);
    return null;
  }
}
