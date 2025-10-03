// Helper function to recursively serialize MongoDB ObjectIds and other complex objects
// for safe passing from Server Components to Client Components

export function serializeForClient(obj) {
  if (obj === null || obj === undefined) return obj
  
  // Handle MongoDB ObjectId detection more specifically
  if (obj && typeof obj === 'object' && obj.constructor && obj.constructor.name === 'ObjectId') {
    return obj.toString()
  }
  
  // Handle Date objects
  if (obj instanceof Date) {
    return obj.toISOString()
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => serializeForClient(item))
  }
  
  if (typeof obj === 'object') {
    const serialized = {}
    for (const [key, value] of Object.entries(obj)) {
      // Specifically handle _id fields that might be ObjectIds
      if (key === '_id' && value && typeof value === 'object') {
        if (value.constructor && value.constructor.name === 'ObjectId') {
          serialized[key] = value.toString()
        } else if (value.toString && typeof value.toString === 'function') {
          serialized[key] = value.toString()
        } else {
          serialized[key] = String(value)
        }
      } else if (value && typeof value === 'object') {
        serialized[key] = serializeForClient(value)
      } else {
        serialized[key] = value
      }
    }
    return serialized
  }
  
  return obj
}

// Convenience function for serializing project data specifically
export function serializeProject(project) {
  if (!project) return null
  
  return {
    ...serializeForClient(project),
    id: project._id.toString(),
    _id: project._id.toString(),
  }
}

// Convenience function for serializing arrays of projects
export function serializeProjects(projects) {
  if (!Array.isArray(projects)) return []
  
  return projects.map(project => serializeProject(project))
}
