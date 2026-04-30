'use client';

import { cn } from '@/utils/classNames';
import { componentStyles } from '@/styles/components';

/**
 * Reusable Card Component
 * @param {object} props
 * @param {'elevated'|'bordered'|'flat'} props.variant
 * @param {boolean} props.interactive - Enable hover effects
 * @param {string} props.className - Additional classes
 * @param {React.ReactNode} props.children
 */
export default function Card({
  variant = 'elevated',
  interactive = false,
  className = '',
  children,
  ...props
}) {
  const classes = cn(
    componentStyles.cards.base,
    variant !== 'flat' && componentStyles.cards[variant],
    interactive && componentStyles.cards.interactive,
    className
  );

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
