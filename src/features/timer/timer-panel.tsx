import React, { useEffect, useRef, useState } from 'react';
import { useCubeStore } from '@/shared/stores/cube-store';
import { useWCAScramble } from '@/features/engine/use-wca-scramble';
import { useLocalStorage } from '@/lib/use-local-storage';
import { MovePanel } from '@/components/ui/move-button';
import type { MoveString } from '@/shared/types/cube';

interface SolveSession {
  timeMs: number;
  moves: number;
  ts: number;
}

const KEY = 'rubiks-solver:solve-sessions';

function formatTime(ms: number): string {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const centis = Math.floor((totalSeconds - Math.floor(totalSeconds)) * 100);
  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');
  const cc = centis.toString().padStart(2, '0');
  return `${mm}:${ss}.${cc}`;
}

export const TimerPanel: React.FC = () => {
  const applyMove = useCubeStore((s) => s.applyMove);
  const reset = useCubeStore((s) => s.reset);
  const solved = useCubeStore((s) => s.solved);
  const historyCount = useCubeStore((s) => s.history.length);
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

  const best = sessions.length > 0 ? Math.min(...sessions.map((s) => s.timeMs)) : null;
  const average = sessions.length > 0
    ? sessions.reduce((sum, s) => sum + s.timeMs, 0) / sessions.length
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold text-zinc-100 mb-1">Timer</h2>
        <p className="text-xs text-zinc-500 mb-3">
          Scramble, then solve — the timer starts on your first move and stops when the cube is solved.
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => void scrambleWCA()}
            disabled={wcaLoading}
            className="flex-1 py-2 px-4 bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100 rounded-lg font-semibold text-sm transition-all shadow-[0_0_18px_rgba(217,70,239,0.35)]"
          >
            {wcaLoading ? 'Generating...' : 'New Scramble'}
          </button>
          <button
            onClick={reset}
            className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg font-semibold text-sm transition-all"
          >
            Reset
          </button>
        </div>
      </div>

      {scrambleMoves.length > 0 && (
        <div className="font-mono text-sm text-zinc-200 flex flex-wrap gap-1 bg-black/30 border border-white/10 p-2 rounded-lg">
          {scrambleMoves.join(' ')}
        </div>
      )}

      <div className="border-t border-white/10 pt-4">
        <div className="text-center py-4">
          <div
            className={`font-mono text-5xl font-bold tabular-nums ${
              solved
                ? 'text-emerald-300 drop-shadow-[0_0_16px_rgba(16,185,129,0.5)]'
                : 'text-zinc-100'
            }`}
          >
            {formatTime(elapsedMs)}
          </div>
          <div className="text-sm text-zinc-400 mt-2">
            Moves: <span className="text-zinc-100 font-semibold">{historyCount}</span>
            {solved && (
              <span className="ml-2 text-emerald-300 font-semibold drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                Solved!
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-center gap-6 text-center text-xs text-zinc-500 mb-4">
          <div>
            <p>Best</p>
            <p className="text-zinc-100 font-medium tabular-nums">{best !== null ? formatTime(best) : '—'}</p>
          </div>
          <div>
            <p>Average</p>
            <p className="text-zinc-100 font-medium tabular-nums">{average !== null ? formatTime(average) : '—'}</p>
          </div>
          <div>
            <p>Solves</p>
            <p className="text-zinc-100 font-medium">{sessions.length}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 pt-4">
        <p className="text-xs font-medium text-zinc-400 mb-2">Moves</p>
        <MovePanel onMove={handleMove} />
      </div>
    </div>
  );
};
