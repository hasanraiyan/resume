'use client';

import { Button } from '@/components/ui';

/**
 * Action button component with loading state and spinner animation.
 *
 * Extends the base Button component with saving/loading functionality,
 * showing a spinner icon and custom saving text when in loading state.
 * Commonly used for form submissions and async operations in admin panels.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isSaving - Whether to show loading state
 * @param {string} props.text - Button text when not loading
 * @param {string} props.savingText - Button text when loading (default: 'Saving...')
 * @param {string} props.variant - Button variant ('primary', 'secondary', etc.)
 * @param {Function} props.onClick - Click handler function
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {...Object} props - Additional props passed to Button component
 * @returns {JSX.Element} Action button with loading state
 */
export default function ActionButton({
  isSaving,
  text,
  savingText,
  variant,
  onClick,
  disabled,
  ...props
}) {
  return (
    <Button
      type={onClick ? 'button' : 'submit'}
      variant={variant || 'primary'}
      disabled={disabled || isSaving}
      onClick={onClick}
      {...props}
    >
      {isSaving ? (
        <>
          <i className="fas fa-spinner fa-spin mr-2"></i>
          {savingText || 'Saving...'}
        </>
      ) : (
        text
      )}
    </Button>
  );
}
