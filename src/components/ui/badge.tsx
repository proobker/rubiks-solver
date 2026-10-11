import React from 'react';
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'green' | 'amber' | 'violet' | 'sky' | 'red';

const TONES: Record<Tone, string> = {
  neutral: 'bg-white/[0.07] text-zinc-300 border-white/10',
  green: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/25',
  amber: 'bg-amber-500/15 text-amber-200 border-amber-400/25',
  violet: 'bg-violet-500/15 text-violet-300 border-violet-400/25',
  sky: 'bg-sky-500/15 text-sky-300 border-sky-400/25',
  red: 'bg-red-500/15 text-red-300 border-red-400/25',
};

export const Badge: React.FC<{ tone?: Tone; className?: string; children: React.ReactNode }> = ({
  tone = 'neutral',
  className,
  children,
}) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold tabular-nums whitespace-nowrap',
      TONES[tone],
      className,
    )}
  >
    {children}
  </span>
);
