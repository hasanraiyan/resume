/**
 * @fileoverview Serialization utilities for MongoDB objects.
 * Converts complex MongoDB types (ObjectId, Date) to JSON-safe formats
 * for passing data from Server Components to Client Components in Next.js.
 *
 * These utilities are crucial for Next.js applications using MongoDB, as they handle
 * the conversion of MongoDB-specific types that cannot be directly serialized to JSON.
 * This ensures seamless data flow between server and client components.
 *
 * @example
 * ```js
 * import { serializeProject, serializeProjects } from '@/lib/serialize';
 *
 * // Serialize single project
 * const project = await Project.findOne({ slug: 'my-project' });
 * const serializedProject = serializeProject(project);
 *
 * // Serialize multiple projects
 * const projects = await Project.find({});
 * const serializedProjects = serializeProjects(projects);
 * ```
 */

/**
 * Recursively serializes MongoDB ObjectIds, Dates, and nested objects.
 * Ensures data is safe for JSON serialization and client-side consumption.
 *
 * This function handles the conversion of MongoDB-specific types that are not
 * natively serializable to JSON. It recursively processes objects and arrays,
 * converting ObjectIds to strings and Dates to ISO strings while preserving
 * the original structure.
 *
 * @function serializeForClient
 * @param {*} obj - The object to serialize (can be any type)
 * @returns {*} Serialized object with ObjectIds converted to strings and Dates to ISO strings
 *
 * @example
 * ```js
 * // Serialize a simple object
 * const data = { _id: ObjectId('507f1f77bcf86cd799439011'), name: 'Test' };
 * const serialized = serializeForClient(data);
 * // Result: { _id: '507f1f77bcf86cd799439011', name: 'Test' }
 *
 * // Serialize nested objects
 * const complexData = {
 *   project: { _id: ObjectId(), createdAt: new Date() },
 *   tags: ['tag1', 'tag2']
 * };
 * const serialized = serializeForClient(complexData);
 * // ObjectIds and Dates are converted to strings
 * ```
 */
export function serializeForClient(obj, visited = new WeakSet()) {
  if (obj === null || obj === undefined) return obj;

  // Handle MongoDB ObjectId detection more specifically
  if (obj && typeof obj === 'object' && obj.constructor && obj.constructor.name === 'ObjectId') {
    return obj.toString();
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // Handle Buffer objects
  if (Buffer.isBuffer(obj)) {
    return obj.toString('base64');
  }

  // Handle circular references
  if (typeof obj === 'object') {
    if (visited.has(obj)) {
      return '[Circular]';
    }
    visited.add(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => serializeForClient(item, visited));
  }

  if (typeof obj === 'object') {
    const serialized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Specifically handle _id fields that might be ObjectIds
      if (key === '_id' && value && typeof value === 'object') {
        if (value.constructor && value.constructor.name === 'ObjectId') {
          serialized[key] = value.toString();
        } else if (value.toString && typeof value.toString === 'function') {
          serialized[key] = value.toString();
        } else {
          serialized[key] = String(value);
        }
      } else if (value && typeof value === 'object') {
        serialized[key] = serializeForClient(value, visited);
      } else {
        serialized[key] = value;
      }
    }
    return serialized;
  }

  return obj;
}

/**
 * Serializes a single project object with explicit ID handling.
 * Ensures both _id and id fields are properly converted to strings.
 *
 * @function serializeProject
 * @param {Object} project - The project object to serialize
 * @returns {Object|null} Serialized project or null if input is falsy
 */
export function serializeProject(project) {
  if (!project) return null;

  return {
    ...serializeForClient(project),
    id: project._id.toString(),
    _id: project._id.toString(),
  };
}

/**
 * Serializes an array of project objects.
 * Maps each project through the serializeProject function.
 *
 * @function serializeProjects
 * @param {Array} projects - Array of project objects to serialize
 * @returns {Array} Array of serialized projects, or empty array if input is invalid
 */
export function serializeProjects(projects) {
  if (!Array.isArray(projects)) return [];

  return projects.map((project) => serializeProject(project));
}
