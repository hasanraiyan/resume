'use server';

import dbConnect from '@/lib/dbConnect';
import ContactSection from '@/models/ContactSection';
import { serializeForClient } from '@/lib/serialize';

export async function getContactSectionData() {
  try {
    await dbConnect();
    const data = await ContactSection.getSettings();
    return serializeForClient(data);
  } catch (error) {
    console.error('[getContactSectionData] Error:', error);
    return null;
  }
}
