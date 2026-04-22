import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import McpAuthorizeClient from './McpAuthorizeClient';

export default async function McpAuthorizePage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    redirect('/login?callbackUrl=/mcp-authorize');
  }

  const cookieStore = await cookies();
  const pendingRaw = cookieStore.get('mcp_pending_auth')?.value;

  if (!pendingRaw) {
    // If no pending auth, just go to dashboard
    redirect('/admin/dashboard');
  }

  let pending;
  try {
    pending = JSON.parse(pendingRaw);
  } catch (e) {
    console.error('Failed to parse pending auth:', e);
    redirect('/admin/dashboard');
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <McpAuthorizeClient pending={pending} />
    </div>
  );
}
