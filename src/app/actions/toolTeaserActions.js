'use server';

import dbConnect from '@/lib/dbConnect';
import ToolTeaserSection from '@/models/ToolTeaserSection';
import { serializeForClient } from '@/lib/serialize';

export async function getToolTeaserData() {
  await dbConnect();
  try {
    const section = await ToolTeaserSection.getSettings();
    return serializeForClient(section);
  } catch (error) {
    console.error('Error fetching tool teaser data:', error);
    return null;
  }
}
