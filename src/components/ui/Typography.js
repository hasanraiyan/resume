'use client';

import { cn } from '@/utils/classNames';

/**
 * @fileoverview Typography components for consistent text styling.
 */

/**
 * Heading Component
 * @param {Object} props
 * @param {'h1'|'h2'|'h3'|'h4'|'h5'|'h6'} [props.as='h2'] - HTML tag to render
 * @param {'display-2xl'|'display-xl'|'display-lg'|'heading-1'|'heading-2'|'heading-3'} [props.variant='heading-2'] - Visual style variant
 * @param {string} [props.className] - Additional classes
 * @param {React.ReactNode} props.children - Content
 */
export function Heading({
  as: Component = 'h2',
  variant = 'heading-2',
  className,
  children,
  ...props
}) {
  return (
    <Component
      className={cn(
        'font-display font-bold text-neutral-900',
        {
          'text-display-2xl leading-none': variant === 'display-2xl',
          'text-display-xl leading-none': variant === 'display-xl',
          'text-display-lg leading-tight': variant === 'display-lg',
          'text-heading-1 leading-tight': variant === 'heading-1',
          'text-heading-2 leading-tight': variant === 'heading-2',
          'text-heading-3 leading-snug': variant === 'heading-3',
        },
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * Text Component
 * @param {Object} props
 * @param {'p'|'span'|'div'} [props.as='p'] - HTML tag to render
 * @param {'body-lg'|'body-base'|'caption'} [props.variant='body-base'] - Visual style variant
 * @param {string} [props.className] - Additional classes
 * @param {React.ReactNode} props.children - Content
 */
export function Text({
  as: Component = 'p',
  variant = 'body-base',
  className,
  children,
  ...props
}) {
  return (
    <Component
      className={cn(
        'font-body text-neutral-600',
        {
          'text-body-lg leading-relaxed': variant === 'body-lg',
          'text-body-base leading-relaxed': variant === 'body-base',
          'text-caption leading-normal': variant === 'caption',
        },
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
