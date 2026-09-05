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
      className={`w-full text-left p-3 rounded-xl border backdrop-blur-sm transition-all ${
        isActive
          ? 'border-sky-400/60 bg-gradient-to-r from-sky-500/20 to-violet-500/15 shadow-[0_0_20px_rgba(56,189,248,0.25)]'
          : isCompleted
            ? 'border-emerald-400/30 bg-emerald-400/5'
            : isLocked
              ? 'border-white/5 bg-black/20 opacity-50 cursor-not-allowed'
              : 'border-white/10 bg-black/20 hover:border-white/25 hover:bg-black/10'
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md ${
            isCompleted
              ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white'
              : isActive
                ? 'bg-gradient-to-br from-sky-400 to-violet-500 text-white'
                : 'bg-black/40 text-zinc-300 border border-white/10'
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
      className={`p-4 rounded-xl border backdrop-blur-sm transition-all ${
        isPracticing
          ? 'border-fuchsia-400/50 bg-gradient-to-br from-fuchsia-500/10 to-violet-500/5 shadow-[0_0_24px_rgba(217,70,239,0.25)]'
          : 'border-white/10 bg-black/20'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <code className="text-sm font-mono bg-black/40 px-2 py-1 rounded text-amber-300 border border-white/10">
          {algorithm.notation}
        </code>
        <div className="flex gap-2">
          <button
            onClick={() => onPractice(algorithm.notation)}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
              isPracticing
                ? 'bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white shadow-[0_0_14px_rgba(217,70,239,0.5)]'
                : 'border border-fuchsia-400/40 text-fuchsia-300 hover:bg-fuchsia-500/15'
            }`}
          >
            {isPracticing ? 'Practicing' : 'Practice'}
          </button>
          <button
            onClick={() => onApply(algorithm.notation)}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-110 text-white shadow-[0_0_14px_rgba(56,189,248,0.35)] transition-all"
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
                className="text-xs px-1.5 py-0.5 font-mono bg-black/40 hover:bg-sky-500/30 border border-white/10 rounded transition-colors"
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
    <div className="rounded-xl border border-fuchsia-400/40 bg-gradient-to-br from-fuchsia-500/15 via-violet-500/10 to-sky-500/10 backdrop-blur-md p-4 shadow-[0_0_30px_rgba(217,70,239,0.25)]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-fuchsia-300">
          Practice
        </p>
        <button
          onClick={onExit}
          className="text-[10px] px-2 py-1 rounded-md border border-white/10 bg-black/30 text-zinc-300 hover:text-white transition-colors"
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
                  ? 'bg-fuchsia-500/40 text-white'
                  : i === stepIndex
                    ? 'bg-white text-black'
                    : 'bg-black/30 text-zinc-400'
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
          className="py-2 rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-500 disabled:opacity-40 text-white text-xs font-semibold shadow-[0_0_16px_rgba(217,70,239,0.4)] hover:brightness-110 transition-all"
        >
          {done ? 'Done' : 'Step'}
        </button>
        <button
          onClick={onApplyAll}
          className="py-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-semibold shadow-[0_0_16px_rgba(56,189,248,0.4)] hover:brightness-110 transition-all"
        >
          Apply all
        </button>
        <button
          onClick={onReset}
          className="py-2 rounded-lg bg-black/30 border border-white/10 text-white text-xs font-semibold hover:bg-black/20 transition-colors"
        >
          Reset start
        </button>
      </div>
      <p className="text-[10px] text-zinc-400 mt-2 text-center">
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
        <div className="flex gap-1 bg-black/30 backdrop-blur-md p-1 rounded-xl border border-white/10 mb-3">
          <button
            onClick={() => switchMethod('beginner')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              method === 'beginner'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-[0_0_14px_rgba(56,189,248,0.4)]'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            Beginner
          </button>
          <button
            onClick={() => switchMethod('cfop')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              method === 'cfop'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-[0_0_14px_rgba(56,189,248,0.4)]'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            CFOP
          </button>
        </div>

        {completedStages.size > 0 && (
          <button
            onClick={onResetProgress}
            className="w-full mb-3 py-1 px-3 text-[10px] bg-black/30 hover:bg-black/20 rounded-lg border border-white/10 text-zinc-400 hover:text-zinc-200 transition-colors"
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

      <div className="border-t border-white/10 pt-4">
        <h3 className="text-sm font-semibold text-zinc-100 mb-2">{activeStage.name}</h3>
        <p className="text-xs text-zinc-400 mb-3">{activeStage.description}</p>

        <div className="p-3 rounded-xl border border-white/10 bg-black/20 backdrop-blur-sm mb-3">
          <p className="text-xs font-medium text-zinc-200 mb-1">Goal:</p>
          <p className="text-xs text-zinc-400">{activeStage.goal}</p>
        </div>

        {suggestion.max > 0 && (
          <div className="p-3 rounded-xl border border-emerald-400/30 bg-emerald-400/5 backdrop-blur-sm mb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-emerald-300">Suggested move</p>
              <p className="text-[10px] text-zinc-400">
                Progress {suggestion.value}/{suggestion.max}
              </p>
            </div>
            <div className="h-1.5 rounded-full bg-black/40 overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  stageComplete
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-300'
                    : 'bg-gradient-to-r from-emerald-400 to-sky-400'
                }`}
                style={{ width: `${(suggestion.value / suggestion.max) * 100}%` }}
              />
            </div>
            {suggestion.value >= suggestion.max ? (
              <p className="text-xs text-emerald-300">Stage complete — move on to the next stage!</p>
            ) : suggestion.move ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <MoveButton move={suggestion.move} onClick={applyMove} size="md" />
                  <p className="text-xs text-zinc-300">{suggestion.rationale}</p>
                </div>
                {suggestion.moves.length > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 shrink-0">Best sequence:</span>
                    <div className="flex flex-wrap gap-1">
                      {suggestion.moves.map((move, i) => (
                        <button
                          key={i}
                          onClick={() => applyMove(move)}
                          className="text-xs px-1.5 py-0.5 font-mono bg-black/40 hover:bg-emerald-500/30 border border-white/10 rounded transition-colors"
                          title={`Apply ${move}`}
                        >
                          {move}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => applyAlgorithm(suggestion.moves)}
                      className="text-xs px-2 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 rounded-lg text-white font-semibold transition-all"
                    >
                      Apply all
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-zinc-300">
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

        <div className="rounded-xl border border-white/10 bg-black/20 backdrop-blur-md p-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-zinc-200">Free play</h4>
            <span className="text-[10px] text-zinc-500">turn the cube however you like</span>
          </div>
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => scramble()}
              className="flex-1 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-semibold shadow-[0_0_16px_rgba(56,189,248,0.35)] hover:brightness-110 transition-all"
            >
              Scramble
            </button>
            <button
              onClick={undo}
              className="flex-1 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-xs font-semibold hover:bg-black/20 transition-colors"
            >
              Undo
            </button>
            <button
              onClick={reset}
              className="flex-1 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-xs font-semibold hover:bg-black/20 transition-colors"
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