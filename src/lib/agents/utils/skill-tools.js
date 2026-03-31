import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { getBackendSkillConfig } from '@/lib/skillConfig';
import dbConnect from '@/lib/dbConnect';
import Skill from '@/models/Skill';

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

/**
 * Admin-only tools for creating and managing skills.
 * @returns {Array} Array of LangChain tools
 */
export function createSkillAdminTools() {
  return [
    tool(
      async ({ name, displayName, description, content, category }) => {
        try {
          await dbConnect();

          const existing = await Skill.findOne({ name });
          if (existing) {
            return `Error: A skill with name "${name}" already exists.`;
          }

          const skill = new Skill({
            name,
            displayName,
            description,
            content: content || '',
            category: category || 'general',
            isActive: true,
          });

          await skill.save();

          return JSON.stringify({
            success: true,
            message: `Skill "${displayName}" created successfully.`,
            skill: {
              id: skill._id.toString(),
              name: skill.name,
              displayName: skill.displayName,
              category: skill.category,
              isActive: skill.isActive,
            },
          });
        } catch (error) {
          console.error('[skill-tools] Error creating skill:', error);
          return JSON.stringify({ error: error.message });
        }
      },
      {
        name: 'createSkill',
        description:
          'Create a new skill that agents can use. Requires a unique name, display name, description (for matching), and full instruction content.',
        schema: z.object({
          name: z
            .string()
            .describe('Unique skill identifier (lowercase, hyphens). e.g. "sql-expert"'),
          displayName: z.string().describe('Human-readable name. e.g. "SQL Expert"'),
          description: z
            .string()
            .describe(
              'Description used for skill matching. What this skill helps with. Max 1024 chars.'
            ),
          content: z
            .string()
            .optional()
            .describe('Full SKILL.md instruction content loaded on-demand by the agent.'),
          category: z
            .enum(['general', 'coding', 'writing', 'data', 'research', 'design', 'devops', 'other'])
            .optional()
            .describe('Skill category. Defaults to "general".'),
        }),
      }
    ),

    tool(
      async ({ skillName, content, description, isActive }) => {
        try {
          await dbConnect();

          const skill = await Skill.findOne({ name: skillName });
          if (!skill) {
            return `Error: Skill "${skillName}" not found.`;
          }

          const updates = {};
          if (content !== undefined) updates.content = content;
          if (description !== undefined) updates.description = description;
          if (isActive !== undefined) updates.isActive = isActive;

          if (Object.keys(updates).length === 0) {
            return `No updates provided. Current skill: ${skill.displayName} (${skill.name})`;
          }

          await Skill.findByIdAndUpdate(skill._id, { $set: updates });

          return JSON.stringify({
            success: true,
            message: `Skill "${skill.displayName}" updated successfully.`,
            updated: updates,
          });
        } catch (error) {
          console.error('[skill-tools] Error updating skill:', error);
          return JSON.stringify({ error: error.message });
        }
      },
      {
        name: 'updateSkill',
        description: 'Update an existing skill. Can update content, description, or active status.',
        schema: z.object({
          skillName: z.string().describe('The name of the skill to update.'),
          content: z.string().optional().describe('New full instruction content for the skill.'),
          description: z.string().optional().describe('New description for skill matching.'),
          isActive: z.boolean().optional().describe('Set active/inactive status.'),
        }),
      }
    ),

    tool(
      async () => {
        try {
          await dbConnect();
          const skills = await Skill.find({}).select(
            'name displayName description category isActive isDefault'
          );

          if (skills.length === 0) {
            return 'No skills found in the database.';
          }

          const list = skills
            .map(
              (s) =>
                `- **${s.displayName}** (${s.name}) [${s.category}] ${s.isDefault ? '⭐ Default' : ''} ${s.isActive ? '✅' : '❌'}`
            )
            .join('\n');

          return `Available Skills:\n${list}`;
        } catch (error) {
          console.error('[skill-tools] Error listing skills:', error);
          return JSON.stringify({ error: error.message });
        }
      },
      {
        name: 'listSkills',
        description: 'List all skills in the database with their status and category.',
        schema: z.object({}),
      }
    ),
  ];
}
