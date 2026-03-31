import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { getBackendSkillConfig } from '@/lib/skillConfig';

/**
 * Creates a loadSkill tool for on-demand skill content loading.
 * Implements progressive disclosure: agent only sees descriptions initially,
 * then loads full SKILL.md content when a matching skill is identified.
 *
 * @param {Array} activeSkillConfigs - The backend skill configs for active skills
 * @returns {Object} The loadSkill tool
 */
export function createLoadSkillTool(activeSkillConfigs) {
  const skillMap = new Map();
  for (const skill of activeSkillConfigs) {
    skillMap.set(skill.name, skill);
    skillMap.set(skill.id, skill);
  }

  const skillNames = activeSkillConfigs.map((s) => s.name);

  return tool(
    async ({ skillName }) => {
      const skill = skillMap.get(skillName);
      if (!skill) {
        return `Error: Skill "${skillName}" not found. Available skills: ${skillNames.join(', ')}`;
      }
      if (!skill.content) {
        return `Skill "${skill.displayName}" loaded but has no content configured.`;
      }
      return `## Skill: ${skill.displayName}\n\n${skill.content}`;
    },
    {
      name: 'loadSkill',
      description: `Load the full content of a skill by name. Use this when a user's request matches one of the available skills. Available skills: ${skillNames.join(', ')}`,
      schema: z.object({
        skillName: z
          .string()
          .describe(`The name of the skill to load. Must be one of: ${skillNames.join(', ')}`),
      }),
    }
  );
}

/**
 * Builds the skills summary section for the system prompt.
 * Only includes name + description (no full content) for progressive disclosure.
 *
 * @param {Array} activeSkillConfigs - The backend skill configs
 * @returns {string} The skills summary text to inject into the system prompt
 */
export function buildSkillsSystemPrompt(activeSkillConfigs) {
  if (!activeSkillConfigs || activeSkillConfigs.length === 0) return '';

  const skillList = activeSkillConfigs.map((s) => `- **${s.name}**: ${s.description}`).join('\n');

  return `
AVAILABLE SKILLS (on-demand):
You have access to the following specialized skills. When a user's request matches a skill's description, use the loadSkill tool to load its full instructions before proceeding.

${skillList}

To use a skill: call loadSkill with the skill name, then follow the loaded instructions.
`;
}
