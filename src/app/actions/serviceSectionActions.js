'use server';

import dbConnect from '@/lib/dbConnect';
import ServiceSection from '@/models/ServiceSection';
import { serializeForClient } from '@/lib/serialize';

export async function getServiceSectionData() {
  await dbConnect();
  try {
    const section = await ServiceSection.getSettings();
    return serializeForClient(section);
  } catch (error) {
    console.error('Error fetching service section data:', error);
    return null;
  }
}
