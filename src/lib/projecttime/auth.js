import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function getProjectTimeUser(req) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      return {
        email: session.user.email,
        name: session.user.name || session.user.email.split('@')[0],
      };
    }
  } catch (e) {
    // Session check failed or unauthenticated
  }

  return {
    email: 'user@projecttime.local',
    name: 'Default User',
  };
}
