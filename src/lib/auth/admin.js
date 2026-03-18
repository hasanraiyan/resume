import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';

/**
 * Server-side helper to require an admin session in API routes.
 *
 * @returns {Promise<{session: Object} | NextResponse>} Session object or error response
 */
export async function requireAdminSession() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden. Admin access required.' },
        { status: 403 }
      );
    }

    return { session };
  } catch (error) {
    console.error('requireAdminSession error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
