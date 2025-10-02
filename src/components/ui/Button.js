'use client'

import { cn } from '@/utils/classNames'
import { componentStyles } from '@/styles/components'

/**
 * Reusable Button Component
 * @param {object} props
 * @param {'primary'|'secondary'|'ghost'} props.variant - Button style variant
 * @param {'small'|'base'|'large'} props.size - Button size
 * @param {boolean} props.magnetic - Enable magnetic effect
 * @param {string} props.href - Link href (renders as <a>)
 * @param {function} props.onClick - Click handler
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.className - Additional classes
 */
export default function Button({
  variant = 'primary',
  size = 'base',
  magnetic = true,
  href,
  onClick,
  children,
  className = '',
  ...props
}) {
  // Combine classes
  const classes = cn(
    componentStyles.buttons.base,
    componentStyles.buttons[variant],
    size !== 'base' && componentStyles.buttons[size],
    magnetic && 'magnetic-btn',
    className
  )

  // Render as link or button
  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    )
  }

  return (
    <button onClick={onClick} className={classes} {...props}>
      {children}
    </button>
  )
}