/**
 * Updated Benchmark script for slug uniqueness check.
 * Compares current N+1 approach vs optimized regex approach.
 */

async function currentApproach(Article, baseSlug) {
  let slug = baseSlug;
  let counter = 1;
  let calls = 0;

  calls++;
  let existing = await Article.findOne({ slug });
  while (existing) {
    slug = `${baseSlug}-${counter}`;
    calls++;
    existing = await Article.findOne({ slug });
    counter++;
  }
  return { slug, calls };
}

async function optimizedApproach(Article, baseSlug) {
  let calls = 0;
  calls++;
  const slugRegex = new RegExp(`^${baseSlug}(-[0-9]+)?$`);
  const existingArticles = await Article.find({ slug: slugRegex });

  let slug = baseSlug;
  if (existingArticles.length > 0) {
    const existingSlugs = existingArticles.map((a) => a.slug);
    if (existingSlugs.includes(slug)) {
      let counter = 1;
      while (existingSlugs.includes(`${baseSlug}-${counter}`)) {
        counter++;
      }
      slug = `${baseSlug}-${counter}`;
    }
  }
  return { slug, calls };
}

// Mock Article Model
class MockArticle {
  constructor(existingSlugs) {
    this.existingSlugs = existingSlugs;
  }

  async findOne({ slug }) {
    const found = this.existingSlugs.find((s) => s === slug);
    return found ? { slug: found } : null;
  }

  async find({ slug: regex }) {
    return this.existingSlugs.filter((s) => regex.test(s)).map((s) => ({ slug: s }));
  }
}

async function runBenchmark() {
  const baseSlug = 'awesome-post';
  const collisions = 50;
  const existingSlugs = [baseSlug];
  for (let i = 1; i < collisions; i++) {
    existingSlugs.push(`${baseSlug}-${i}`);
  }

  console.log(`--- Benchmark: ${collisions} collisions ---`);

  const mockCurrent = new MockArticle(existingSlugs);
  const startCurrent = Date.now();
  const resCurrent = await currentApproach(mockCurrent, baseSlug);
  const endCurrent = Date.now();
  console.log('Current Approach:');
  console.log(`  Result Slug: ${resCurrent.slug}`);
  console.log(`  DB Calls:    ${resCurrent.calls}`);
  console.log(`  Time:        ${endCurrent - startCurrent}ms (simulated)`);

  const mockOptimized = new MockArticle(existingSlugs);
  const startOpt = Date.now();
  const resOpt = await optimizedApproach(mockOptimized, baseSlug);
  const endOpt = Date.now();
  console.log('Optimized Approach:');
  console.log(`  Result Slug: ${resOpt.slug}`);
  console.log(`  DB Calls:    ${resOpt.calls}`);
  console.log(`  Time:        ${endOpt - startOpt}ms (simulated)`);

  if (resCurrent.slug !== resOpt.slug) {
    console.error(`ERROR: Slugs do not match! Expected ${resCurrent.slug}, got ${resOpt.slug}`);
    process.exit(1);
  }
}

runBenchmark().catch(console.error);
