import agentRegistry from '@/lib/agents';
import { resolveGenerationAgent } from './AgentSelector';

/**
 * Generates a single section using the appropriate agent.
 * This is a thin orchestrator for section generation (used by /generate-section).
 */
export async function generateSection({
  sectionName,
  courseName,
  moduleName,
  learningGoals,
  isReferenceEnabled = false,
  requestedAgent = null, // 'search' | 'research' from UI (dev only)
}) {
  if (!sectionName?.trim()) {
    throw new Error('sectionName is required');
  }

  // Build rich topic with context
  let richTopic = `${sectionName.trim()}\n\n`;
  richTopic += `Context for Research:\n`;
  if (courseName) richTopic += `- Part of the course: ${courseName}\n`;
  if (moduleName) richTopic += `- Within the module: ${moduleName}\n`;
  if (learningGoals?.length > 0) {
    richTopic += `- Learning Goals: ${learningGoals.join(', ')}\n`;
  }
  richTopic += `\nPlease research this specific topic and ensure the content fits this context.`;

  const isDev = process.env.NODE_ENV === 'development';
  const agentId = resolveGenerationAgent(isDev, requestedAgent);

  return {
    agentId,
    topic: richTopic,
    isReferenceEnabled,
  };
}
