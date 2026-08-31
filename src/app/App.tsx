import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RubiksCube, type CameraApi, type CameraPresetName } from '@/features/cube/rubiks-cube';
import { MovePanel, MoveButton } from '@/components/ui/move-button';
import { LearningPanel } from '@/features/learning/learning-panel';
import { SolvePanel } from '@/features/solver/solve-panel';
import { TimerPanel } from '@/features/timer/timer-panel';
import { useCubeStore } from '@/shared/stores/cube-store';
import { getStageHighlights } from '@/features/learning/highlights';
import { preloadWCAScramble } from '@/features/engine/wca-scramble';
import { useWCAScramble } from '@/features/engine/use-wca-scramble';
import { preloadSolver } from '@/features/solver/preload';
import { useLocalStorage } from '@/lib/use-local-storage';
import type { MoveString, FaceName } from '@/shared/types/cube';

type Tab = 'moves' | 'learn' | 'solve' | 'timer';

export const App: React.FC = () => {
  const { applyMove, scramble, reset, undo, solved, moveSpeed, setMoveSpeed, scrambleMoves, pieces } = useCubeStore();
  const [activeTab, setActiveTab] = useState<Tab>('moves');
  const [completedStageIds, setCompletedStageIds] = useLocalStorage<string[]>(
    'rubiks-solver:completed-stages',
    [],
  );
  const completedStages = useMemo<Set<string>>(
    () => new Set(completedStageIds),
    [completedStageIds],
  );
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);
  const cameraApiRef = useRef<CameraApi | null>(null);
  const { scramble: scrambleWCA, loading: wcaLoading } = useWCAScramble();

  useEffect(() => {
    preloadSolver();
    void preloadWCAScramble();
  }, []);

  const handlePreset = useCallback((name: CameraPresetName) => {
    cameraApiRef.current?.setPreset(name);
  }, []);

  const handleMove = useCallback((move: MoveString) => {
    applyMove(move);
  }, [applyMove]);

  const handleWCAScramble = useCallback(() => {
    void scrambleWCA();
  }, [scrambleWCA]);

  const handleStageComplete = useCallback((stageId: string) => {
    setCompletedStageIds((prev) => (prev.includes(stageId) ? prev : [...prev, stageId]));
  }, [setCompletedStageIds]);

  const handleResetProgress = useCallback(() => {
    setCompletedStageIds([]);
  }, [setCompletedStageIds]);

  const handleStageSelect = useCallback((stageId: string) => {
    setSelectedStageId(stageId);
  }, []);

  const highlights = useMemo(() => {
    if (!selectedStageId || activeTab !== 'learn') return undefined;
    return getStageHighlights(selectedStageId, pieces);
  }, [selectedStageId, activeTab, pieces]);

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
    { id: 'timer', label: 'Timer' },
  ];

  return (
    <div className="h-screen flex flex-col md:flex-row bg-zinc-950 text-white overflow-hidden">
      <aside className="hidden md:flex w-72 border-r border-zinc-800 flex-col h-full">
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
                <button
                  onClick={() => handleWCAScramble()}
                  disabled={wcaLoading}
                  className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-medium text-sm transition-colors"
                  title="Official WCA random-state scramble"
                >
                  {wcaLoading ? 'Generating...' : 'WCA Scramble'}
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

              {scrambleMoves.length > 0 && (
                <div className="border-t border-zinc-800 pt-4">
                  <p className="text-xs font-medium text-zinc-400 mb-2">Scramble:</p>
                  <div className="font-mono text-sm text-zinc-300 flex flex-wrap gap-1 bg-zinc-800/50 p-2 rounded-lg">
                    {scrambleMoves.join(' ')}
                  </div>
                </div>
              )}

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
              onStageSelect={handleStageSelect}
              onResetProgress={handleResetProgress}
            />
          )}

          {activeTab === 'solve' && <SolvePanel />}

          {activeTab === 'timer' && <TimerPanel />}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="md:hidden border-b border-zinc-800 px-3 py-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-red-500 via-green-500 to-blue-500" />
            <span className="font-bold text-sm">Rubik's Solver</span>
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

        <main className="relative flex-1 min-h-0">
          {solved && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-green-600/90 text-white px-4 py-2 rounded-lg font-medium shadow-lg">
              Solved!
            </div>
          )}
          <div className="absolute top-4 right-4 z-10 bg-zinc-800/90 text-zinc-300 text-xs px-3 py-1.5 rounded-lg border border-zinc-700 max-sm:hidden">
            Drag to orbit · use buttons to turn faces
          </div>
          <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
            <div className="flex gap-1 bg-zinc-900/90 border border-zinc-800 rounded-lg p-1">
              {(['isometric', 'front', 'back', 'left', 'right', 'top', 'bottom'] as CameraPresetName[]).map(
                (name) => (
                  <button
                    key={name}
                    onClick={() => handlePreset(name)}
                    className="px-2 py-1 text-[10px] font-medium uppercase text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-md transition-colors"
                  >
                    {name}
                  </button>
                ),
              )}
            </div>
            <button
              onClick={() => setReveal((v) => !v)}
              className={`self-start px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                reveal
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
              }`}
            >
              {reveal ? 'X-Ray: On' : 'X-Ray: Off'}
            </button>
          </div>
          <RubiksCube highlights={highlights} reveal={reveal} cameraApiRef={cameraApiRef} />
        </main>

        <div className="md:hidden border-t border-zinc-800 p-3 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => scramble()}
              className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium text-sm transition-colors"
            >
              Scramble
            </button>
            <button
              onClick={() => handleWCAScramble()}
              disabled={wcaLoading}
              className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-medium text-sm transition-colors"
            >
              {wcaLoading ? 'Generating...' : 'WCA Scramble'}
            </button>
            <button
              onClick={undo}
              className="flex-1 py-2 px-4 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium text-sm transition-colors"
            >
              Undo
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['U', 'D', 'F', 'B', 'L', 'R'] as FaceName[]).map((face) => (
              <div key={face} className="flex gap-2">
                <MoveButton
                  move={`${face}` as MoveString}
                  onClick={handleMove}
                  className="flex-1"
                />
                <MoveButton
                  move={`${face}'` as MoveString}
                  onClick={handleMove}
                  className="flex-1"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
