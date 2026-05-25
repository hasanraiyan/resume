import { AGENT_IDS } from '@/lib/constants/agents';

/**
 * Resolves which agent to use for generation based on environment and request.
 * This encapsulates the dev/prod switching logic + UI override.
 */
export function resolveGenerationAgent(isDev, requestedAgent = null) {
  // In development, allow explicit override from UI (openai = search, antigravity = research)
  if (isDev && requestedAgent) {
    if (requestedAgent === 'search') return AGENT_IDS.COURSIFY_SEARCH;
    if (requestedAgent === 'research') return AGENT_IDS.COURSIFY_RESEARCH;
  }

  // Default behavior
  return isDev ? AGENT_IDS.COURSIFY_RESEARCH : AGENT_IDS.COURSIFY_SEARCH;
}
