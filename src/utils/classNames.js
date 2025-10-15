/**
 * @fileoverview Class Name Utilities - Helper functions for working with CSS classes and responsive design.
 *
 * Provides utility functions for combining, conditionally applying, and generating responsive CSS classes.
 * These utilities are essential for the design system and are used throughout the application for
 * consistent styling and responsive behavior.
 *
 * @example
 * ```jsx
 * import { cn, conditional, responsive, spacing } from '@/utils/classNames';
 *
 * // Combine classes
 * const classes = cn('base-class', condition && 'conditional-class');
 *
 * // Conditional classes
 * const buttonClasses = conditional('btn', {
 *   'btn-primary': variant === 'primary',
 *   'btn-secondary': variant === 'secondary',
 *   'btn-disabled': disabled,
 * });
 *
 * // Responsive classes
 * const textClasses = responsive(
 *   { mobile: 'sm', tablet: 'base', desktop: 'lg' },
 *   'text'
 * );
 *
 * // Spacing utilities
 * const padding = spacing('4', 'p'); // 'p-4'
 * const responsiveMargin = spacing({ mobile: '2', tablet: '4', desktop: '6' }, 'm');
 * ```
 */

// ========================================
// 🛠️ UTILITY FUNCTIONS
// Helper functions for the design system
// ========================================

/**
 * Combines multiple class names into a single string, filtering out falsy values.
 *
 * This is the core utility function for safely combining CSS classes. It removes any
 * falsy values (null, undefined, false, empty strings) and joins the remaining classes
 * with spaces. Essential for conditional styling and dynamic class application.
 *
 * @function cn
 * @param {...any} classes - Variable number of class names, objects, or other values
 * @returns {string} Combined class string with falsy values removed
 *
 * @example
 * ```jsx
 * // Basic usage
 * cn('class1', 'class2', 'class3'); // 'class1 class2 class3'
 *
 * // With conditional classes
 * cn('base-class', isActive && 'active', hasError && 'error'); // 'base-class active'
 *
 * // Filters out falsy values
 * cn('class1', null, 'class2', undefined, '', 'class3'); // 'class1 class2 class3'
 * ```
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Conditionally applies CSS classes based on boolean conditions.
 *
 * Useful for applying classes based on component props, state, or other conditions.
 * Always applies the base classes, then adds conditional classes only if their
 * corresponding condition evaluates to true.
 *
 * @function conditional
 * @param {string} baseClasses - Base classes that are always applied
 * @param {Object} [conditionalClasses={}] - Object mapping conditions to class names
 * @returns {string} Combined class string
 *
 * @example
 * ```jsx
 * // Simple conditional classes
 * conditional('btn', {
 *   'btn-primary': variant === 'primary',
 *   'btn-large': size === 'large',
 * }); // 'btn btn-primary' (if variant is 'primary')
 *
 * // With multiple conditions
 * conditional('card', {
 *   'card-featured': featured,
 *   'card-disabled': disabled,
 *   'card-loading': loading,
 * }); // 'card card-featured card-loading' (if featured and loading are true)
 * ```
 */
export function conditional(baseClasses, conditionalClasses = {}) {
  const classes = [baseClasses];

  Object.entries(conditionalClasses).forEach(([condition, className]) => {
    if (condition) {
      classes.push(className);
    }
  });

  return classes.filter(Boolean).join(' ');
}

/**
 * Generates responsive CSS classes for different screen sizes.
 *
 * Creates Tailwind CSS responsive classes based on breakpoint-specific values.
 * Supports mobile-first responsive design with sm, md, lg, and xl breakpoints.
 *
 * @function responsive
 * @param {Object} sizes - Object with breakpoint keys and size values
 * @param {string} property - CSS property prefix (e.g., 'text', 'p', 'm', 'flex')
 * @returns {string} Space-separated responsive classes
 *
 * @example
 * ```jsx
 * // Text sizes
 * responsive({ mobile: 'sm', tablet: 'base', desktop: 'lg' }, 'text');
 * // 'text-sm sm:text-base md:text-lg'
 *
 * // Padding
 * responsive({ mobile: '2', tablet: '4', desktop: '8' }, 'p');
 * // 'p-2 sm:p-4 md:p-8'
 *
 * // Display properties
 * responsive({ mobile: 'block', tablet: 'flex', desktop: 'grid' }, 'flex');
 * // 'flex-block sm:flex-flex md:flex-grid'
 * ```
 */
export function responsive(sizes, property) {
  const classes = [];

  if (sizes.mobile) classes.push(`${property}-${sizes.mobile}`);
  if (sizes.sm) classes.push(`sm:${property}-${sizes.sm}`);
  if (sizes.md) classes.push(`md:${property}-${sizes.md}`);
  if (sizes.lg) classes.push(`lg:${property}-${sizes.lg}`);
  if (sizes.xl) classes.push(`xl:${property}-${sizes.xl}`);

  return classes.join(' ');
}

/**
 * Generates spacing classes for padding and margins.
 *
 * Provides a convenient way to create spacing classes, supporting both single values
 * and responsive objects. Commonly used for padding ('p', 'px', 'py') and margins ('m', 'mx', 'my').
 *
 * @function spacing
 * @param {string|number|Object} value - Single spacing value or responsive object
 * @param {string} [type='p'] - Spacing type ('p' for padding, 'm' for margin, etc.)
 * @returns {string} Generated spacing class(es)
 *
 * @example
 * ```jsx
 * // Single value
 * spacing('4', 'p'); // 'p-4'
 * spacing('8', 'm'); // 'm-8'
 *
 * // Responsive spacing
 * spacing({ mobile: '2', tablet: '4', desktop: '8' }, 'p');
 * // 'p-2 sm:p-4 md:p-8'
 *
 * // Different spacing types
 * spacing('4', 'px'); // 'px-4' (horizontal padding)
 * spacing('2', 'py'); // 'py-2' (vertical padding)
 * spacing('6', 'mx'); // 'mx-6' (horizontal margins)
 * ```
 */
export function spacing(value, type = 'p') {
  if (typeof value === 'string' || typeof value === 'number') {
    return `${type}-${value}`;
  }

  return responsive(value, type);
}

const classNameUtils = {
  cn,
  conditional,
  responsive,
  spacing,
};

export default classNameUtils;
