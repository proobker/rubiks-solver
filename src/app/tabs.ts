import { Box, GraduationCap, Timer, Wand2, type LucideIcon } from 'lucide-react';
import type { Accent } from '@/components/ui/variants';

export type Tab = 'moves' | 'learn' | 'solve' | 'timer';

export interface TabDef {
  id: Tab;
  label: string;
  icon: LucideIcon;
  accent: Accent;
}

export const TABS: TabDef[] = [
  { id: 'moves', label: 'Moves', icon: Box, accent: 'blue' },
  { id: 'learn', label: 'Learn', icon: GraduationCap, accent: 'green' },
  { id: 'solve', label: 'Solve', icon: Wand2, accent: 'orange' },
  { id: 'timer', label: 'Timer', icon: Timer, accent: 'yellow' },
];

export function tabDef(id: Tab): TabDef {
  return TABS.find((t) => t.id === id) ?? TABS[0];
}
