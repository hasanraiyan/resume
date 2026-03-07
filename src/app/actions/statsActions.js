import dbConnect from '@/lib/dbConnect';
import StatsSection from '@/models/StatsSection';
import { serializeForClient } from '@/lib/serialize';

/**
 * Fetches the statistics section data from MongoDB.
 * Ensures the data is serialized for client-side use.
 *
 * @returns {Promise<Object>} Serialized stats section data
 */
export async function getStatsData() {
  await dbConnect();
  try {
    const statsData = await StatsSection.getSettings();
    return serializeForClient(statsData);
  } catch (error) {
    console.error('Error in getStatsData:', error);
    return null;
  }
}
