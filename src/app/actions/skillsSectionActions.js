'use server';

import dbConnect from '@/lib/dbConnect';
import SkillsSection from '@/models/SkillsSection';
import { serializeForClient } from '@/lib/serialize';

export async function getSkillsSectionData() {
  await dbConnect();
  try {
    const section = await SkillsSection.getSettings();
    return serializeForClient(section);
  } catch (error) {
    console.error('Error fetching skills section data:', error);
    return null;
  }
}
