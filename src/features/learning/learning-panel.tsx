import React, { useState } from 'react';
import { BEGINNER_STAGES, type LearningStage, type Algorithm } from './stages';
import { useCubeStore } from '@/shared/stores/cube-store';
import { parseAlgorithm } from '@/features/engine/moves';

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
          {isCompleted ? '✓' : stage.order}
        </span>
        <span className="font-medium text-sm">{stage.name}</span>
      </div>
    </button>
  );
};

interface AlgorithmCardProps {
  algorithm: Algorithm;
  onApply: (notation: string) => void;
}

const AlgorithmCard: React.FC<AlgorithmCardProps> = ({ algorithm, onApply }) => {
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
}

export const LearningPanel: React.FC<LearningPanelProps> = ({ completedStages }) => {
  const [selectedStage, setSelectedStage] = useState<LearningStage>(BEGINNER_STAGES[0]);
  const { applyAlgorithm } = useCubeStore();

  const handleApply = (notation: string) => {
    const moves = parseAlgorithm(notation);
    applyAlgorithm(moves);
  };

  const isStageLocked = (stage: LearningStage) => {
    if (!stage.prerequisite) return false;
    return !completedStages.has(stage.prerequisite);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div>
        <h2 className="text-sm font-semibold text-zinc-300 mb-3">Beginner Method</h2>
        <div className="space-y-2">
          {BEGINNER_STAGES.map((stage) => (
            <StageCard
              key={stage.id}
              stage={stage}
              isActive={selectedStage.id === stage.id}
              isCompleted={completedStages.has(stage.id)}
              isLocked={isStageLocked(stage)}
              onSelect={() => setSelectedStage(stage)}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-zinc-800 pt-4">
        <h3 className="text-sm font-semibold text-zinc-300 mb-2">{selectedStage.name}</h3>
        <p className="text-xs text-zinc-400 mb-3">{selectedStage.description}</p>

        <div className="p-3 bg-zinc-800/30 rounded-lg border border-zinc-700/50 mb-3">
          <p className="text-xs font-medium text-zinc-300 mb-1">Goal:</p>
          <p className="text-xs text-zinc-400">{selectedStage.goal}</p>
        </div>

        {selectedStage.algorithms.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-300">Algorithms:</p>
            {selectedStage.algorithms.map((algo) => (
              <AlgorithmCard key={algo.id} algorithm={algo} onApply={handleApply} />
            ))}
          </div>
        )}

        {selectedStage.algorithms.length === 0 && (
          <p className="text-xs text-zinc-500 italic">
            This stage is intuitive — no algorithms needed. Practice finding and inserting the pieces by eye.
          </p>
        )}
      </div>
    </div>
  );
};
