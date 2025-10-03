
'use client'

import { Button } from '@/components/ui'

export default function ActionButton({ isSaving, text, savingText, variant, onClick, disabled, ...props }) {
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
  )
}
