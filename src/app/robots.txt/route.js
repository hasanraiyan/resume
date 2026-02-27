export function GET() {
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api

Sitemap: https://hasanraiyan.vercel.app/sitemap.xml`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
