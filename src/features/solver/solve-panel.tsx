import React, { useState, useCallback } from 'react';
import { useCubeStore } from '@/shared/stores/cube-store';
import { solveCube } from './kociemba';
import type { MoveString } from '@/shared/types/cube';
import { MoveButton } from '@/components/ui/move-button';

interface SolveResult {
  moves: MoveString[];
  currentIndex: number;
}

export const SolvePanel: React.FC = () => {
  const { state, applyAlgorithm, isAnimating } = useCubeStore();
  const [solveResult, setSolveResult] = useState<SolveResult | null>(null);
  const [isSolving, setIsSolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSolve = useCallback(async () => {
    setIsSolving(true);
    setError(null);
    try {
      const solution = await solveCube(state);
      setSolveResult({ moves: solution, currentIndex: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to solve');
    } finally {
      setIsSolving(false);
    }
  }, [state]);

  const handleApplyAll = useCallback(() => {
    if (!solveResult) return;
    applyAlgorithm(solveResult.moves);
    setSolveResult(null);
  }, [solveResult, applyAlgorithm]);

  const handleReset = useCallback(() => {
    setSolveResult(null);
    setError(null);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold text-zinc-300 mb-2">Auto Solver</h2>
        <p className="text-xs text-zinc-400 mb-3">
          Uses the Kociemba two-phase algorithm to find an optimal solution (typically 20 moves or fewer).
        </p>

        <div className="flex gap-2">
          <button
            onClick={handleSolve}
            disabled={isSolving || isAnimating}
            className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-medium text-sm transition-colors"
          >
            {isSolving ? 'Solving...' : 'Solve'}
          </button>
          {solveResult && (
            <button
              onClick={handleApplyAll}
              disabled={isAnimating}
              className="py-2 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-medium text-sm transition-colors"
            >
              Apply All
            </button>
          )}
          <button
            onClick={handleReset}
            className="py-2 px-4 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium text-sm transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {solveResult && (
        <div>
          <p className="text-xs text-zinc-400 mb-2">
            Solution ({solveResult.moves.length} moves):
          </p>
          <div className="flex flex-wrap gap-1">
            {solveResult.moves.map((move, i) => (
              <MoveButton
                key={i}
                move={move}
                onClick={() => {
                  const singleMove = [move];
                  applyAlgorithm(singleMove);
                }}
                size="sm"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
