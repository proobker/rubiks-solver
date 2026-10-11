import { useCallback } from 'react';
import { useLocalStorage } from '@/lib/use-local-storage';
import type { DrillItem } from './stages';

export const CASE_STATS_KEY = 'rubiks-solver:case-stats';

export interface CaseStat {
  seen: number;
  recognized: number;
  solved: number;
  assisted: number;
  bestMs: number | null;
  totalMs: number;
  lastSeen: number;
}

export type CaseStats = Record<string, CaseStat>;

export interface DrillResult {
  recognized: boolean;
  solvedMs: number | null;
  assisted: boolean;
}

const EMPTY: CaseStat = {
  seen: 0,
  recognized: 0,
  solved: 0,
  assisted: 0,
  bestMs: null,
  totalMs: 0,
  lastSeen: 0,
};

export function useCaseStats() {
  const [stats, setStats] = useLocalStorage<CaseStats>(CASE_STATS_KEY, {});

  const record = useCallback(
    (key: string, result: DrillResult) => {
      setStats((prev) => {
        const s = prev[key] ?? EMPTY;
        const solved = result.solvedMs !== null;
        return {
          ...prev,
          [key]: {
            seen: s.seen + 1,
            recognized: s.recognized + (result.recognized ? 1 : 0),
            solved: s.solved + (solved ? 1 : 0),
            assisted: s.assisted + (result.assisted ? 1 : 0),
            bestMs: solved && !result.assisted ? Math.min(s.bestMs ?? Infinity, result.solvedMs!) : s.bestMs,
            totalMs: s.totalMs + (solved ? result.solvedMs! : 0),
            lastSeen: Date.now(),
          },
        };
      });
    },
    [setStats],
  );

  const clear = useCallback(() => setStats({}), [setStats]);

  return { stats, record, clear };
}

function weight(stat: CaseStat | undefined): number {
  if (!stat || stat.seen === 0) return 4;
  const missRate = 1 - stat.recognized / stat.seen;
  const assistRate = stat.assisted / stat.seen;
  const avgSeconds = stat.solved > 0 ? stat.totalMs / stat.solved / 1000 : 10;
  return 1 + 3 * missRate + 2 * assistRate + Math.min(avgSeconds, 20) / 10;
}

export function pickDrillItem(items: DrillItem[], stats: CaseStats, previousKey?: string): DrillItem {
  const pool = items.length > 1 ? items.filter((i) => i.key !== previousKey) : items;
  const weights = pool.map((i) => weight(stats[i.key]));
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

export function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

export function statSummary(stat: CaseStat | undefined): string | null {
  if (!stat || stat.seen === 0) return null;
  const parts = [`recognised ${stat.recognized}/${stat.seen}`];
  if (stat.solved > 0) parts.push(`avg ${formatSeconds(stat.totalMs / stat.solved)}`);
  return parts.join(' · ');
}
