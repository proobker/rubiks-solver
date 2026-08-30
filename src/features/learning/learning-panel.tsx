import React, { useState, useMemo } from 'react';
import { BEGINNER_STAGES, CFOP_STAGES, type LearningStage, type Algorithm } from './stages';
import { useCubeStore } from '@/shared/stores/cube-store';
import { parseAlgorithm } from '@/features/engine/moves';
import { getStageProgress } from './suggestions';
import { MoveButton } from '@/components/ui/move-button';
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
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        isActive
          ? 'border-blue-500 bg-blue-500/10'
          : isCompleted
            ? 'border-green-500/30 bg-green-500/5'
            : isLocked
              ? 'border-zinc-700 bg-zinc-800/50 opacity-50 cursor-not-allowed'
              : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
          isCompleted
            ? 'bg-green-500 text-white'
            : isActive
              ? 'bg-blue-500 text-white'
              : 'bg-zinc-700 text-zinc-300'
        }`}>
          {isCompleted ? '✓' : stage.order - (stage.method === 'beginner' ? 0 : 7)}
        </span>
        <span className="font-medium text-sm">{stage.name}</span>
      </div>
    </button>
  );
};

interface AlgorithmCardProps {
  algorithm: Algorithm;
  onApply: (notation: string) => void;
  onStepMove: (move: MoveString) => void;
}

const AlgorithmCard: React.FC<AlgorithmCardProps> = ({ algorithm, onApply, onStepMove }) => {
  const moves = useMemo(() => parseAlgorithm(algorithm.notation), [algorithm.notation]);

  return (
    <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
      <div className="flex items-center justify-between mb-2">
        <code className="text-sm font-mono bg-zinc-900 px-2 py-1 rounded text-yellow-300">
          {algorithm.notation}
        </code>
        <button
          onClick={() => onApply(algorithm.notation)}
          className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded transition-colors"
        >
          Apply
        </button>
      </div>

      {moves.length > 1 && (
        <div className="mb-2">
          <p className="text-xs text-zinc-500 mb-1">Step through one move at a time:</p>
          <div className="flex flex-wrap gap-1">
            {moves.map((move, i) => (
              <button
                key={i}
                onClick={() => onStepMove(move)}
                className="text-xs px-1.5 py-0.5 font-mono bg-zinc-700 hover:bg-zinc-600 rounded transition-colors"
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

interface LearningPanelProps {
  completedStages: Set<string>;
  onStageComplete: (stageId: string) => void;
  onStageSelect?: (stageId: string) => void;
}

type MethodTab = 'beginner' | 'cfop';

export const LearningPanel: React.FC<LearningPanelProps> = ({ completedStages, onStageSelect }) => {
  const [method, setMethod] = useState<MethodTab>('beginner');
  const [selectedStage, setSelectedStage] = useState<LearningStage>(BEGINNER_STAGES[0]);
  const { applyAlgorithm, applyMove, pieces } = useCubeStore();

  const stages = method === 'beginner' ? BEGINNER_STAGES : CFOP_STAGES;

  const handleApply = (notation: string) => {
    const moves = parseAlgorithm(notation);
    applyAlgorithm(moves);
  };

  const handleStepMove = (move: MoveString) => {
    applyMove(move);
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

  const selectStage = (stage: LearningStage) => {
    setSelectedStage(stage);
    onStageSelect?.(stage.id);
  };

  const switchMethod = (m: MethodTab) => {
    setMethod(m);
    const first = m === 'beginner' ? BEGINNER_STAGES[0] : CFOP_STAGES[0];
    setSelectedStage(first);
    onStageSelect?.(first.id);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div>
        <div className="flex gap-1 bg-zinc-800/50 p-1 rounded-lg mb-3">
          <button
            onClick={() => switchMethod('beginner')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              method === 'beginner'
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Beginner
          </button>
          <button
            onClick={() => switchMethod('cfop')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              method === 'cfop'
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            CFOP
          </button>
        </div>

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

      <div className="border-t border-zinc-800 pt-4">
        <h3 className="text-sm font-semibold text-zinc-300 mb-2">{activeStage.name}</h3>
        <p className="text-xs text-zinc-400 mb-3">{activeStage.description}</p>

        <div className="p-3 bg-zinc-800/30 rounded-lg border border-zinc-700/50 mb-3">
          <p className="text-xs font-medium text-zinc-300 mb-1">Goal:</p>
          <p className="text-xs text-zinc-400">{activeStage.goal}</p>
        </div>

        {suggestion.max > 0 && (
          <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30 mb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-green-300">Suggested move</p>
              <p className="text-[10px] text-zinc-400">
                Progress {suggestion.value}/{suggestion.max}
              </p>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-700/60 overflow-hidden mb-3">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-300"
                style={{ width: `${(suggestion.value / suggestion.max) * 100}%` }}
              />
            </div>
            {suggestion.value >= suggestion.max ? (
              <p className="text-xs text-green-300">Stage complete — move on to the next stage!</p>
            ) : suggestion.move ? (
              <div className="flex items-center gap-3">
                <MoveButton move={suggestion.move} onClick={applyMove} size="md" />
                <p className="text-xs text-zinc-300">{suggestion.rationale}</p>
              </div>
            ) : (
              <p className="text-xs text-zinc-300">
                No single move makes progress right now — try a setup move or look for a different white/yellow piece.
              </p>
            )}
          </div>
        )}

        {activeStage.algorithms.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-300">Algorithms:</p>
            {activeStage.algorithms.map((algo) => (
              <AlgorithmCard key={algo.id} algorithm={algo} onApply={handleApply} onStepMove={handleStepMove} />
            ))}
          </div>
        )}

        {activeStage.algorithms.length === 0 && (
          <p className="text-xs text-zinc-500 italic">
            This stage is intuitive — no algorithms needed. Practice finding and inserting the pieces by eye.
          </p>
        )}
      </div>
    </div>
  );
};
