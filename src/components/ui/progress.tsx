import React from 'react';
import { cn } from '@/lib/utils';
import type { Accent } from './variants';
import { ACCENT_BAR } from './variants';

interface ProgressProps {
  value: number;
  max: number;
  accent?: Accent;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({ value, max, accent = 'green', className }) => {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemax={max}
      className={cn('h-2 rounded-full bg-white/10 overflow-hidden', className)}
    >
      <div
        className={cn('h-full rounded-full transition-all duration-500 ease-out', ACCENT_BAR[accent])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};
