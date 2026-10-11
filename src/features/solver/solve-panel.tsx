import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, FastForward, Loader2, Pause, Play, SkipBack, SkipForward, Wand2, X } from 'lucide-react';
import { useCubeStore } from '@/shared/stores/cube-store';
import type { MoveString } from '@/shared/types/cube';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MoveChips } from '@/components/ui/move-chips';
import { solveCube } from './kociemba';

interface Solution {
  moves: MoveString[];
  baseHistory: number;
}

const PLAY_DELAY_MS = 120;

export const SolvePanel: React.FC = () => {
  const state = useCubeStore((s) => s.state);
  const solved = useCubeStore((s) => s.solved);
  const isAnimating = useCubeStore((s) => s.isAnimating);
  const queued = useCubeStore((s) => s.moveQueue.length);
  const historyLength = useCubeStore((s) => s.history.length);
  const applyMove = useCubeStore((s) => s.applyMove);
  const applyAlgorithm = useCubeStore((s) => s.applyAlgorithm);
  const undo = useCubeStore((s) => s.undo);

  const [solution, setSolution] = useState<Solution | null>(null);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [isSolving, setIsSolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busy = isAnimating || queued > 0;
  const total = solution?.moves.length ?? 0;
  const stale = !!solution && !busy && historyLength !== solution.baseHistory + step;
  const finished = !!solution && step >= total;

  const handleSolve = useCallback(async () => {
    setIsSolving(true);
    setError(null);
    setPlaying(false);
    try {
      const moves = await solveCube(state);
      setSolution({ moves, baseHistory: useCubeStore.getState().history.length });
      setStep(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to solve');
    } finally {
      setIsSolving(false);
    }
  }, [state]);

  const next = useCallback(() => {
    if (!solution || step >= solution.moves.length) return;
    applyMove(solution.moves[step]);
    setStep((s) => s + 1);
  }, [solution, step, applyMove]);

  const prev = () => {
    if (step === 0 || busy) return;
    undo();
    setStep((s) => s - 1);
  };

  const applyRest = () => {
    if (!solution) return;
    setPlaying(false);
    applyAlgorithm(solution.moves.slice(step));
    setStep(solution.moves.length);
  };

  const clear = () => {
    setSolution(null);
    setStep(0);
    setPlaying(false);
  };

  useEffect(() => {
    if (!playing || busy || stale) return;
    const id = setTimeout(() => {
      if (finished) {
        setPlaying(false);
        return;
      }
      next();
    }, PLAY_DELAY_MS);
    return () => clearTimeout(id);
  }, [playing, busy, stale, finished, next]);

  if (!solution || stale) {
    return (
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col items-center text-center gap-3 py-6">
          <div className="w-14 h-14 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent-soft">
            <Wand2 size={26} />
          </div>
          <div>
            <h2 className="font-serif text-lg font-medium text-zinc-50">Auto solver</h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-64">
              {stale
                ? 'The cube changed since the last solution. Solve again from here.'
                : solved
                  ? 'The cube is already solved. Scramble it first, then come back.'
                  : 'Finds a solution with the Kociemba two-phase algorithm — usually 20 moves or fewer.'}
            </p>
          </div>
          <Button
            size="lg"
            className="w-full"
            icon={isSolving ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
            onClick={() => void handleSolve()}
            disabled={isSolving || busy || solved}
          >
            {isSolving ? 'Solving…' : 'Solve'}
          </Button>
        </Card>

        {error && (
          <Card className="border-red-400/30 bg-red-500/10 flex items-start gap-3 animate-pop-in">
            <AlertTriangle size={18} className="text-red-300 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-red-200">{error}</p>
              <Button size="xs" variant="soft" accent="danger" className="mt-2" onClick={() => void handleSolve()}>
                Try again
              </Button>
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3 animate-pop-in">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-lg font-medium text-zinc-50">Solution</h2>
            <p className="text-xs text-zinc-400">{total} moves</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge tone={finished ? 'green' : 'neutral'}>
              {finished ? 'Done' : `Step ${step} / ${total}`}
            </Badge>
            <Button size="icon-sm" variant="ghost" onClick={clear} aria-label="Clear solution">
              <X size={16} />
            </Button>
          </div>
        </div>

        <Progress value={step} max={total} />
        <MoveChips moves={solution.moves} progressIndex={step} />

        <div className="grid grid-cols-4 gap-2">
          <Button variant="secondary" size="md" onClick={prev} disabled={step === 0 || busy} aria-label="Previous move">
            <SkipBack size={16} />
          </Button>
          <Button
            size="md"
            onClick={() => setPlaying((p) => !p)}
            disabled={finished}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </Button>
          <Button variant="secondary" size="md" onClick={next} disabled={finished || busy} aria-label="Next move">
            <SkipForward size={16} />
          </Button>
          <Button variant="soft" size="md" onClick={applyRest} disabled={finished} aria-label="Apply remaining moves">
            <FastForward size={16} />
          </Button>
        </div>
        {!finished && solution.moves[step] && (
          <p className="text-xs text-zinc-400 text-center">
            Next move: <span className="font-mono font-semibold text-accent-soft">{solution.moves[step]}</span>
          </p>
        )}
      </Card>
    </div>
  );
};
