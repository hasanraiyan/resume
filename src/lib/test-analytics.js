// src/lib/test-analytics.js
import dbConnect from './dbConnect';
import Analytics from './models/Analytics';

async function createTestAnalytics() {
  await dbConnect();

  const testEvents = [
    {
      eventType: 'pageview',
      path: '/',
      sessionId: 'test_session_1',
      userAgent: 'Mozilla/5.0 (Test Browser)',
      referrer: '',
      properties: {},
      timestamp: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
    },
    {
      eventType: 'pageview',
      path: '/projects',
      sessionId: 'test_session_1',
      userAgent: 'Mozilla/5.0 (Test Browser)',
      referrer: '/',
      properties: {},
      timestamp: new Date(Date.now() - 1000 * 60 * 4) // 4 minutes ago
    },
    {
      eventType: 'pageview',
      path: '/',
      sessionId: 'test_session_2',
      userAgent: 'Mozilla/5.0 (Test Browser)',
      referrer: '',
      properties: {},
      timestamp: new Date(Date.now() - 1000 * 60 * 10) // 10 minutes ago
    },
    {
      eventType: 'custom',
      path: '/projects',
      sessionId: 'test_session_2',
      userAgent: 'Mozilla/5.0 (Test Browser)',
      referrer: '/',
      properties: { eventName: 'project_click', projectId: '123' },
      timestamp: new Date(Date.now() - 1000 * 60 * 9) // 9 minutes ago
    }
  ];

  try {
    await Analytics.insertMany(testEvents);
    console.log('Test analytics data created successfully');

    // Test the aggregation
    const sessions = await Analytics.getSessionStats(
      new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      new Date()
    );

    console.log('Session aggregation result:', JSON.stringify(sessions, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error creating test data:', error);
    process.exit(1);
  }
}

createTestAnalytics();
