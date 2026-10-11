import React from 'react';
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'green' | 'amber' | 'violet' | 'sky' | 'red';

const TONES: Record<Tone, string> = {
  neutral: 'bg-zinc-800 text-zinc-200 border-transparent',
  green: 'bg-emerald-500/15 text-emerald-300 border-transparent',
  amber: 'bg-amber-500/15 text-amber-200 border-transparent',
  violet: 'bg-accent/20 text-accent-soft border-transparent',
  sky: 'bg-accent/15 text-accent-soft border-transparent',
  red: 'bg-red-500/15 text-red-300 border-transparent',
};

export const Badge: React.FC<{ tone?: Tone; className?: string; children: React.ReactNode }> = ({
  tone = 'neutral',
  className,
  children,
}) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[11px] font-medium tabular-nums whitespace-nowrap',
      TONES[tone],
      className,
    )}
  >
    {children}
  </span>
);
