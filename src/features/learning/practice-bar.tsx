import React from 'react';
import { FastForward, RotateCcw, StepForward, X } from 'lucide-react';
import type { MoveString } from '@/shared/types/cube';
import { Button } from '@/components/ui/button';
import { MoveChips } from '@/components/ui/move-chips';
import { Progress } from '@/components/ui/progress';

interface PracticeBarProps {
  name: string;
  notation: string;
  moves: MoveString[];
  stepIndex: number;
  onStep: () => void;
  onApplyAll: () => void;
  onReset: () => void;
  onExit: () => void;
}

export const PracticeBar: React.FC<PracticeBarProps> = ({
  name,
  notation,
  moves,
  stepIndex,
  onStep,
  onApplyAll,
  onReset,
  onExit,
}) => {
  const remaining = moves.length - stepIndex;
  const done = remaining <= 0;

  return (
    <div className="rounded-lg border border-accent/40 bg-accent/[0.07] p-4 flex flex-col gap-3 animate-pop-in">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-zinc-400">Practice</p>
          <p className="text-sm font-semibold text-zinc-50 truncate">{name}</p>
        </div>
        <Button size="icon-sm" variant="ghost" onClick={onExit} aria-label="Exit practice">
          <X size={16} />
        </Button>
      </div>
      <code className="block text-center font-mono text-base font-semibold text-zinc-50 bg-black/40 rounded-md px-3 py-2 tracking-wide border border-zinc-800">
        {notation}
      </code>
      {moves.length > 1 && (
        <>
          <MoveChips moves={moves} progressIndex={stepIndex} />
          <Progress value={stepIndex} max={moves.length} className="h-1.5" />
        </>
      )}
      <div className="grid grid-cols-3 gap-2">
        <Button size="sm" icon={<StepForward size={14} />} onClick={onStep} disabled={done}>
          {done ? 'Done' : 'Step'}
        </Button>
        <Button size="sm" variant="soft" icon={<FastForward size={14} />} onClick={onApplyAll} disabled={done}>
          Rest
        </Button>
        <Button size="sm" variant="secondary" icon={<RotateCcw size={14} />} onClick={onReset}>
          Again
        </Button>
      </div>
      <p className="text-[11px] text-zinc-400 text-center">
        {done
          ? 'Nice! Hit "Again" and try it from memory with the move buttons or keyboard.'
          : `${remaining} move${remaining === 1 ? '' : 's'} to go. The cube shows the case this algorithm solves.`}
      </p>
    </div>
  );
};
