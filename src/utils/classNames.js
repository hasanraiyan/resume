// ========================================
// 🛠️ UTILITY FUNCTIONS
// Helper functions for the design system
// ========================================

/**
 * Combines multiple class names into a single string
 * Filters out falsy values
 * @param  {...any} classes 
 * @returns {string}
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

/**
 * Conditionally apply classes
 * @param {string} baseClasses - Always applied
 * @param {object} conditionalClasses - Object with condition: class pairs
 * @returns {string}
 */
export function conditional(baseClasses, conditionalClasses = {}) {
  const classes = [baseClasses]
  
  Object.entries(conditionalClasses).forEach(([condition, className]) => {
    if (condition) {
      classes.push(className)
    }
  })
  
  return classes.filter(Boolean).join(' ')
}

/**
 * Generate responsive classes
 * @param {object} sizes - Object with breakpoint: value pairs
 * @param {string} property - CSS property prefix (e.g., 'text', 'p', 'm')
 * @returns {string}
 */
export function responsive(sizes, property) {
  const classes = []
  
  if (sizes.mobile) classes.push(`${property}-${sizes.mobile}`)
  if (sizes.sm) classes.push(`sm:${property}-${sizes.sm}`)
  if (sizes.md) classes.push(`md:${property}-${sizes.md}`)
  if (sizes.lg) classes.push(`lg:${property}-${sizes.lg}`)
  if (sizes.xl) classes.push(`xl:${property}-${sizes.xl}`)
  
  return classes.join(' ')
}

/**
 * Get spacing classes
 * @param {string|object} value - Single value or responsive object
 * @param {string} type - 'p', 'm', 'px', 'py', etc.
 * @returns {string}
 */
export function spacing(value, type = 'p') {
  if (typeof value === 'string' || typeof value === 'number') {
    return `${type}-${value}`
  }
  
  return responsive(value, type)
}

export default {
  cn,
  conditional,
  responsive,
  spacing,
}