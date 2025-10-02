'use client'

import { cn } from '@/utils/classNames'
import { componentStyles } from '@/styles/components'

/**
 * Reusable Badge Component
 * @param {object} props
 * @param {'category'|'tag'|'number'} props.variant
 * @param {string} props.className
 * @param {React.ReactNode} props.children
 */
export default function Badge({
  variant = 'tag',
  className = '',
  children,
}) {
  return (
    <span className={cn(componentStyles.badges[variant], className)}>
      {children}
    </span>
  )
}