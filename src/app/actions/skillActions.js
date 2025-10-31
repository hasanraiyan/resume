/**
 * @fileoverview Skill management actions for handling skill CRUD operations.
 * Provides server-side functions for creating, updating, deleting, and retrieving skills.
 */

'use server';

import dbConnect from '@/lib/dbConnect';
import Skill from '@/models/Skill';
import { revalidatePath } from 'next/cache';
import { serializeForClient } from '@/lib/serialize';

/**
 * Retrieves all skills from the database, sorted by display order.
 * @returns {Array} Array of serialized skill objects
 */
export async function getAllSkills() {
  try {
    await dbConnect();
    const skills = await Skill.find({}).sort({ displayOrder: 1 });
    return serializeForClient(skills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    throw new Error('Failed to fetch skills');
  }
}

/**
 * Creates a new skill in the database with the provided form data.
 * @param {FormData} formData - Form data containing skill information
 * @returns {Object} Success message or error
 */
export async function createSkill(formData) {
  try {
    await dbConnect();

    const skillData = Object.fromEntries(formData.entries());
    console.log('🔍 [CREATE SKILL] Form data received:', skillData);

    const skill = new Skill(skillData);
    await skill.save();

    revalidatePath('/admin/skills');
    revalidatePath('/'); // Revalidate home page for skills section

    return { success: true, message: 'Skill created successfully' };
  } catch (error) {
    console.error('Error creating skill:', error);
    return { success: false, message: 'Failed to create skill' };
  }
}

/**
 * Updates an existing skill in the database.
 * @param {string} id - Skill ID to update
 * @param {FormData} formData - Updated form data
 * @returns {Object} Success message or error
 */
export async function updateSkill(id, formData) {
  try {
    await dbConnect();

    const skillData = Object.fromEntries(formData.entries());
    console.log('🔍 [UPDATE SKILL] Updating skill:', id, skillData);

    await Skill.findByIdAndUpdate(id, skillData);

    revalidatePath('/admin/skills');
    revalidatePath('/');

    return { success: true, message: 'Skill updated successfully' };
  } catch (error) {
    console.error('Error updating skill:', error);
    return { success: false, message: 'Failed to update skill' };
  }
}

/**
 * Deletes a skill from the database.
 * @param {string} id - Skill ID to delete
 * @returns {Object} Success message or error
 */
export async function deleteSkill(id) {
  try {
    await dbConnect();

    console.log('🗑️ [DELETE SKILL] Deleting skill:', id);
    await Skill.findByIdAndDelete(id);

    revalidatePath('/admin/skills');
    revalidatePath('/');

    return { success: true, message: 'Skill deleted successfully' };
  } catch (error) {
    console.error('Error deleting skill:', error);
    return { success: false, message: 'Failed to delete skill' };
  }
}

/**
 * Retrieves a single skill by ID.
 * @param {string} id - Skill ID
 * @returns {Object} Serialized skill object or null
 */
export async function getSkillById(id) {
  try {
    await dbConnect();
    const skill = await Skill.findById(id);
    return skill ? serializeForClient(skill) : null;
  } catch (error) {
    console.error('Error fetching skill:', error);
    return null;
  }
}
