'use client';

import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cn } from '../ui';
const Switch = ({ checked, onCheckedChange, label, description }) => (
  <div className="flex items-center justify-between">
    <div className="flex flex-col">
      <label htmlFor="chatbot-status" className="block text-sm font-medium text-neutral-700">
        {label}
      </label>
      {description && <p className="text-sm text-neutral-500">{description}</p>}
    </div>
    <SwitchPrimitives.Root
      id="chatbot-status"
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={cn(
        'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-black' : 'bg-neutral-200'
      )}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </SwitchPrimitives.Root>
  </div>
);

export default Switch;