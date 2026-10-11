import React, { useState } from 'react';
import { Check, Lock, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { isStageLocked, type LearningStage } from './stages';

interface StageStepperProps {
  stages: LearningStage[];
  activeId: string;
  completedStages: Set<string>;
  onSelect: (stage: LearningStage) => void;
  onResetProgress?: () => void;
}

export const StageStepper: React.FC<StageStepperProps> = ({
  stages,
  activeId,
  completedStages,
  onSelect,
  onResetProgress,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);
  const doneCount = stages.filter((s) => completedStages.has(s.id)).length;

  return (
    <div className="flex flex-col gap-3">
      <ol className="flex items-center">
        {stages.map((stage, i) => {
          const done = completedStages.has(stage.id);
          const active = stage.id === activeId;
          const locked = isStageLocked(stage, completedStages);
          return (
            <li key={stage.id} className={cn('flex items-center', i < stages.length - 1 && 'flex-1')}>
              <button
                type="button"
                onClick={() => onSelect(stage)}
                disabled={locked}
                title={locked ? `${stage.name} — complete the previous stage to unlock` : stage.name}
                aria-label={`Stage ${i + 1}: ${stage.name}${done ? ' (complete)' : locked ? ' (locked)' : ''}`}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'relative shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200',
                  done && 'bg-emerald-500 text-white',
                  !done && active && 'bg-white text-zinc-900',
                  !done && !active && !locked && 'bg-white/[0.08] text-zinc-300 hover:bg-white/15 border border-white/10',
                  locked && 'bg-white/[0.03] text-zinc-600 border border-white/[0.06] cursor-not-allowed',
                  active && 'ring-2 ring-offset-2 ring-offset-panel ring-emerald-400 scale-110',
                )}
              >
                {done ? <Check size={15} strokeWidth={3} /> : locked ? <Lock size={12} /> : i + 1}
              </button>
              {i < stages.length - 1 && (
                <span
                  className={cn(
                    'flex-1 h-0.5 mx-1 rounded-full',
                    done ? 'bg-emerald-500/70' : 'bg-white/10',
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
      <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-500">
        <span>
          <span className="text-zinc-200 font-semibold">{doneCount}</span> / {stages.length} stages complete
        </span>
        {onResetProgress &&
          (confirmReset ? (
            <span className="flex items-center gap-1 animate-pop-in">
              <Button
                size="xs"
                accent="red"
                onClick={() => {
                  onResetProgress();
                  setConfirmReset(false);
                }}
              >
                Reset all
              </Button>
              <Button size="xs" variant="ghost" onClick={() => setConfirmReset(false)}>
                Cancel
              </Button>
            </span>
          ) : (
            <Button size="xs" variant="ghost" icon={<RotateCcw size={12} />} onClick={() => setConfirmReset(true)}>
              Reset progress
            </Button>
          ))}
      </div>
    </div>
  );
};
