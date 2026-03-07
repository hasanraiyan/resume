'use server';

import dbConnect from '@/lib/dbConnect';
import AboutSection from '@/models/AboutSection';
import { serializeForClient } from '@/lib/serialize';

/**
 * Fetches about section data from the database.
 * If no data exists, it returns null (components should handle fallbacks).
 */
export async function getAboutData() {
  await dbConnect();
  try {
    const aboutData = await AboutSection.getSettings();
    return serializeForClient(aboutData);
  } catch (error) {
    console.error('Error fetching About data:', error);
    return null;
  }
}
