import React, { useEffect, useRef, useState } from 'react';
import { History, RotateCcw, Sparkles, Trash2, X } from 'lucide-react';
import { useCubeStore } from '@/shared/stores/cube-store';
import { useWCAScramble } from '@/features/engine/use-wca-scramble';
import { useLocalStorage } from '@/lib/use-local-storage';
import { cn } from '@/lib/utils';
import { MovePanel } from '@/components/ui/move-button';
import { MoveChips } from '@/components/ui/move-chips';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Section } from '@/components/ui/section';
import { averageOf, best, formatTime, mean, relativeTime } from './stats';
import type { MoveString } from '@/shared/types/cube';
import { isRotation } from '@/shared/types/cube';

interface SolveSession {
  timeMs: number;
  moves: number;
  ts: number;
}

const KEY = 'rubiks-solver:solve-sessions';

const HISTORY_SHOWN = 20;

const StatTile: React.FC<{ label: string; value: number | null; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div className="rounded-xl bg-black/25 border border-white/[0.06] px-2 py-2.5 text-center">
    <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{label}</p>
    <p className={cn('font-mono text-sm font-bold tabular-nums mt-0.5', highlight ? 'text-yellow-200' : 'text-zinc-100')}>
      {value !== null ? formatTime(value) : '—'}
    </p>
  </div>
);

export const TimerPanel: React.FC = () => {
  const applyMove = useCubeStore((s) => s.applyMove);
  const reset = useCubeStore((s) => s.reset);
  const solved = useCubeStore((s) => s.solved);
  const historyCount = useCubeStore((s) => s.history.filter((h) => !isRotation(h.move)).length);
  const scrambleMoves = useCubeStore((s) => s.scrambleMoves);
  const { scramble: scrambleWCA, loading: wcaLoading } = useWCAScramble();

  const [sessions, setSessions] = useLocalStorage<SolveSession[]>(KEY, []);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startAtRef = useRef<number | null>(null);
  const recordedRef = useRef(false);

  const inSolve = historyCount > 0 && !solved;

  const handleMove = (move: MoveString) => applyMove(move);

  useEffect(() => {
    if (inSolve && startAtRef.current === null) {
      startAtRef.current = Date.now();
      recordedRef.current = false;
      setElapsedMs(0);
    }
    if (!inSolve && !solved && startAtRef.current !== null) {
      startAtRef.current = null;
      recordedRef.current = false;
      setElapsedMs(0);
    }
  }, [inSolve, solved, historyCount]);

  useEffect(() => {
    if (!inSolve) return;
    const id = setInterval(() => {
      if (startAtRef.current !== null) setElapsedMs(Date.now() - startAtRef.current);
    }, 50);
    return () => clearInterval(id);
  }, [inSolve]);

  useEffect(() => {
    if (solved && startAtRef.current !== null && !recordedRef.current) {
      recordedRef.current = true;
      const timeMs = Date.now() - startAtRef.current;
      startAtRef.current = null;
      setSessions((prev) => [...prev, { timeMs, moves: historyCount, ts: Date.now() }]);
    }
  }, [solved, historyCount, setSessions]);

  const [confirmClear, setConfirmClear] = useState(false);
  const times = sessions.map((x) => x.timeMs);
  const bestTime = best(times);
  const lastTime = times.length > 0 ? times[times.length - 1] : null;
  const isNewBest = solved && lastTime !== null && lastTime === bestTime && sessions.length > 1;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  const timerState = inSolve ? 'running' : solved && elapsedMs > 0 ? 'solved' : 'idle';

  const deleteSession = (ts: number) => setSessions((prev) => prev.filter((x) => x.ts !== ts));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Button icon={<Sparkles size={16} />} onClick={() => void scrambleWCA()} disabled={wcaLoading}>
          {wcaLoading ? 'Generating…' : 'New scramble'}
        </Button>
        <Button variant="secondary" size="icon" className="h-10 w-10" onClick={reset} aria-label="Reset cube">
          <RotateCcw size={16} />
        </Button>
      </div>

      {scrambleMoves.length > 0 && (
        <Card tone="inset" className="p-3">
          <MoveChips moves={scrambleMoves} />
        </Card>
      )}

      <Card
        className={cn(
          'text-center py-6 transition-colors duration-300',
          timerState === 'running' && 'border-yellow-300/40 bg-yellow-400/[0.06]',
          timerState === 'solved' && 'border-emerald-400/40 bg-emerald-500/[0.08]',
        )}
      >
        <p
          className={cn(
            'font-mono text-6xl font-bold tabular-nums tracking-tight',
            timerState === 'running' ? 'text-yellow-200' : timerState === 'solved' ? 'text-emerald-300' : 'text-zinc-300',
          )}
        >
          {formatTime(elapsedMs)}
        </p>
        <p className="text-xs text-zinc-400 mt-2">
          {timerState === 'running'
            ? `${historyCount} moves · solving…`
            : timerState === 'solved'
              ? isNewBest
                ? '🏆 New personal best!'
                : `Solved in ${historyCount} moves`
              : 'Scramble, then make a move to start the clock.'}
        </p>
      </Card>

      <div className="grid grid-cols-4 gap-2">
        <StatTile label="Best" value={bestTime} highlight />
        <StatTile label="ao5" value={averageOf(times, 5)} />
        <StatTile label="ao12" value={averageOf(times, 12)} />
        <StatTile label="Mean" value={mean(times)} />
      </div>

      <Section
        id="timer-history"
        title={`History (${sessions.length})`}
        icon={<History size={14} />}
        aside={
          sessions.length > 0 &&
          (confirmClear ? (
            <span className="flex items-center gap-1 animate-pop-in">
              <Button
                size="xs"
                accent="red"
                onClick={() => {
                  setSessions([]);
                  setConfirmClear(false);
                }}
              >
                Clear all
              </Button>
              <Button size="icon-sm" variant="ghost" onClick={() => setConfirmClear(false)} aria-label="Cancel">
                <X size={14} />
              </Button>
            </span>
          ) : (
            <Button size="icon-sm" variant="ghost" onClick={() => setConfirmClear(true)} aria-label="Clear history">
              <Trash2 size={14} />
            </Button>
          ))
        }
      >
        {sessions.length === 0 ? (
          <p className="text-xs text-zinc-500">No solves yet.</p>
        ) : (
          <ol className="flex flex-col gap-1">
            {sessions
              .slice(-HISTORY_SHOWN)
              .reverse()
              .map((x, i) => (
                <li key={x.ts} className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/[0.04] text-xs">
                  <span className="w-6 text-zinc-600 tabular-nums">{sessions.length - i}</span>
                  <span
                    className={cn(
                      'font-mono font-semibold tabular-nums flex-1',
                      x.timeMs === bestTime ? 'text-yellow-200' : 'text-zinc-100',
                    )}
                  >
                    {formatTime(x.timeMs)}
                  </span>
                  <span className="text-zinc-500 tabular-nums">{x.moves} mv</span>
                  <span className="text-zinc-600 w-14 text-right">{relativeTime(x.ts, now)}</span>
                  <button
                    type="button"
                    onClick={() => deleteSession(x.ts)}
                    aria-label="Delete solve"
                    className="text-zinc-600 hover:text-red-300 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
          </ol>
        )}
      </Section>

      <Section id="timer-moves" title="Moves" defaultOpen={false}>
        <MovePanel onMove={handleMove} />
      </Section>
    </div>
  );
};
