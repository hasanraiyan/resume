import dbConnect from '@/lib/dbConnect';
import Skill from '@/models/Skill';

/**
 * Server-side configuration for all available Skills.
 * This file is NEVER sent to the client in full. It contains the actual
 * skill content (instructions), which may be large.
 */
export const getBackendSkillConfig = async (isAdmin = false) => {
  try {
    await dbConnect();
    const query = { isActive: true };
    if (!isAdmin) {
      query.adminOnly = { $ne: true };
    }
    const dynamicSkills = await Skill.find(query);

    const dbConfigs = dynamicSkills.map((skill) => ({
      id: skill._id.toString(),
      name: skill.name,
      displayName: skill.displayName,
      description: skill.description,
      content: skill.content,
      category: skill.category || 'general',
      icon: skill.icon || 'Wrench',
      color: skill.color || 'purple-500',
      adminOnly: skill.adminOnly || false,
      isDefault: skill.isDefault || false,
      allowedTools: skill.allowedTools || [],
    }));

    return [...dbConfigs];
  } catch (error) {
    console.error('Error fetching dynamic Skill config:', error);
    return [];
  }
};

/**
 * Returns a sanitized list of available Skills for the frontend.
 * Strips out the actual content to reduce payload and keep instructions server-side.
 * The agent loads full content on-demand via the loadSkill tool.
 */
export const getFrontendSafeSkills = async (isAdmin = false) => {
  const config = await getBackendSkillConfig(isAdmin);
  return config
    .filter((skill) => !skill.isDefault)
    .map(({ id, name, displayName, description, category, icon, color }) => ({
      id,
      name,
      displayName,
      description,
      category: category || 'general',
      icon: icon || 'Wrench',
      color: color || 'purple-500',
    }));
};
