import { NextResponse } from 'next/server';
import { getFrontendSafeSkills } from '@/lib/skillConfig';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * GET /api/skills
 * Returns the list of available Skills (IDs, names, descriptions).
 * Strips out the actual content to keep instructions server-side.
 * The agent loads full skill content on-demand via loadSkill tool.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === 'admin';
    const safeSkills = await getFrontendSafeSkills(isAdmin);
    return NextResponse.json(safeSkills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json({ error: 'Failed to fetch available skills' }, { status: 500 });
  }
}
