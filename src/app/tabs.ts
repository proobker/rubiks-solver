import { Box, GraduationCap, Timer, Wand2, type LucideIcon } from 'lucide-react';

export type Tab = 'moves' | 'learn' | 'solve' | 'timer';

export interface TabDef {
  id: Tab;
  label: string;
  icon: LucideIcon;
}

export const TABS: TabDef[] = [
  { id: 'moves', label: 'Moves', icon: Box },
  { id: 'learn', label: 'Learn', icon: GraduationCap },
  { id: 'solve', label: 'Solve', icon: Wand2 },
  { id: 'timer', label: 'Timer', icon: Timer },
];
