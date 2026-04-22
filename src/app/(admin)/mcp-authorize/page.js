import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import McpAuthorizeClient from './McpAuthorizeClient';
import dbConnect from '@/lib/dbConnect';
import McpClient from '@/models/McpClient';

export default async function McpAuthorizePage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== 'admin') {
    redirect('/login?flow=mcp');
  }

  const cookieStore = await cookies();
  const pendingRaw = cookieStore.get('mcp_pending_auth')?.value;

  if (!pendingRaw) {
    redirect('/login');
  }

  const pending = JSON.parse(pendingRaw);

  await dbConnect();
  const client = await McpClient.findOne({ clientId: pending.clientId }).lean();

  if (!client) {
    redirect('/login');
  }

  return (
    <McpAuthorizeClient clientName={client.clientName || 'MCP Client'} scope={pending.scope} />
  );
}
