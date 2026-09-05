import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BEGINNER_STAGES, CFOP_STAGES, type LearningStage, type Algorithm } from './stages';
import { useCubeStore } from '@/shared/stores/cube-store';
import { parseAlgorithm } from '@/features/engine/moves';
import { getStageProgress } from './suggestions';
import { MoveButton, MovePanel } from '@/components/ui/move-button';
import type { MoveString } from '@/shared/types/cube';

interface StageCardProps {
  stage: LearningStage;
  isActive: boolean;
  isCompleted: boolean;
  isLocked: boolean;
  onSelect: () => void;
}

const StageCard: React.FC<StageCardProps> = ({ stage, isActive, isCompleted, isLocked, onSelect }) => {
  return (
    <button
      onClick={onSelect}
      disabled={isLocked}
      className={`w-full text-left p-3 rounded-lg border transition-colors ${
        isActive
          ? 'border-sky-400/50 bg-sky-500/10'
          : isCompleted
            ? 'border-emerald-400/30 bg-emerald-400/5'
            : isLocked
              ? 'border-white/[0.06] bg-white/[0.02] opacity-50 cursor-not-allowed'
              : 'border-white/[0.08] bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]'
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            isCompleted
              ? 'bg-emerald-500 text-white'
              : isActive
                ? 'bg-sky-500 text-white'
                : 'bg-white/[0.06] border border-white/10 text-zinc-400'
          }`}
        >
          {isCompleted ? '✓' : stage.order - (stage.method === 'beginner' ? 0 : 7)}
        </span>
        <span className="font-medium text-sm">{stage.name}</span>
      </div>
    </button>
  );
};

interface AlgorithmCardProps {
  algorithm: Algorithm;
  isPracticing: boolean;
  onApply: (notation: string) => void;
  onStepMove: (move: MoveString) => void;
  onPractice: (notation: string) => void;
}

const AlgorithmCard: React.FC<AlgorithmCardProps> = ({
  algorithm,
  isPracticing,
  onApply,
  onStepMove,
  onPractice,
}) => {
  const moves = useMemo(() => parseAlgorithm(algorithm.notation), [algorithm.notation]);

  return (
    <div
      className={`p-4 rounded-lg border transition-colors ${
        isPracticing
          ? 'border-sky-400/50 bg-sky-500/10'
          : 'border-white/[0.08] bg-white/[0.04]'
      }`}
    >
      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
        <code className="text-sm font-mono bg-black/40 px-2 py-1 rounded text-amber-300 border border-white/10">
          {algorithm.notation}
        </code>
        <div className="flex gap-2">
          <button
            onClick={() => onPractice(algorithm.notation)}
            className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
              isPracticing
                ? 'bg-sky-600 text-white hover:bg-sky-500'
                : 'border border-sky-500/40 text-sky-400 hover:bg-sky-500/15'
            }`}
          >
            {isPracticing ? 'Practicing' : 'Practice'}
          </button>
          <button
            onClick={() => onApply(algorithm.notation)}
            className="text-xs px-3 py-1.5 rounded-md font-medium bg-sky-600 hover:bg-sky-500 text-white transition-colors"
          >
            Apply
          </button>
        </div>
      </div>

      {moves.length > 1 && (
        <div className="mb-2">
          <p className="text-xs text-zinc-500 mb-1">Step through one move at a time:</p>
          <div className="flex flex-wrap gap-1">
            {moves.map((move, i) => (
              <button
                key={i}
                onClick={() => onStepMove(move)}
                className="text-xs px-1.5 py-0.5 font-mono bg-white/[0.04] hover:bg-sky-500/20 border border-white/10 rounded transition-colors"
                title={`Apply ${move}`}
              >
                {move}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-zinc-400">{algorithm.description}</p>

      {algorithm.cases && algorithm.cases.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium text-zinc-300">Cases:</p>
          {algorithm.cases.map((c) => (
            <div key={c.id} className="flex items-start gap-2 text-xs">
              <span className="text-zinc-500 shrink-0">{c.pattern}</span>
              <div>
                <span className="text-zinc-300">{c.name}: </span>
                <span className="text-zinc-400">{c.description}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface PracticeBarProps {
  notation: string;
  moves: MoveString[];
  stepIndex: number;
  onStep: () => void;
  onApplyAll: () => void;
  onReset: () => void;
  onExit: () => void;
}

const PracticeBar: React.FC<PracticeBarProps> = ({
  notation,
  moves,
  stepIndex,
  onStep,
  onApplyAll,
  onReset,
  onExit,
}) => {
  const remaining = moves.length - stepIndex;
  const done = stepIndex > 0 && remaining <= 0;

  return (
    <div className="rounded-lg border border-sky-400/40 bg-sky-500/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-sky-400">
          Practice
        </p>
        <button
          onClick={onExit}
          className="text-[10px] px-2 py-1 rounded-md border border-white/10 bg-white/[0.04] text-zinc-400 hover:text-white transition-colors"
        >
          Exit
        </button>
      </div>
      <code className="block text-center font-mono text-lg text-white bg-black/40 rounded-lg px-3 py-2 mb-3 tracking-wide border border-white/10">
        {notation}
      </code>
      {moves.length > 1 && (
        <div className="flex flex-wrap justify-center gap-1 mb-3">
          {moves.map((m, i) => (
            <span
              key={i}
              className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${
                i < stepIndex
                  ? 'bg-sky-600/60 text-white'
                  : i === stepIndex
                    ? 'bg-white text-black'
                    : 'bg-white/[0.05] text-zinc-500'
              }`}
            >
              {m}
            </span>
          ))}
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={onStep}
          disabled={done}
          className="py-2 rounded-md bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:hover:bg-sky-600 text-white text-xs font-medium transition-colors"
        >
          {done ? 'Done' : 'Step'}
        </button>
        <button
          onClick={onApplyAll}
          className="py-2 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition-colors"
        >
          Apply all
        </button>
        <button
          onClick={onReset}
          className="py-2 rounded-md bg-white/[0.06] hover:bg-white/10 border border-white/10 text-white text-xs font-medium transition-colors"
        >
          Reset start
        </button>
      </div>
      <p className="text-[10px] text-zinc-500 mt-2 text-center">
        {done
          ? 'Done — hit "Reset start" to repeat until it is muscle memory.'
          : `${remaining} move${remaining === 1 ? '' : 's'} left. Step through or apply the whole algorithm, then reset to try again.`}
      </p>
    </div>
  );
};

interface LearningPanelProps {
  completedStages: Set<string>;
  onStageComplete: (stageId: string) => void;
  onStageSelect?: (stageId: string) => void;
  onResetProgress: () => void;
}

type MethodTab = 'beginner' | 'cfop';

export const LearningPanel: React.FC<LearningPanelProps> = ({
  completedStages,
  onStageComplete,
  onStageSelect,
  onResetProgress,
}) => {
  const [method, setMethod] = useState<MethodTab>('beginner');
  const [selectedStage, setSelectedStage] = useState<LearningStage>(BEGINNER_STAGES[0]);
  const [practiceNotation, setPracticeNotation] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const practiceRef = useRef<HTMLDivElement | null>(null);
  const {
    applyAlgorithm,
    applyMove,
    scramble,
    undo,
    reset,
    startPractice,
    clearPractice,
    resetToPracticeStart,
    pieces,
  } = useCubeStore();

  const stages = method === 'beginner' ? BEGINNER_STAGES : CFOP_STAGES;

  const practiceMoves = useMemo<MoveString[]>(
    () => (practiceNotation ? parseAlgorithm(practiceNotation) : []),
    [practiceNotation],
  );

  const handleApply = (notation: string) => {
    const moves = parseAlgorithm(notation);
    applyAlgorithm(moves);
    if (notation === practiceNotation) setStepIndex(moves.length);
  };

  const handleStepMove = (move: MoveString) => {
    applyMove(move);
    if (practiceNotation && practiceMoves[stepIndex] === move) setStepIndex(stepIndex + 1);
  };

  const handleStartPractice = (notation: string) => {
    startPractice();
    setPracticeNotation(notation);
    setStepIndex(0);
    practiceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleExitPractice = () => {
    clearPractice();
    setPracticeNotation(null);
    setStepIndex(0);
  };

  const handlePracticeStep = () => {
    if (stepIndex >= practiceMoves.length) return;
    applyMove(practiceMoves[stepIndex]);
    setStepIndex(stepIndex + 1);
  };

  const handlePracticeApplyAll = () => {
    applyAlgorithm(practiceMoves);
    setStepIndex(practiceMoves.length);
  };

  const handlePracticeReset = () => {
    resetToPracticeStart();
    setStepIndex(0);
  };

  const isStageLocked = (stage: LearningStage) => {
    if (!stage.prerequisite) return false;
    return !completedStages.has(stage.prerequisite);
  };

  const defaultStage = stages[0];
  const activeStage = stages.find((s) => s.id === selectedStage.id) ?? defaultStage;

  const suggestion = useMemo(
    () => getStageProgress(activeStage.id, pieces),
    [activeStage, pieces],
  );

  const stageComplete = suggestion.max > 0 && suggestion.value >= suggestion.max;
  useEffect(() => {
    if (stageComplete && !completedStages.has(activeStage.id)) {
      onStageComplete(activeStage.id);
    }
  }, [stageComplete, activeStage, completedStages, onStageComplete]);

  const selectStage = (stage: LearningStage) => {
    setSelectedStage(stage);
    onStageSelect?.(stage.id);
  };

  const switchMethod = (m: MethodTab) => {
    setMethod(m);
    const first = m === 'beginner' ? BEGINNER_STAGES[0] : CFOP_STAGES[0];
    setSelectedStage(first);
    onStageSelect?.(first.id);
    handleExitPractice();
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div>
        <div className="flex gap-0.5 bg-white/[0.04] border border-white/[0.06] p-0.5 rounded-lg mb-3">
          <button
            onClick={() => switchMethod('beginner')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              method === 'beginner'
                ? 'bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                : 'text-zinc-500 hover:text-zinc-200'
            }`}
          >
            Beginner
          </button>
          <button
            onClick={() => switchMethod('cfop')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              method === 'cfop'
                ? 'bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                : 'text-zinc-500 hover:text-zinc-200'
            }`}
          >
            CFOP
          </button>
        </div>

        {completedStages.size > 0 && (
          <button
            onClick={onResetProgress}
            className="w-full mb-3 py-1 px-3 text-[10px] bg-white/[0.04] hover:bg-white/10 rounded-md border border-white/[0.08] text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Reset progress
          </button>
        )}

        <div className="space-y-2">
          {stages.map((stage) => (
            <StageCard
              key={stage.id}
              stage={stage}
              isActive={activeStage.id === stage.id}
              isCompleted={completedStages.has(stage.id)}
              isLocked={isStageLocked(stage)}
              onSelect={() => selectStage(stage)}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-white/[0.06] pt-4">
        <h3 className="text-sm font-semibold text-zinc-100 mb-2">{activeStage.name}</h3>
        <p className="text-xs text-zinc-400 mb-3">{activeStage.description}</p>

        <div className="p-3 rounded-lg border border-white/[0.08] bg-white/[0.03] mb-3">
          <p className="text-xs font-medium text-zinc-200 mb-1">Goal:</p>
          <p className="text-xs text-zinc-400">{activeStage.goal}</p>
        </div>

        {suggestion.max > 0 && (
          <div className="p-3 rounded-lg border border-emerald-400/20 bg-emerald-500/5 mb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-emerald-400">Suggested move</p>
              <p className="text-[10px] text-zinc-500">
                Progress {suggestion.value}/{suggestion.max}
              </p>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-3">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${(suggestion.value / suggestion.max) * 100}%` }}
              />
            </div>
            {suggestion.value >= suggestion.max ? (
              <p className="text-xs text-emerald-400">Stage complete — move on to the next stage!</p>
            ) : suggestion.move ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <MoveButton move={suggestion.move} onClick={applyMove} size="md" />
                  <p className="text-xs text-zinc-400">{suggestion.rationale}</p>
                </div>
                {suggestion.moves.length > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 shrink-0">Best sequence:</span>
                    <div className="flex flex-wrap gap-1">
                      {suggestion.moves.map((move, i) => (
                        <button
                          key={i}
                          onClick={() => applyMove(move)}
                          className="text-xs px-1.5 py-0.5 font-mono bg-white/[0.04] hover:bg-emerald-500/20 border border-white/10 rounded transition-colors"
                          title={`Apply ${move}`}
                        >
                          {move}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => applyAlgorithm(suggestion.moves)}
                      className="text-xs px-2 py-1 bg-emerald-600 hover:bg-emerald-500 rounded-md text-white font-medium transition-colors"
                    >
                      Apply all
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-zinc-400">
                No single move makes progress right now — try a setup move or look for a different white/yellow piece.
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium text-zinc-300">Algorithms:</p>

          <div ref={practiceRef}>
            {practiceNotation && (
              <PracticeBar
                notation={practiceNotation}
                moves={practiceMoves}
                stepIndex={stepIndex}
                onStep={handlePracticeStep}
                onApplyAll={handlePracticeApplyAll}
                onReset={handlePracticeReset}
                onExit={handleExitPractice}
              />
            )}
          </div>

          {activeStage.algorithms.length > 0 ? (
            activeStage.algorithms.map((algo) => (
              <AlgorithmCard
                key={algo.id}
                algorithm={algo}
                isPracticing={practiceNotation === algo.notation}
                onApply={handleApply}
                onStepMove={handleStepMove}
                onPractice={handleStartPractice}
              />
            ))
          ) : (
            <p className="text-xs text-zinc-500 italic">
              This stage is intuitive — no algorithms needed. Practice finding and inserting the pieces by eye.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-zinc-200">Free play</h4>
            <span className="text-[10px] text-zinc-500">turn the cube however you like</span>
          </div>
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => scramble()}
              className="flex-1 py-2 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition-colors"
            >
              Scramble
            </button>
            <button
              onClick={undo}
              className="flex-1 py-2 rounded-md bg-white/[0.06] hover:bg-white/10 border border-white/10 text-white text-xs font-medium transition-colors"
            >
              Undo
            </button>
            <button
              onClick={reset}
              className="flex-1 py-2 rounded-md bg-white/[0.06] hover:bg-white/10 border border-white/10 text-white text-xs font-medium transition-colors"
            >
              Reset
            </button>
          </div>
          <MovePanel onMove={applyMove} />
        </div>
      </div>
    </div>
  );
};