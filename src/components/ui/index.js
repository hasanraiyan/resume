/**
 * @fileoverview UI Components Index - Central export file for all reusable UI components.
 *
 * This file serves as the main entry point for importing UI components throughout the application.
 * It exports all design system components, design tokens, and utility functions for consistent
 * styling and component usage across the project.
 *
 * @example
 * ```jsx
 * // Import individual components
 * import { Button, Card, Input } from '@/components/ui';
 *
 * // Import design tokens
 * import { designTokens } from '@/components/ui';
 *
 * // Import utility functions
 * import { cn } from '@/components/ui';
 * ```
 */

// ========================================
// 🎨 DESIGN SYSTEM COMPONENTS
// Import all reusable UI components from here
// ========================================

/**
 * Reusable button component with multiple variants and Next.js Link support.
 * @see {@link ./Button.js} for detailed documentation.
 */
export { default as Button } from './Button';

/**
 * Flexible card component for content containers.
 * @see {@link ./Card.js} for detailed documentation.
 */
export { default as Card } from './Card';

/**
 * Form input component with validation and styling.
 * @see {@link ./Input.js} for detailed documentation.
 */
export { default as Input } from './Input';

/**
 * Section wrapper component for layout structure.
 * @see {@link ./Section.js} for detailed documentation.
 */
export { default as Section } from './Section';

/**
 * Badge component for status indicators and labels.
 * @see {@link ./Badge.js} for detailed documentation.
 */
export { default as Badge } from './Badge';

/**
 * Specialized badge for marking items as for sale.
 * @see {@link ./ForSaleBadge.js} for detailed documentation.
 */
export { default as ForSaleBadge } from './ForSaleBadge';

/**
 * Tab navigation component for switching between content sections.
 * @see {@link ./TabNavigation.js} for detailed documentation.
 */
export { default as TabNavigation } from './TabNavigation';

/**
 * Skeleton component with shimmer animation for loading states.
 * @see {@link ./Skeleton.js} for detailed documentation.
 */
export { default as Skeleton } from './Skeleton';

/**
 * OTP input component for 6-digit time-based one-time password entry.
 * @see {@link ./InputOTP.js} for detailed documentation.
 */
export { InputOTP, InputOTPGroup } from './InputOTP';

// ========================================
// 🎨 DESIGN TOKENS & UTILITIES
// ========================================

/**
 * Design tokens containing colors, typography, spacing, and other design values.
 * Provides consistent design system values across the application.
 *
 * @example
 * ```jsx
 * import { designTokens } from '@/components/ui';
 *
 * const styles = {
 *   color: designTokens.colors.primary,
 *   fontSize: designTokens.typography.sizes.body,
 *   padding: designTokens.spacing.medium,
 * };
 * ```
 */
export { designTokens } from '@/styles/tokens';

/**
 * Predefined component styles for consistent UI patterns.
 * Contains style objects for buttons, forms, cards, and other components.
 *
 * @example
 * ```jsx
 * import { componentStyles } from '@/components/ui';
 *
 * const buttonClasses = `${componentStyles.buttons.base} ${componentStyles.buttons.primary}`;
 * ```
 */
export { componentStyles } from '@/styles/components';

/**
 * Utility functions for working with CSS classes and responsive design.
 * Includes className merging, conditional classes, and responsive utilities.
 *
 * @example
 * ```jsx
 * import { cn, responsive } from '@/components/ui';
 *
 * // Merge classes conditionally
 * const classes = cn('base-class', condition && 'conditional-class');
 *
 * // Responsive classes
 * const responsiveClasses = responsive({
 *   mobile: 'block',
 *   tablet: 'flex',
 *   desktop: 'grid'
 * });
 * ```
 */
export { cn, conditional, responsive, spacing } from '@/utils/classNames';
