import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { validateAuthorizeRequest } from '@/lib/mcp/oauth/authorize-request';
import { getMcpResourceConfig } from '@/lib/mcp/oauth/resources';
import { Card, Button } from '@/components/custom-ui';

export default async function McpAuthorizePage({ searchParams }) {
  const sp = await searchParams;
  const params = new URLSearchParams(
    Object.entries(sp).flatMap(([key, value]) =>
      Array.isArray(value) ? value.map((v) => [key, v]) : [[key, value]]
    )
  );

  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/api/mcp-oauth/authorize?${params}`)}`);
  }

  const result = await validateAuthorizeRequest(params);

  if (!result.ok) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center py-8 px-4">
        <Card className="max-w-md w-full p-8 text-center space-y-2">
          <h1 className="text-xl font-bold text-black">Authorization request invalid</h1>
          <p className="text-neutral-600 text-sm">{result.description}</p>
        </Card>
      </div>
    );
  }

  const { client, resourceKey } = result;
  const resourceConfig = getMcpResourceConfig(resourceKey);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-8 px-4">
      <Card className="max-w-md w-full p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-black font-['Playfair_Display']">
            Authorize access
          </h1>
          <p className="text-neutral-600 text-sm">
            <span className="font-semibold text-black">{client.clientName || 'This app'}</span>{' '}
            wants to access{' '}
            <span className="font-semibold text-black">{resourceConfig.displayName}</span> on your
            behalf.
          </p>
        </div>

        <form method="POST" action="/api/mcp-oauth/authorize" className="space-y-3">
          {[...params.entries()].map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}

          <Button
            type="submit"
            name="decision"
            value="approve"
            variant="primary"
            className="w-full py-3 font-semibold"
          >
            Allow
          </Button>
          <button
            type="submit"
            name="decision"
            value="deny"
            className="w-full py-3 font-semibold text-black border-2 border-neutral-200 rounded-lg hover:border-black transition-colors duration-200"
          >
            Deny
          </button>
        </form>
      </Card>
    </div>
  );
}
