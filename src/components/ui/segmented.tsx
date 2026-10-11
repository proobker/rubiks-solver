import React from 'react';
import { cn } from '@/lib/utils';
import type { Accent } from './variants';
import { ACCENT_BAR } from './variants';

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  accent?: Accent;
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
  ariaLabel?: string;
}

export function Segmented<T extends string>({ options, value, onChange, size = 'md', className, ariaLabel }: SegmentedProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn('flex gap-1 p-1 rounded-2xl bg-black/30 border border-white/[0.06]', className)}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition-all duration-200',
              size === 'md' ? 'h-9 text-xs' : 'h-7 text-[11px]',
              active
                ? 'bg-white/[0.1] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_2px_6px_rgba(0,0,0,0.35)]'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]',
            )}
          >
            {o.icon}
            <span>{o.label}</span>
            {active && o.accent && (
              <span className={cn('absolute bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-5 rounded-full', ACCENT_BAR[o.accent])} />
            )}
          </button>
        );
      })}
    </div>
  );
}
