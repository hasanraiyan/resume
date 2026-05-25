import { getBaseUrl } from '@/lib/baseUrl';

export function GET() {
  const baseUrl = getBaseUrl();
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api

Sitemap: ${baseUrl}/sitemap.xml`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
