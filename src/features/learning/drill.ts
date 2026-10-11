import type { MoveString } from '@/shared/types/cube';
import { invertAlgorithm } from '@/features/engine/moves';
import { useCubeStore } from '@/shared/stores/cube-store';
import type { DrillItem } from './stages';
import type { CaseStats } from './case-stats';
import { pickDrillItem } from './case-stats';

export interface DrillRound {
  item: DrillItem;
  options: DrillItem[];
}

const AUFS: (MoveString | null)[] = [null, 'U', "U'", 'U2'];
const OPTION_COUNT = 4;

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function optionsFor(item: DrillItem, items: DrillItem[]): DrillItem[] {
  const distractors = shuffle(items.filter((i) => i.key !== item.key && i.name !== item.name));
  return shuffle([item, ...distractors.slice(0, OPTION_COUNT - 1)]);
}

/** Picks the next case and loads it onto the cube (yellow on top, random U offset). */
export function startDrillRound(items: DrillItem[], stats: CaseStats, previousKey?: string): DrillRound {
  const item = pickDrillItem(items, stats, previousKey);
  const auf = AUFS[Math.floor(Math.random() * AUFS.length)];
  const { loadPosition, startPractice } = useCubeStore.getState();
  loadPosition(['z2', ...invertAlgorithm(item.moves), ...(auf ? [auf] : [])]);
  startPractice();
  return { item, options: optionsFor(item, items) };
}
