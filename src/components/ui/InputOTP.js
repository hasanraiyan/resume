'use client';

import React, { useState, useRef } from 'react';

// 1. Group Wrapper
export function InputOTPGroup({ children, className = '' }) {
  return <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>{children}</div>;
}

// 2. Individual Slot Component (Clean, flat styling)
const InputOTPSlot = React.forwardRef(
  ({ value, onChange, onKeyDown, onPaste, onFocus, disabled }, ref) => {
    return (
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        pattern="\d*"
        value={value || ''}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onFocus={onFocus}
        disabled={disabled}
        // REMOVED: shadow-sm, border-2, focus:ring-4.
        // ADDED: flat 'border', simple 'focus:border-black'
        className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-semibold text-gray-900 bg-white border border-gray-300 rounded-lg outline-none transition-colors duration-200 focus:border-black disabled:opacity-50 disabled:bg-gray-100"
      />
    );
  }
);
InputOTPSlot.displayName = 'InputOTPSlot';

// 3. Main OTP Component Logic
export function InputOTP({ maxLength = 6, value = '', onChange, disabled }) {
  const inputRefs = useRef([]);

  const updateOtp = (newString) => {
    onChange(newString.slice(0, maxLength));
  };

  const handleChange = (e, index) => {
    const rawValue = e.target.value;
    const cleanValue = rawValue.replace(/\D/g, '');

    if (rawValue === '') {
      const valArr = value.split('');
      valArr[index] = '';
      updateOtp(valArr.join(''));
      return;
    }

    if (!cleanValue) return;

    // Handle Mobile Autofill / Multi-character paste
    if (cleanValue.length > 1) {
      const newString =
        value.substring(0, index) + cleanValue + value.substring(index + cleanValue.length);
      updateOtp(newString);

      const nextIndex = Math.min(index + cleanValue.length, maxLength - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    // Normal single-character typing
    const digit = cleanValue.slice(-1);
    const valArr = value.split('');
    valArr[index] = digit;
    updateOtp(valArr.join(''));

    if (digit && index < maxLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const valArr = value.split('');

      if (valArr[index]) {
        valArr[index] = '';
        updateOtp(valArr.join(''));
      } else if (index > 0) {
        valArr[index - 1] = '';
        updateOtp(valArr.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    }

    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
      setTimeout(() => inputRefs.current[index - 1]?.select(), 0);
    }
    if (e.key === 'ArrowRight' && index < maxLength - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
      setTimeout(() => inputRefs.current[index + 1]?.select(), 0);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');

    if (pastedData) {
      updateOtp(pastedData);
      const nextIndex = Math.min(pastedData.length, maxLength - 1);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleFocus = (e) => {
    e.target.select();
  };

  const slots = Array.from({ length: maxLength }).map((_, i) => (
    <InputOTPSlot
      key={i}
      ref={(el) => (inputRefs.current[i] = el)}
      value={value[i] || ''}
      onChange={(e) => handleChange(e, i)}
      onKeyDown={(e) => handleKeyDown(e, i)}
      onPaste={handlePaste}
      onFocus={handleFocus}
      disabled={disabled}
    />
  ));

  return <InputOTPGroup>{slots}</InputOTPGroup>;
}

// 4. Demo component to test it
export default function InputOTPDemo() {
  const [value, setValue] = useState('');

  return (
    <div className="flex flex-col items-center justify-center min-h-[250px] gap-6 p-8">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-medium text-gray-900">Verification Code</h2>
      </div>

      <InputOTP maxLength={6} value={value} onChange={setValue} />

      <div className="h-4">
        {value.length === 6 && (
          <p className="text-sm font-medium text-black">Code entered: {value}</p>
        )}
      </div>
    </div>
  );
}
