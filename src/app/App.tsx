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

const LOGO_CLASSES =
  'w-6 h-6 rounded-lg bg-gradient-to-br from-red-400 via-green-400 to-blue-500 shadow-[0_0_16px_rgba(56,189,248,0.55)] animate-float-slow';

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
    <div className="h-screen flex flex-col md:flex-row text-white overflow-hidden">
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 animate-aurora bg-[linear-gradient(110deg,#05060f_0%,#0b1030_35%,#120a2e_70%,#05060f_100%)] bg-[length:300%_300%]" />
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-sky-500/25 blur-[120px] animate-blob" />
        <div
          className="absolute top-1/3 -right-24 h-[28rem] w-[28rem] rounded-full bg-violet-600/25 blur-[130px] animate-blob"
          style={{ animationDelay: '-8s' }}
        />
        <div
          className="absolute -bottom-40 left-1/3 h-[26rem] w-[26rem] rounded-full bg-fuchsia-600/20 blur-[130px] animate-blob"
          style={{ animationDelay: '-16s' }}
        />
      </div>

      <aside className="hidden md:flex w-72 flex-col h-full relative z-10 bg-white/[0.04] backdrop-blur-2xl border-r border-white/10 shadow-[2px_0_40px_rgba(0,0,0,0.45)]">
        <div className="p-4 border-b border-white/10 bg-black/10">
          <div className="flex items-center gap-2 mb-3">
            <div className={LOGO_CLASSES} />
            <h1 className="text-lg font-bold bg-gradient-to-r from-sky-300 via-fuchsia-300 to-violet-300 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(168,85,247,0.45)]">
              Rubik's Solver
            </h1>
          </div>

          <div className="flex gap-1 bg-black/30 p-1 rounded-xl border border-white/10">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-sky-500 to-violet-600 text-white shadow-[0_0_16px_rgba(99,102,241,0.45)]'
                    : 'text-zinc-400 hover:text-zinc-100'
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
                  className="w-full py-2 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-110 rounded-lg font-semibold text-sm transition-all shadow-[0_0_18px_rgba(56,189,248,0.4)] hover:shadow-[0_0_28px_rgba(56,189,248,0.6)]"
                >
                  Scramble
                </button>
                <button
                  onClick={() => handleWCAScramble()}
                  disabled={wcaLoading}
                  className="w-full py-2 px-4 bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100 rounded-lg font-semibold text-sm transition-all shadow-[0_0_18px_rgba(217,70,239,0.35)] hover:shadow-[0_0_28px_rgba(217,70,239,0.55)]"
                  title="Official WCA random-state scramble"
                >
                  {wcaLoading ? 'Generating...' : 'WCA Scramble'}
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={reset}
                    className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg font-semibold text-sm transition-all"
                  >
                    Reset
                  </button>
                  <button
                    onClick={undo}
                    className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg font-semibold text-sm transition-all"
                  >
                    Undo
                  </button>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <label className="text-xs text-zinc-400 block mb-2">
                  Speed: <span className="font-mono text-sky-300">{moveSpeed.toFixed(1)}x</span>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={moveSpeed}
                  onChange={(e) => setMoveSpeed(parseFloat(e.target.value))}
                  className="w-full accent-sky-400"
                />
              </div>

              {scrambleMoves.length > 0 && (
                <div className="border-t border-white/10 pt-4">
                  <p className="text-xs font-medium text-zinc-400 mb-2">Scramble:</p>
                  <div className="font-mono text-sm text-zinc-200 flex flex-wrap gap-1 bg-black/30 border border-white/10 p-2 rounded-lg">
                    {scrambleMoves.join(' ')}
                  </div>
                </div>
              )}

              <div className="border-t border-white/10 pt-4">
                <h2 className="text-xs font-medium text-zinc-400 mb-3">Moves</h2>
                <MovePanel onMove={handleMove} />
              </div>

              <div className="mt-auto border-t border-white/10 pt-4 text-xs text-zinc-500">
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

      <div className="flex-1 flex flex-col min-h-0 relative z-10">
        <div className="md:hidden border-b border-white/10 px-3 py-2 bg-black/20 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className={LOGO_CLASSES} />
            <span className="font-bold text-sm bg-gradient-to-r from-sky-300 via-fuchsia-300 to-violet-300 bg-clip-text text-transparent">
              Rubik's Solver
            </span>
          </div>
          <div className="flex gap-1 bg-black/30 p-1 rounded-xl border border-white/10">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-sky-500 to-violet-600 text-white shadow-[0_0_16px_rgba(99,102,241,0.45)]'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <main className="relative flex-1 min-h-0">
          {solved && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-5 py-2 rounded-xl font-bold shadow-[0_0_28px_rgba(16,185,129,0.6)] backdrop-blur-md animate-float-slow">
              Solved!
            </div>
          )}
          <div className="absolute top-4 right-4 z-10 bg-black/40 backdrop-blur-xl text-zinc-300 text-xs px-3 py-1.5 rounded-lg border border-white/10 max-sm:hidden">
            Drag to orbit · use buttons to turn faces
          </div>
          <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
            <div className="flex gap-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-1 shadow-[0_0_20px_rgba(0,0,0,0.4)]">
              {(['isometric', 'front', 'back', 'left', 'right', 'top', 'bottom'] as CameraPresetName[]).map(
                (name) => (
                  <button
                    key={name}
                    onClick={() => handlePreset(name)}
                    className="px-2 py-1 text-[10px] font-semibold uppercase text-zinc-300 hover:bg-sky-500/20 hover:text-white hover:shadow-[0_0_12px_rgba(56,189,248,0.4)] rounded-lg transition-all"
                  >
                    {name}
                  </button>
                ),
              )}
            </div>
            <button
              onClick={() => setReveal((v) => !v)}
              className={`self-start px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                reveal
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-transparent shadow-[0_0_20px_rgba(99,102,241,0.6)]'
                  : 'bg-black/40 backdrop-blur-xl text-zinc-300 border-white/10 hover:bg-black/30 hover:text-white'
              }`}
            >
              {reveal ? 'X-Ray: On' : 'X-Ray: Off'}
            </button>
          </div>
          <RubiksCube highlights={highlights} reveal={reveal} cameraApiRef={cameraApiRef} />
        </main>

        <div className="md:hidden border-t border-white/10 p-3 space-y-3 bg-black/30 backdrop-blur-xl">
          <div className="flex gap-2">
            <button
              onClick={() => scramble()}
              className="flex-1 py-2 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-110 rounded-lg font-semibold text-sm transition-all shadow-[0_0_18px_rgba(56,189,248,0.4)]"
            >
              Scramble
            </button>
            <button
              onClick={() => handleWCAScramble()}
              disabled={wcaLoading}
              className="flex-1 py-2 px-4 bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100 rounded-lg font-semibold text-sm transition-all shadow-[0_0_18px_rgba(217,70,239,0.35)]"
            >
              {wcaLoading ? 'Generating...' : 'WCA Scramble'}
            </button>
            <button
              onClick={undo}
              className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg font-semibold text-sm transition-all"
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