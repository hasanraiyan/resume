
import test from 'node:test';
import assert from 'node:assert';

// Standalone function mirroring the latest logic in blog-writer-agent.js
async function generateUniqueSlug(Article, baseSlug) {
  let slug = baseSlug;
  // Escape slug for regex and find all potential collisions
  const escapedSlug = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const slugRegex = new RegExp(`^${escapedSlug}(-[0-9]+)?$`);

  // Only select the slug field and use lean() for performance
  const existingArticles = await Article.find({ slug: slugRegex }).select('slug').lean();

  if (existingArticles.length > 0) {
    const existingSlugs = new Set(existingArticles.map((a) => a.slug));
    if (existingSlugs.has(slug)) {
      let counter = 1;
      while (existingSlugs.has(`${baseSlug}-${counter}`)) {
        counter++;
      }
      slug = `${baseSlug}-${counter}`;
    }
  }
  return slug;
}

// Mock Article Model
class MockArticle {
  constructor(existingSlugs) {
    this.existingSlugs = existingSlugs;
  }
  find({ slug: regex }) {
    const results = this.existingSlugs
      .filter(s => regex.test(s))
      .map(s => ({ slug: s }));

    // Chainable mock for .select().lean()
    return {
      select: () => ({
        lean: async () => results
      })
    };
  }
}

test('generateUniqueSlug - no existing slugs', async () => {
  const mock = new MockArticle([]);
  const result = await generateUniqueSlug(mock, 'new-post');
  assert.strictEqual(result, 'new-post');
});

test('generateUniqueSlug - base slug exists', async () => {
  const mock = new MockArticle(['my-post']);
  const result = await generateUniqueSlug(mock, 'my-post');
  assert.strictEqual(result, 'my-post-1');
});

test('generateUniqueSlug - base and multiple suffixes exist', async () => {
  const mock = new MockArticle(['my-post', 'my-post-1', 'my-post-2']);
  const result = await generateUniqueSlug(mock, 'my-post');
  assert.strictEqual(result, 'my-post-3');
});

test('generateUniqueSlug - gap in suffixes', async () => {
  const mock = new MockArticle(['my-post', 'my-post-2']);
  const result = await generateUniqueSlug(mock, 'my-post');
  assert.strictEqual(result, 'my-post-1');
});

test('generateUniqueSlug - unrelated slugs with same prefix', async () => {
  const mock = new MockArticle(['my-post-office', 'my-postman']);
  const result = await generateUniqueSlug(mock, 'my-post');
  assert.strictEqual(result, 'my-post');
});

test('generateUniqueSlug - non-numeric suffixes', async () => {
  const mock = new MockArticle(['my-post', 'my-post-abc']);
  const result = await generateUniqueSlug(mock, 'my-post');
  assert.strictEqual(result, 'my-post-1');
});

test('generateUniqueSlug - regex characters in slug', async () => {
  const mock = new MockArticle(['post+', 'post+-1']);
  const result = await generateUniqueSlug(mock, 'post+');
  assert.strictEqual(result, 'post+-2');
});
