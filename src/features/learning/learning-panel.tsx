import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { MoveString } from '@/shared/types/cube';
import { invertAlgorithm } from '@/features/engine/moves';
import { useCubeStore } from '@/shared/stores/cube-store';
import { BookOpen, Box, RotateCcw, Shuffle, Sigma, Undo2 } from 'lucide-react';
import { MovePanel } from '@/components/ui/move-button';
import { Button } from '@/components/ui/button';
import { Section } from '@/components/ui/section';
import { Segmented } from '@/components/ui/segmented';
import {
  BEGINNER_STAGES,
  CFOP_STAGES,
  diagramModeFor,
  isStageLocked,
  stageItems,
  type DrillItem,
  type LearningStage,
} from './stages';
import { STAGE_GOALS, generateStageSetup, stageStatus } from './stage-goals';
import { piecesToFacelets } from './facelets';
import { reorientMove } from './suggestions';
import { useCaseStats } from './case-stats';
import { StageStepper } from './stage-stepper';
import { AlgorithmCard } from './algorithm-card';
import { PracticeBar } from './practice-bar';
import { CoachBar } from './hint-card';
import { DrillPanel } from './drill-panel';
import type { DrillRound } from './drill';
import { startDrillRound } from './drill';

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
  const [practice, setPractice] = useState<DrillItem | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [drillRound, setDrillRound] = useState<DrillRound | null>(null);
  const drilling = drillRound !== null;
  const practiceRef = useRef<HTMLDivElement | null>(null);
  const sawIncompleteRef = useRef(false);
  const { stats, record, clear: clearStats } = useCaseStats();
  const {
    applyAlgorithm,
    applyMove,
    scramble,
    undo,
    reset,
    loadPosition,
    startPractice,
    clearPractice,
    resetToPracticeStart,
    pieces,
    isAnimating,
  } = useCubeStore();
  const historyLength = useCubeStore((s) => s.history.length);

  const stages = method === 'beginner' ? BEGINNER_STAGES : CFOP_STAGES;
  const activeStage = stages.find((s) => s.id === selectedStage.id) ?? stages[0];
  const goal = STAGE_GOALS[activeStage.id];
  const items = useMemo(() => stageItems(activeStage), [activeStage]);
  const diagramMode = diagramModeFor(activeStage.id);

  const facelets = useMemo(() => piecesToFacelets(pieces), [pieces]);
  const status = useMemo(() => stageStatus(activeStage.id, facelets), [activeStage.id, facelets]);
  const reorient = goal?.preferredTop != null ? reorientMove(facelets, goal.preferredTop) : null;

  useEffect(() => {
    onStageSelect?.(activeStage.id);
  }, [activeStage.id, onStageSelect]);

  useEffect(() => {
    sawIncompleteRef.current = false;
  }, [activeStage.id]);

  useEffect(() => {
    if (!status.complete) {
      sawIncompleteRef.current = true;
      return;
    }
    if (sawIncompleteRef.current && historyLength > 0 && !completedStages.has(activeStage.id)) {
      onStageComplete(activeStage.id);
    }
  }, [status.complete, historyLength, activeStage.id, completedStages, onStageComplete]);

  const handleApply = (moves: MoveString[]) => applyAlgorithm(moves);

  const handleStepMove = (move: MoveString) => {
    applyMove(move);
    if (practice && practice.moves[stepIndex] === move) setStepIndex(stepIndex + 1);
  };

  const handleStartPractice = (item: DrillItem) => {
    setDrillRound(null);
    loadPosition(['z2', ...invertAlgorithm(item.moves)]);
    startPractice();
    setPractice(item);
    setStepIndex(0);
    practiceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleExitPractice = () => {
    clearPractice();
    setPractice(null);
    setStepIndex(0);
  };

  const handlePracticeStep = () => {
    if (!practice || stepIndex >= practice.moves.length) return;
    applyMove(practice.moves[stepIndex]);
    setStepIndex(stepIndex + 1);
  };

  const handlePracticeApplyRest = () => {
    if (!practice) return;
    applyAlgorithm(practice.moves.slice(stepIndex));
    setStepIndex(practice.moves.length);
  };

  const handlePracticeReset = () => {
    resetToPracticeStart();
    setStepIndex(0);
  };

  const handleSetup = () => {
    handleExitPractice();
    setDrillRound(null);
    loadPosition(generateStageSetup(activeStage.id));
    startPractice();
  };

  const handleStartDrill = () => {
    handleExitPractice();
    setDrillRound(startDrillRound(items, stats));
  };

  const handleExitDrill = () => {
    setDrillRound(null);
    clearPractice();
  };

  const selectStage = (stage: LearningStage) => {
    setSelectedStage(stage);
    handleExitPractice();
    setDrillRound(null);
  };

  const switchMethod = (m: MethodTab) => {
    setMethod(m);
    selectStage(m === 'beginner' ? BEGINNER_STAGES[0] : CFOP_STAGES[0]);
  };

  const handleResetProgress = () => {
    onResetProgress();
    clearStats();
  };

  const canDrill = !!activeStage.drill && items.length >= 2;
  const stageIndex = stages.findIndex((st) => st.id === activeStage.id);
  const nextStage = stageIndex >= 0 && stageIndex < stages.length - 1 ? stages[stageIndex + 1] : null;
  const nextStageAvailable = nextStage && !isStageLocked(nextStage, completedStages) ? nextStage : null;

  return (
    <div className="flex flex-col gap-4">
      <Segmented
        size="sm"
        options={[
          { value: 'beginner', label: 'Beginner method' },
          { value: 'cfop', label: 'CFOP (speed)' },
        ]}
        value={method}
        onChange={switchMethod}
        ariaLabel="Method"
      />

      <StageStepper
        stages={stages}
        activeId={activeStage.id}
        completedStages={completedStages}
        onSelect={selectStage}
        onResetProgress={completedStages.size > 0 || Object.keys(stats).length > 0 ? handleResetProgress : undefined}
      />

      {goal && (
        <CoachBar
          stageId={activeStage.id}
          stageName={`${stageIndex + 1}. ${activeStage.name}`}
          status={status}
          pieces={pieces}
          isAnimating={isAnimating}
          reorient={reorient}
          preferredTop={goal.preferredTop}
          canDrill={canDrill}
          drilling={drilling}
          nextStageName={nextStageAvailable?.name ?? null}
          onApply={handleApply}
          onSetup={handleSetup}
          onDrill={handleStartDrill}
          onNextStage={() => nextStageAvailable && selectStage(nextStageAvailable)}
        />
      )}

      <div ref={practiceRef} className="scroll-mt-40">
        {drillRound && (
          <DrillPanel
            key={activeStage.id}
            initialRound={drillRound}
            stageId={activeStage.id}
            stageName={activeStage.name}
            items={items}
            diagramMode={diagramMode}
            stats={stats}
            onRecord={record}
            onExit={handleExitDrill}
          />
        )}
        {practice && !drilling && (
          <PracticeBar
            name={practice.name}
            notation={practice.notation}
            moves={practice.moves}
            stepIndex={stepIndex}
            onStep={handlePracticeStep}
            onApplyAll={handlePracticeApplyRest}
            onReset={handlePracticeReset}
            onExit={handleExitPractice}
          />
        )}
      </div>

      {!drilling && (
        <>
          <Section id="learn-about" title="About this stage" icon={<BookOpen size={14} />}>
            <div className="flex flex-col gap-3">
              <p className="text-sm text-zinc-300">{activeStage.description}</p>
              <div className="rounded-md border border-emerald-400/20 bg-emerald-500/[0.06] p-3">
                <p className="text-xs font-medium text-zinc-400 mb-1">Goal</p>
                <p className="text-xs text-zinc-300">{activeStage.goal}</p>
              </div>
              {activeStage.tips && activeStage.tips.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {activeStage.tips.map((tip, i) => (
                    <li key={tip} className="flex gap-2 text-xs text-zinc-400">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-white/[0.08] text-zinc-300 text-[10px] font-semibold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="pt-0.5">{tip}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Section>

          <Section id="learn-algorithms" title="Algorithms" icon={<Sigma size={14} />}>
            {activeStage.algorithms.length > 0 ? (
              <div className="flex flex-col gap-4">
                {activeStage.algorithms.map((algo) => (
                  <AlgorithmCard
                    key={algo.id}
                    algorithm={algo}
                    items={items.filter((i) => i.key.startsWith(`${activeStage.id}/${algo.id}`))}
                    diagramMode={diagramMode}
                    practicingKey={practice?.key ?? null}
                    stats={stats}
                    onApply={handleApply}
                    onStepMove={handleStepMove}
                    onPractice={handleStartPractice}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-400">
                This stage is intuitive — no algorithms needed. Set up a practice position and only ask for a hint when
                you're stuck.
              </p>
            )}
          </Section>

          <Section id="learn-free-play" title="Free play" icon={<Box size={14} />} defaultOpen={false}>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-2">
                <Button size="sm" icon={<Shuffle size={14} />} onClick={() => scramble()}>
                  Scramble
                </Button>
                <Button size="sm" variant="secondary" icon={<Undo2 size={14} />} onClick={undo}>
                  Undo
                </Button>
                <Button size="sm" variant="secondary" icon={<RotateCcw size={14} />} onClick={reset}>
                  Reset
                </Button>
              </div>
              <MovePanel onMove={applyMove} />
            </div>
          </Section>
        </>
      )}
    </div>
  );
};
