'use client';

import toast from 'react-hot-toast';
import Button from './Button';
import { cn } from '@/utils/classNames';

/**
 * A button that copies the given text to the clipboard and shows a toast notification.
 * @param {object} props
 * @param {string} props.textToCopy - The text to be copied to the clipboard.
 * @param {string} props.className - Additional classes for the button.
 * @param {React.ReactNode} props.children - The content of the button.
 */
export default function CopyButton({
  textToCopy,
  className = '',
  children = (
    <div className="flex items-center">
      <i className="fas fa-copy text-lg"></i>
    </div>
  ),
}) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast.success('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy content.');
    }
  };

  return (
    <div className="relative flex items-center group">
      <Button
        variant="ghost"
        size="small"
        onClick={handleCopy}
        className={cn('copy-button', className)}
        aria-label="Copy to clipboard"
      >
        {children}
      </Button>
      <div
        className={cn(
          'absolute left-1/2 -translate-x-1/2 -bottom-10 px-3 py-1.5 bg-gray-800 text-white text-xs font-medium rounded-md shadow-lg transition-opacity duration-300 pointer-events-none',
          'opacity-0 group-hover:opacity-100'
        )}
      >
        Copy as Markdown
        <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-gray-800 rotate-45"></div>
      </div>
    </div>
  );
}
