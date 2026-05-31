import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getServerSession } from 'next-auth';
import { ExternalLink, X, XCircle } from 'lucide-react';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getAuthorizationRequestDetails } from '@/lib/mcp/oauth';
import { Card } from '@/components/custom-ui';

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

function getAppInitial(name = '') {
  return name.trim().charAt(0).toUpperCase() || 'M';
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
    <main className="min-h-screen overflow-hidden bg-neutral-100 px-4 py-8 text-neutral-900 sm:px-6">
      <div className="pointer-events-none fixed inset-0 opacity-70 blur-sm">
        <div className="mx-auto mt-8 h-[90vh] max-w-5xl rounded-[28px] border border-neutral-200 bg-white/80 shadow-sm" />
      </div>

      <form
        method="post"
        action="/api/mcp/oauth/authorize"
        className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[784px] items-center"
      >
        <Card className="relative w-full overflow-hidden rounded-[24px] border border-neutral-300 bg-white p-0 shadow-2xl shadow-black/15">
          <HiddenRequestFields params={params} />
          <button
            type="submit"
            name="consent"
            value="deny"
            className="absolute right-6 top-6 z-20 flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition hover:bg-white/15 hover:text-white"
            aria-label="Close authorization"
          >
            <X className="h-6 w-6" />
          </button>

          <section className="relative overflow-hidden bg-[#20a8ee] px-6 py-16 text-center text-white sm:px-10 sm:py-20">
            <div className="absolute -left-16 top-0 h-72 w-48 rounded-full bg-[#ffd49a] blur-3xl" />
            <div className="absolute right-0 top-0 h-72 w-80 rounded-full bg-[#8be4ee] opacity-80 blur-3xl" />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0a8fe5] to-transparent opacity-70" />

            <div className="relative mx-auto flex max-w-lg flex-col items-center">
              <div className="flex items-center justify-center gap-5">
                <div className="flex h-[68px] w-[68px] items-center justify-center rounded-[16px] bg-white shadow-lg shadow-sky-900/10">
                  <div className="flex h-[42px] w-[42px] items-center justify-center rounded-lg bg-[#7d2ac8] text-2xl font-semibold text-white">
                    {getAppInitial(requestDetails.serverName)}
                  </div>
                </div>
                <div className="h-8 w-px bg-white/45" />
                <div className="flex h-[64px] w-[64px] items-center justify-center rounded-[15px] bg-neutral-950 text-[30px] font-semibold text-white shadow-lg shadow-sky-900/10">
                  ◌
                </div>
              </div>

              <h1 className="mt-7 text-3xl font-bold leading-tight sm:text-[32px]">
                Add {requestDetails.serverKey} to ChatGPT
              </h1>

              <button
                type="submit"
                name="consent"
                value="approve"
                className="mt-12 inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-white px-7 text-lg font-semibold text-neutral-950 shadow-sm transition hover:bg-neutral-100 focus:outline-none focus:ring-4 focus:ring-white/35"
              >
                Sign in with {requestDetails.serverKey}
                <ExternalLink className="h-5 w-5" />
              </button>

              <p className="mt-5 max-w-md text-sm font-medium text-white/80">
                {requestDetails.serverName} will expose {requestDetails.scopes.length}{' '}
                {requestDetails.scopes.length === 1 ? 'permission' : 'permissions'} through{' '}
                {requestDetails.resource}.
              </p>
            </div>
          </section>

          <section className="px-7 py-6 sm:px-8">
            <div className="flex items-center justify-between gap-5 border-b border-neutral-200 pb-5">
              <p className="text-[15px] leading-relaxed text-neutral-500">
                <strong className="font-bold text-neutral-900">
                  Reference memories and chats.
                </strong>{' '}
                Allow ChatGPT to reference relevant chats and memories when sharing data with{' '}
                {requestDetails.serverKey} for more helpful responses.
              </p>
              <div className="relative h-8 w-12 shrink-0 rounded-full bg-neutral-200">
                <div className="absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-sm" />
              </div>
            </div>

            <div className="space-y-4 pt-5 text-[15px] leading-relaxed text-neutral-500">
              <p>
                <strong className="font-bold text-neutral-900">
                  Permissions always respected.
                </strong>{' '}
                ChatGPT is strictly limited to permissions you have explicitly approved. Disable
                access anytime to revoke permissions.
              </p>
              <p>
                <strong className="font-bold text-neutral-900">You're in control.</strong> ChatGPT
                always respects your training data preferences. Data from {requestDetails.serverKey}{' '}
                may be used to provide you relevant and useful information.{' '}
                <span className="underline">Learn more</span>
              </p>
              <p>
                <strong className="font-bold text-neutral-900">
                  Connectors may introduce risk.
                </strong>{' '}
                Connectors are designed to respect your privacy, but sites may attempt to steal your
                data. <span className="underline">Learn more on how to stay safe</span>
              </p>
            </div>

            <div className="mt-6 rounded-lg bg-neutral-50 px-4 py-3 text-xs text-neutral-500">
              <p className="font-semibold uppercase tracking-wide text-neutral-700">
                Requested access
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {requestDetails.scopes.map((scope) => (
                  <span key={scope} className="rounded-md bg-white px-2.5 py-1 text-neutral-700">
                    {getScopeDescription(requestDetails, scope)}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </Card>
      </form>
    </main>
  );
}
