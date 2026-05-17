/**
 * Tool Usage Service
 * Fetches real-time quota and credit information from external APIs.
 */
export async function getToolUsage(toolId, apiKey) {
  if (!apiKey) return null;

  try {
    switch (toolId) {
      case 'tavily':
        return await fetchTavilyUsage(apiKey);
      case 'firecrawl':
        return await fetchFirecrawlUsage(apiKey);
      default:
        return null;
    }
  } catch (error) {
    console.error(`[ToolUsage] Failed to fetch usage for ${toolId}:`, error.message);
    return { error: error.message };
  }
}

async function fetchTavilyUsage(apiKey) {
  const res = await fetch('https://api.tavily.com/usage', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) throw new Error(`Tavily API responded with ${res.status}`);

  const data = await res.json();

  // Tavily resets on the 1st of every month
  const now = new Date();
  const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return {
    used: data.account?.plan_usage || 0,
    total: data.account?.plan_limit || 1000,
    remaining: (data.account?.plan_limit || 1000) - (data.account?.plan_usage || 0),
    resetDate: resetDate.toISOString(),
    plan: data.account?.current_plan || 'Free',
  };
}

async function fetchFirecrawlUsage(apiKey) {
  const res = await fetch('https://api.firecrawl.dev/v1/team/credit-usage', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) throw new Error(`Firecrawl API responded with ${res.status}`);

  const { data } = await res.json();

  const total = data.planCredits || 1000;
  const remaining = data.remainingCredits || 0;
  const used = Math.max(0, total - remaining);

  return {
    used,
    total,
    remaining,
    resetDate: data.billingPeriodEnd || null,
    plan: 'Managed',
  };
}
