import { AGENT_IDS } from '@/lib/constants/agents';

/**
 * Resolves which agent to use for generation based on environment and request.
 * This encapsulates the dev/prod switching logic + UI override.
 */
export function resolveGenerationAgent(isDev, requestedAgent = null, isAuthenticated = false) {
  // In development, allow explicit override from UI
  if (isDev && requestedAgent) {
    if (requestedAgent === 'search') {
      return isAuthenticated ? AGENT_IDS.COURSIFY_SEARCH_PRO : AGENT_IDS.COURSIFY_SEARCH_FLASH;
    }
    if (requestedAgent === 'research') return AGENT_IDS.COURSIFY_RESEARCH;
    if (requestedAgent === 'pro') return AGENT_IDS.COURSIFY_SEARCH_PRO;
    if (requestedAgent === 'flash') return AGENT_IDS.COURSIFY_SEARCH_FLASH;
  }

  // Handle Pro/Flash selections
  if (requestedAgent === 'pro') {
    return isAuthenticated ? AGENT_IDS.COURSIFY_SEARCH_PRO : AGENT_IDS.COURSIFY_SEARCH_FLASH;
  }
  if (requestedAgent === 'flash') {
    return AGENT_IDS.COURSIFY_SEARCH_FLASH;
  }

  // Default behavior when no agent is specified
  if (isAuthenticated) {
    return AGENT_IDS.COURSIFY_SEARCH_PRO;
  }

  // Dev default is research, prod default is flash
  return isDev ? AGENT_IDS.COURSIFY_RESEARCH : AGENT_IDS.COURSIFY_SEARCH_FLASH;
}
