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
  onBlur,
  placeholder = '',
  required = false,
  className = '',
  hasError = false,
  id,
  ...props
}) {
  const inputId = id || name;
  return (
    <div>
      {label && (
        <label htmlFor={inputId} className={componentStyles.forms.label}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        aria-invalid={hasError ? 'true' : undefined}
        className={cn(
          componentStyles.forms.input,
          hasError && 'ring-1 ring-red-500 border-red-500',
          className
        )}
        suppressHydrationWarning={true}
        {...props}
      />
    </div>
  );
}
