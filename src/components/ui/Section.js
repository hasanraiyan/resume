'use client';

import { cn } from '@/utils/classNames';
import { componentStyles } from '@/styles/components';
import Breadcrumb from './Breadcrumb';

/**
 * Reusable Section Component
 * @param {object} props
 * @param {string} props.id - Section ID for anchor links
 * @param {string} props.title - Section title
 * @param {string} props.description - Section description
 * @param {boolean} props.centered - Center the header
 * @param {string} props.className - Additional wrapper classes
 * @param {string} props.containerClassName - Additional container classes
 * @param {Array} props.breadcrumbs - Array of breadcrumb items: [{ label, path?, icon?: 'Home' | 'FolderOpen' | 'FileText' }]
 * @param {React.ReactNode} props.children
 */
export default function Section({
  id,
  title,
  description,
  centered = false,
  className = '',
  containerClassName = '',
  breadcrumbs,
  children,
}) {
  return (
    <section id={id} className={cn(componentStyles.sections.wrapper, className)}>
      <div className={cn(componentStyles.sections.container, containerClassName)}>
        {breadcrumbs && <Breadcrumb breadcrumbs={breadcrumbs} />}
        {(title || description) && (
          <div className={centered ? componentStyles.sections.header : 'mb-12 sm:mb-16'}>
            {title && <h2 className={componentStyles.sections.title}>{title}</h2>}
            {description && <p className={componentStyles.sections.description}>{description}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
