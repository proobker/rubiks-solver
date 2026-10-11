import React from 'react';
import type { MoveString } from '@/shared/types/cube';
import { cn } from '@/lib/utils';

interface MoveChipsProps {
  moves: MoveString[];
  onMove?: (move: MoveString) => void;
  /** Moves before this index render as done, the move at it as current. */
  progressIndex?: number;
  tone?: 'sky' | 'emerald';
}

export const MoveChips: React.FC<MoveChipsProps> = ({ moves, onMove, progressIndex, tone = 'sky' }) => (
  <div className="flex flex-wrap gap-1">
    {moves.map((move, i) => {
      const state =
        progressIndex === undefined ? 'idle' : i < progressIndex ? 'done' : i === progressIndex ? 'current' : 'todo';
      return (
        <button
          key={i}
          type="button"
          onClick={() => onMove?.(move)}
          disabled={!onMove}
          title={onMove ? `Apply ${move}` : undefined}
          className={cn(
            'text-xs px-1.5 py-0.5 font-mono rounded border transition-colors disabled:cursor-default',
            state === 'idle' && 'bg-white/[0.04] border-white/10',
            state === 'idle' && onMove && (tone === 'sky' ? 'hover:bg-sky-500/20' : 'hover:bg-emerald-500/20'),
            state === 'done' && 'bg-sky-600/60 border-transparent text-white',
            state === 'current' && 'bg-white border-transparent text-black',
            state === 'todo' && 'bg-white/[0.05] border-transparent text-zinc-500',
          )}
        >
          {move}
        </button>
      );
    })}
  </div>
);
