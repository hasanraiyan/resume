import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getServerSession } from 'next-auth';
import { ShieldCheck, XCircle } from 'lucide-react';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getAuthorizationRequestDetails } from '@/lib/mcp/oauth';
import { Card, Button } from '@/components/custom-ui';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Authorize MCP Access',
};

function toSearchParams(searchParams = {}) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item);
      }
    } else if (value !== undefined) {
      params.set(key, value);
    }
  }

  return params;
}

function getScopeDescription(details, scope) {
  return details.scopeDescriptions?.[scope] || scope;
}

function HiddenRequestFields({ params }) {
  return [...params.entries()].map(([key, value]) => (
    <input key={`${key}:${value}`} type="hidden" name={key} value={value} />
  ));
}

export default async function McpAuthorizePage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const params = toSearchParams(resolvedSearchParams);
  const requestHeaders = await headers();
  const proto = requestHeaders.get('x-forwarded-proto') || 'https';
  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host');
  const origin = host ? `${proto}://${host}` : '';
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== 'admin') {
    const callbackUrl = `/mcp-authorize?${params.toString()}`;
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  let requestDetails;
  let errorMessage = '';

  try {
    const detailsParams = new URLSearchParams([...params.entries(), ['origin', origin]]);
    requestDetails = await getAuthorizationRequestDetails({ params: detailsParams });
  } catch (error) {
    errorMessage = error.message;
  }

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-neutral-50 px-4 py-10 flex items-center justify-center">
        <Card className="w-full max-w-lg border border-red-100 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3 text-red-700">
            <XCircle className="h-6 w-6" />
            <h1 className="text-xl font-bold text-black">Invalid authorization request</h1>
          </div>
          <p className="mt-4 text-sm text-neutral-600">{errorMessage}</p>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10 flex items-center justify-center">
      <Card className="w-full max-w-2xl border border-neutral-200 bg-white p-0 shadow-sm overflow-hidden">
        <div className="border-b border-neutral-200 px-6 py-5 sm:px-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-black text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-neutral-500">MCP Authorization</p>
              <h1 className="mt-1 text-2xl font-bold text-black">
                Allow access to this MCP server?
              </h1>
              <p className="mt-2 text-sm text-neutral-600">
                {requestDetails.clientName} is requesting access as {session.user?.name || 'admin'}.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6 sm:px-8">
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-neutral-200 p-4">
              <p className="text-xs font-semibold uppercase text-neutral-500">Client</p>
              <p className="mt-1 font-semibold text-black break-words">
                {requestDetails.clientName}
              </p>
              <p className="mt-1 text-xs text-neutral-500 break-all">{requestDetails.clientId}</p>
            </div>
            <div className="rounded-lg border border-neutral-200 p-4">
              <p className="text-xs font-semibold uppercase text-neutral-500">Server</p>
              <p className="mt-1 font-semibold text-black">{requestDetails.serverName}</p>
              <p className="mt-1 text-xs text-neutral-500">{requestDetails.serverDescription}</p>
            </div>
          </section>

          <section className="rounded-lg border border-neutral-200 p-4">
            <p className="text-xs font-semibold uppercase text-neutral-500">MCP URL</p>
            <p className="mt-2 break-all rounded-md bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
              {requestDetails.resource}
            </p>
          </section>

          <section>
            <p className="text-xs font-semibold uppercase text-neutral-500">Requested scopes</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {requestDetails.scopes.map((scope) => (
                <span
                  key={scope}
                  className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-800"
                >
                  {getScopeDescription(requestDetails, scope)}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs font-semibold uppercase text-neutral-500">Redirect URI</p>
            <p className="mt-2 break-all text-sm text-neutral-700">{requestDetails.redirectUri}</p>
          </section>
        </div>

        <form
          method="post"
          action="/api/mcp/oauth/authorize"
          className="flex flex-col-reverse gap-3 border-t border-neutral-200 bg-neutral-50 px-6 py-5 sm:flex-row sm:justify-end sm:px-8"
        >
          <HiddenRequestFields params={params} />
          <Button
            type="submit"
            name="consent"
            value="deny"
            variant="secondary"
            magnetic={false}
            className="justify-center border border-neutral-300 bg-white text-black"
          >
            Decline
          </Button>
          <Button
            type="submit"
            name="consent"
            value="approve"
            variant="primary"
            magnetic={false}
            className="justify-center"
          >
            Authorize
          </Button>
        </form>
      </Card>
    </main>
  );
}
