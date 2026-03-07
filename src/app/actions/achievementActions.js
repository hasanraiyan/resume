'use server';

import dbConnect from '@/lib/dbConnect';
import Achievement from '@/models/Achievement';
import AchievementSection from '@/models/AchievementSection';
import { serializeForClient } from '@/lib/serialize';

export async function getAchievementsData() {
  await dbConnect();
  try {
    const [section, items] = await Promise.all([
      AchievementSection.getSettings(),
      Achievement.find({ isActive: true }).sort({ displayOrder: 1, createdAt: -1 }).lean(),
    ]);

    const achievements = items.filter((item) => item.type === 'achievement');
    const certifications = items.filter((item) => item.type === 'certification');

    return serializeForClient({
      section,
      achievements,
      certifications,
    });
  } catch (error) {
    console.error('Error fetching achievements data:', error);
    return null;
  }
}
