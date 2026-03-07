'use server';

import dbConnect from '@/lib/dbConnect';
import ProjectSection from '@/models/ProjectSection';
import { serializeForClient } from '@/lib/serialize';

export async function getProjectSectionData() {
  await dbConnect();
  try {
    const section = await ProjectSection.getSettings();
    return serializeForClient(section);
  } catch (error) {
    console.error('Error fetching project section data:', error);
    return null;
  }
}
