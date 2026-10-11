import React from 'react';
import { AccentContext } from '@/components/ui/accent-context';
import { MovesPanel } from '@/features/moves/moves-panel';
import { LearningPanel } from '@/features/learning/learning-panel';
import { SolvePanel } from '@/features/solver/solve-panel';
import { TimerPanel } from '@/features/timer/timer-panel';
import { tabDef, type Tab } from './tabs';

interface TabContentProps {
  tab: Tab;
  completedStages: Set<string>;
  onStageComplete: (stageId: string) => void;
  onStageSelect: (stageId: string) => void;
  onResetProgress: () => void;
}

export const TabContent: React.FC<TabContentProps> = ({ tab, ...learning }) => (
  <AccentContext.Provider value={tabDef(tab).accent}>
    {tab === 'moves' && <MovesPanel />}
    {tab === 'learn' && <LearningPanel {...learning} />}
    {tab === 'solve' && <SolvePanel />}
    {tab === 'timer' && <TimerPanel />}
  </AccentContext.Provider>
);
