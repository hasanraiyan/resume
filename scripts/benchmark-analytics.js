import { performance } from 'perf_hooks';

// Mocking dependencies and environment
const BOT_USER_AGENTS = ['bot', 'spider', 'crawler'];
function isBot(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some((bot) => ua.includes(bot));
}

async function dbConnect() {
  // Simulate a fast connection or cache check
  return Promise.resolve();
}

class MockAnalytics {
  constructor(data) {
    this.data = data;
  }
  async save() {
    // Simulate database save
    return Promise.resolve();
  }
}

// Current Implementation Logic (Simulated)
async function currentImplementation(events) {
  let dbConnectedCount = 0;
  let savedCount = 0;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const { userAgent } = event;

    if (isBot(userAgent)) {
      continue;
    }

    if (i === 0) {
      await dbConnect();
      dbConnectedCount++;
    }

    const analytics = new MockAnalytics(event);
    await analytics.save();
    savedCount++;
  }
  return { dbConnectedCount, savedCount };
}

// Optimized Implementation Logic (Simulated)
async function optimizedImplementation(events) {
  let dbConnectedCount = 0;
  let savedCount = 0;

  await dbConnect();
  dbConnectedCount++;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const { userAgent } = event;

    if (isBot(userAgent)) {
      continue;
    }

    const analytics = new MockAnalytics(event);
    await analytics.save();
    savedCount++;
  }
  return { dbConnectedCount, savedCount };
}

// Benchmark
async function runBenchmark() {
  const batchSize = 100;
  const iterations = 10000;

  // Case 1: First event is NOT a bot
  const eventsNormal = Array.from({ length: batchSize }, (_, i) => ({
    eventType: 'page_view',
    path: '/test',
    sessionId: 'sess' + i,
    userAgent: 'Mozilla/5.0',
  }));

  // Case 2: First event IS a bot (Demonstrating the bug)
  const eventsWithBotFirst = Array.from({ length: batchSize }, (_, i) => ({
    eventType: 'page_view',
    path: '/test',
    sessionId: 'sess' + i,
    userAgent: i === 0 ? 'Googlebot' : 'Mozilla/5.0',
  }));

  console.log('--- Bug Verification ---');
  const resultCurrent = await currentImplementation(eventsWithBotFirst);
  console.log('Current implementation with bot first:');
  console.log(`  dbConnect calls: ${resultCurrent.dbConnectedCount}`);
  console.log(`  Events saved: ${resultCurrent.savedCount}`);

  const resultOptimized = await optimizedImplementation(eventsWithBotFirst);
  console.log('Optimized implementation with bot first:');
  console.log(`  dbConnect calls: ${resultOptimized.dbConnectedCount}`);
  console.log(`  Events saved: ${resultOptimized.savedCount}`);

  console.log('\n--- Performance Benchmark (10k iterations of 100 events) ---');

  // Warmup
  for (let i = 0; i < 1000; i++) {
    await currentImplementation(eventsNormal);
    await optimizedImplementation(eventsNormal);
  }

  const startCurrent = performance.now();
  for (let i = 0; i < iterations; i++) {
    await currentImplementation(eventsNormal);
  }
  const endCurrent = performance.now();
  const currentTotal = endCurrent - startCurrent;

  const startOptimized = performance.now();
  for (let i = 0; i < iterations; i++) {
    await optimizedImplementation(eventsNormal);
  }
  const endOptimized = performance.now();
  const optimizedTotal = endOptimized - startOptimized;

  console.log(`Current implementation: ${currentTotal.toFixed(2)}ms`);
  console.log(`Optimized implementation: ${optimizedTotal.toFixed(2)}ms`);
  console.log(`Improvement: ${(((currentTotal - optimizedTotal) / currentTotal) * 100).toFixed(2)}%`);
}

runBenchmark().catch(console.error);
