import React, { useCallback, useEffect, useState } from 'react';
import { RubiksCube } from '@/features/cube/rubiks-cube';
import { MovePanel } from '@/components/ui/move-button';
import { LearningPanel } from '@/features/learning/learning-panel';
import { SolvePanel } from '@/features/solver/solve-panel';
import { useCubeStore } from '@/shared/stores/cube-store';
import type { MoveString } from '@/shared/types/cube';

type Tab = 'moves' | 'learn' | 'solve';

export const App: React.FC = () => {
  const { applyMove, scramble, reset, undo, solved, moveSpeed, setMoveSpeed } = useCubeStore();
  const [activeTab, setActiveTab] = useState<Tab>('moves');
  const [completedStages, setCompletedStages] = useState<Set<string>>(new Set());

  const handleMove = useCallback((move: MoveString) => {
    applyMove(move);
  }, [applyMove]);

  const handleStageComplete = useCallback((stageId: string) => {
    setCompletedStages((prev) => new Set([...prev, stageId]));
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return;

    const key = e.key.toUpperCase();
    const shift = e.shiftKey;

    const faceMap: Record<string, MoveString> = {
      'U': shift ? "U'" as MoveString : 'U' as MoveString,
      'D': shift ? "D'" as MoveString : 'D' as MoveString,
      'F': shift ? "F'" as MoveString : 'F' as MoveString,
      'B': shift ? "B'" as MoveString : 'B' as MoveString,
      'L': shift ? "L'" as MoveString : 'L' as MoveString,
      'R': shift ? "R'" as MoveString : 'R' as MoveString,
    };

    if (faceMap[key]) {
      e.preventDefault();
      handleMove(faceMap[key]);
    }
  }, [handleMove]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'moves', label: 'Moves' },
    { id: 'learn', label: 'Learn' },
    { id: 'solve', label: 'Solve' },
  ];

  return (
    <div className="h-screen flex bg-zinc-950 text-white overflow-hidden">
      <aside className="w-72 border-r border-zinc-800 flex flex-col h-full">
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-red-500 via-green-500 to-blue-500" />
            <h1 className="text-lg font-bold">Rubik's Solver</h1>
          </div>

          <div className="flex gap-1 bg-zinc-800/50 p-1 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'moves' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => scramble()}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium text-sm transition-colors"
                >
                  Scramble
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={reset}
                    className="flex-1 py-2 px-4 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium text-sm transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    onClick={undo}
                    className="flex-1 py-2 px-4 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium text-sm transition-colors"
                  >
                    Undo
                  </button>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-4">
                <label className="text-xs text-zinc-400 block mb-2">
                  Speed: {moveSpeed.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={moveSpeed}
                  onChange={(e) => setMoveSpeed(parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              <div className="border-t border-zinc-800 pt-4">
                <h2 className="text-xs font-medium text-zinc-400 mb-3">Moves</h2>
                <MovePanel onMove={handleMove} />
              </div>

              <div className="mt-auto border-t border-zinc-800 pt-4 text-xs text-zinc-500">
                <p className="mb-1">Keyboard: U D F B L R</p>
                <p>Shift + key = prime (')</p>
              </div>
            </div>
          )}

          {activeTab === 'learn' && (
            <LearningPanel
              completedStages={completedStages}
              onStageComplete={handleStageComplete}
            />
          )}

          {activeTab === 'solve' && <SolvePanel />}
        </div>
      </aside>

      <main className="flex-1 relative">
        {solved && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-green-600/90 text-white px-4 py-2 rounded-lg font-medium shadow-lg">
            Solved!
          </div>
        )}
        <RubiksCube />
      </main>
    </div>
  );
};
