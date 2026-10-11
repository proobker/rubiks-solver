import React, { useMemo, useState } from 'react';
import { ArrowRight, Dumbbell, Lightbulb, Loader2, RotateCw, Shuffle } from 'lucide-react';
import type { MoveString } from '@/shared/types/cube';
import type { Piece } from '@/features/engine/pieces';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MoveChips } from '@/components/ui/move-chips';
import { COLORS } from './facelets';
import type { StageStatus } from './stage-goals';
import type { HintStep } from './suggestions';
import { getStageHint } from './suggestions';

interface CoachBarProps {
  stageId: string;
  stageName: string;
  status: StageStatus;
  pieces: Piece[];
  isAnimating: boolean;
  reorient: MoveString | null;
  preferredTop: number | null;
  canDrill: boolean;
  drilling: boolean;
  nextStageName: string | null;
  onApply: (moves: MoveString[]) => void;
  onSetup: () => void;
  onDrill: () => void;
  onNextStage: () => void;
}

const STEP_LABEL: Record<HintStep['kind'], string> = {
  rotate: 'Hold',
  auf: 'Set up',
  alg: 'Apply',
  moves: 'Turn',
};

export const CoachBar: React.FC<CoachBarProps> = ({
  stageId,
  stageName,
  status,
  pieces,
  isAnimating,
  reorient,
  preferredTop,
  canDrill,
  drilling,
  nextStageName,
  onApply,
  onSetup,
  onDrill,
  onNextStage,
}) => {
  const [hintOpen, setHintOpen] = useState(false);
  const hintAvailable = status.prereq && !status.complete;
  const showHint = hintOpen && hintAvailable && !drilling;

  const hint = useMemo(
    () => (showHint && !isAnimating ? getStageHint(stageId, pieces) : null),
    [showHint, isAnimating, stageId, pieces],
  );

  return (
    <div className="sticky top-0 z-10 -mx-4 px-4 pt-3 pb-3 bg-panel/95 backdrop-blur border-b border-white/[0.06] flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-white truncate">{stageName}</h2>
        {status.prereq ? (
          <Badge tone={status.complete ? 'green' : 'neutral'}>
            {status.progress}/{status.max}
          </Badge>
        ) : (
          <Badge tone="amber">earlier stages unsolved</Badge>
        )}
      </div>
      <Progress value={status.prereq ? status.progress : 0} max={status.max} />

      {status.complete && !drilling && (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-500/10 border border-emerald-400/25 px-3 py-2 animate-pop-in">
          <span className="text-xs font-semibold text-emerald-300">Stage solved on this cube! 🎉</span>
          {nextStageName && (
            <Button size="xs" accent="green" onClick={onNextStage}>
              {nextStageName} <ArrowRight size={12} />
            </Button>
          )}
        </div>
      )}

      {!status.prereq && !drilling && (
        <p className="text-xs text-zinc-400">
          This stage builds on the earlier ones, which aren't solved on the cube. Set up a practice position to start
          from the right point.
        </p>
      )}

      {reorient && preferredTop !== null && hintAvailable && !drilling && (
        <div className="flex items-center justify-between gap-2 text-xs rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-1.5">
          <span className="text-amber-200">Hold {COLORS[preferredTop]} on top for this stage.</span>
          <Button size="xs" accent="yellow" icon={<RotateCw size={12} />} onClick={() => onApply([reorient])}>
            {reorient}
          </Button>
        </div>
      )}

      {!drilling && (
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" icon={<Shuffle size={14} />} onClick={onSetup}>
            Set up
          </Button>
          <Button
            size="sm"
            variant={showHint ? 'primary' : 'soft'}
            accent="yellow"
            className="flex-1"
            icon={<Lightbulb size={14} />}
            onClick={() => setHintOpen((v) => !v)}
            disabled={!hintAvailable}
          >
            {showHint ? 'Hide hint' : 'Hint'}
          </Button>
          {canDrill && (
            <Button size="sm" accent="violet" className="flex-1" icon={<Dumbbell size={14} />} onClick={onDrill}>
              Drill
            </Button>
          )}
        </div>
      )}

      {showHint && (
        <div className="flex flex-col gap-2 rounded-xl bg-yellow-400/[0.06] border border-yellow-300/20 p-3 max-h-56 overflow-y-auto animate-float-up">
          {!hint ? (
            <p className="flex items-center gap-2 text-xs text-zinc-400">
              <Loader2 size={14} className="animate-spin" /> Thinking…
            </p>
          ) : (
            <>
              {hint.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="shrink-0 w-5 h-5 mt-0.5 rounded-full bg-yellow-400 text-zinc-950 text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <span className="text-[11px] font-semibold text-zinc-200">
                      {STEP_LABEL[step.kind]}
                      {step.kind === 'alg' && <span className="text-yellow-200"> · {step.label}</span>}
                    </span>
                    <MoveChips moves={step.moves} onMove={(m) => onApply([m])} tone="emerald" />
                  </div>
                  <Button size="xs" variant="secondary" onClick={() => onApply(step.moves)}>
                    Do it
                  </Button>
                </div>
              ))}
              <p className="text-xs text-zinc-400">{hint.explanation}</p>
              {hint.steps.length > 1 && (
                <Button size="xs" accent="yellow" className="self-start" onClick={() => onApply(hint.steps.flatMap((s) => s.moves))}>
                  Apply all steps
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
