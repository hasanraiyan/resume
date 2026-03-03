#!/usr/bin/env node

/**
 * Fetch All Published Blogs Tool
 *
 * Fetches all published blog post titles and slugs from the portfolio API.
 * Handles pagination automatically so the blog-writing skill can check
 * for duplicate topics before writing a new post.
 *
 * Usage:
 *   node .agent/skills/blog-writing/tool/fetch-all-blogs.js
 *   node .agent/skills/blog-writing/tool/fetch-all-blogs.js --url="https://hasanraiyan.vercel.app"
 *
 * Output: JSON list of { title, slug, tags, publishedAt } for every published article.
 */

const https = require('https');
const http = require('http');

const args = process.argv.slice(2);
const urlArg = args.find((a) => a.startsWith('--url='));
const baseUrl = urlArg ? urlArg.split('=')[1] : 'https://hasanraiyan.vercel.app';

function fetchJSON(url) {
  const lib = url.startsWith('https') ? https : http;
  return new Promise((resolve, reject) => {
    lib
      .get(url, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`Failed to parse response from ${url}: ${body.substring(0, 200)}`));
          }
        });
      })
      .on('error', reject);
  });
}

async function fetchAllBlogs() {
  const apiUrl = `${baseUrl}/api/articles`;
  console.error(`Fetching all published articles from ${apiUrl} ...`);

  try {
    const data = await fetchJSON(apiUrl);

    if (!data.success) {
      console.error('API returned an error:', data.error || 'Unknown error');
      process.exit(1);
    }

    console.error(`Found ${data.count} published articles.\n`);

    // Print human-readable summary to stderr
    data.articles.forEach((a, i) => {
      const tags = a.tags.length > 0 ? ` [${a.tags.join(', ')}]` : '';
      const excerpt = a.excerpt ? `\n     "${a.excerpt}"` : '';
      console.error(`  ${i + 1}. ${a.title} (/${a.slug})${tags}${excerpt}`);
    });

    // Print machine-readable JSON to stdout
    console.log(JSON.stringify(data.articles, null, 2));
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

fetchAllBlogs();
