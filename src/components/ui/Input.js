'use client';

import { cn } from '@/utils/classNames';
import { componentStyles } from '@/styles/components';

/**
 * Reusable Input Component
 * @param {object} props
 * @param {string} props.label - Input label
 * @param {string} props.type - Input type
 * @param {string} props.name - Input name
 * @param {string} props.value - Input value
 * @param {function} props.onChange - Change handler
 * @param {string} props.placeholder
 * @param {boolean} props.required
 * @param {string} props.className
 */
export default function Input({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder = '',
  required = false,
  className = '',
  ...props
}) {
  return (
    <div>
      {label && <label className={componentStyles.forms.label}>{label}</label>}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={cn(componentStyles.forms.input, className)}
        suppressHydrationWarning={true}
        {...props}
      />
    </div>
  );
}
