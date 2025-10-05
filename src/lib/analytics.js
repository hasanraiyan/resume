const BOT_AGENTS = [
  'googlebot',
  'bingbot',
  'slurp',
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  'sogou',
  'exabot',
  'facebot',
  'ia_archiver',
];

const getSessionId = () => {
  if (typeof window === 'undefined') return null;
  let sessionId = localStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

const isBot = () => {
  if (typeof window === 'undefined') return true; // Assume bot on server
  const userAgent = navigator.userAgent.toLowerCase();
  return BOT_AGENTS.some(bot => userAgent.includes(bot));
};

export const trackEvent = async (eventType, path) => {
  if (isBot()) {
    return;
  }

  const sessionId = getSessionId();
  if (!sessionId) return;

  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventType,
        path,
        sessionId,
      }),
    });
  } catch (error) {
    console.error('Failed to track event:', error);
  }
};