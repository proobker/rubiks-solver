import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Hand } from 'lucide-react';
import { RubiksCube, type CameraApi, type CameraPresetName } from '@/features/cube/rubiks-cube';
import { CanvasToolbar } from '@/features/cube/canvas-toolbar';
import { useCubeStore } from '@/shared/stores/cube-store';
import { getStageHighlights } from '@/features/learning/highlights';
import { preloadWCAScramble } from '@/features/engine/wca-scramble';
import { preloadSolver } from '@/features/solver/preload';
import { useLocalStorage } from '@/lib/use-local-storage';
import { useMediaQuery } from '@/lib/use-media-query';
import { Segmented } from '@/components/ui/segmented';
import { Celebration } from '@/components/ui/celebration';
import type { MoveString } from '@/shared/types/cube';
import { TABS, type Tab } from './tabs';
import { TabContent } from './tab-content';
import { MobileSheet } from './mobile-sheet';

const Logo: React.FC<{ small?: boolean }> = ({ small }) => (
  <div className="flex items-center gap-2.5">
    <div className={`grid grid-cols-3 gap-[2px] p-[3px] rounded-md bg-zinc-900 border border-zinc-800 ${small ? 'w-6 h-6' : 'w-7 h-7'}`}>
      {['bg-cube-red', 'bg-cube-white', 'bg-cube-blue', 'bg-cube-yellow', 'bg-cube-green', 'bg-cube-orange', 'bg-cube-blue', 'bg-cube-red', 'bg-cube-yellow'].map(
        (c, i) => (
          <span key={i} className={`${c} rounded-[1px]`} />
        ),
      )}
    </div>
    <h1 className={`font-serif font-medium tracking-tight text-zinc-50 ${small ? 'text-base' : 'text-xl'}`}>Rubik's Solver</h1>
  </div>
);

export const App: React.FC = () => {
  const applyMove = useCubeStore((s) => s.applyMove);
  const solved = useCubeStore((s) => s.solved);
  const pieces = useCubeStore((s) => s.pieces);
  const [activeTab, setActiveTab] = useState<Tab>('moves');
  const [completedStageIds, setCompletedStageIds] = useLocalStorage<string[]>('rubiks-solver:completed-stages', []);
  const completedStages = useMemo<Set<string>>(() => new Set(completedStageIds), [completedStageIds]);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [orbitHintSeen, setOrbitHintSeen] = useLocalStorage<boolean>('rubiks-solver:orbit-hint-seen', false);
  const [celebrateKey, setCelebrateKey] = useState(0);
  const cameraApiRef = useRef<CameraApi | null>(null);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  useEffect(() => {
    preloadSolver();
    void preloadWCAScramble();
  }, []);

  useEffect(
    () =>
      useCubeStore.subscribe((state, prev) => {
        if (state.solved && !prev.solved && state.history.length > 0) setCelebrateKey((k) => k + 1);
      }),
    [],
  );

  const handlePreset = useCallback((name: CameraPresetName) => {
    cameraApiRef.current?.setPreset(name);
  }, []);

  const handleStageComplete = useCallback(
    (stageId: string) => {
      if (!completedStageIds.includes(stageId)) setCelebrateKey((k) => k + 1);
      setCompletedStageIds((prev) => (prev.includes(stageId) ? prev : [...prev, stageId]));
    },
    [completedStageIds, setCompletedStageIds],
  );

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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toUpperCase();
      const base = 'UDFBLR'.includes(key) ? key : 'XYZ'.includes(key) ? key.toLowerCase() : null;
      if (key.length !== 1 || !base) return;
      e.preventDefault();
      applyMove(`${base}${e.shiftKey ? "'" : ''}` as MoveString);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [applyMove]);

  const content = (
    <TabContent
      tab={activeTab}
      completedStages={completedStages}
      onStageComplete={handleStageComplete}
      onStageSelect={handleStageSelect}
      onResetProgress={handleResetProgress}
    />
  );

  const tabOptions = TABS.map((t) => {
    const Icon = t.icon;
    return { value: t.id, label: t.label, icon: <Icon size={14} /> };
  });

  return (
    <div className="h-dvh flex flex-col md:flex-row text-zinc-50 overflow-hidden">
      {isDesktop && (
        <aside className="flex w-[360px] xl:w-[400px] flex-col h-full shrink-0 bg-panel border-r border-zinc-800">
          <div className="p-4 border-b border-zinc-800 flex flex-col gap-4">
            <Logo />
            <Segmented options={tabOptions} value={activeTab} onChange={setActiveTab} ariaLabel="Sections" />
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4">{content}</div>
        </aside>
      )}

      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {!isDesktop && (
          <header className="shrink-0 px-4 py-3 bg-panel border-b border-zinc-800">
            <Logo small />
          </header>
        )}

        <main
          className="relative flex-1 min-h-0 overflow-hidden"
          onPointerDown={() => {
            if (!orbitHintSeen) setOrbitHintSeen(true);
          }}
        >
          {solved && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-zinc-950 text-zinc-50 text-sm pl-3 pr-4 py-2 rounded-md border border-zinc-800 font-medium animate-pop-in">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Solved
            </div>
          )}
          {celebrateKey > 0 && (
            <Celebration key={celebrateKey} seed={celebrateKey} className="pointer-events-none absolute left-1/2 top-10 z-20" />
          )}
          {!orbitHintSeen && (
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-zinc-950/80 text-zinc-300 text-xs px-3 py-2 rounded-md border border-zinc-800 backdrop-blur-sm animate-float-up max-md:hidden">
              <Hand size={14} /> Drag to orbit the cube
            </div>
          )}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 max-md:bottom-6">
            <CanvasToolbar
              reveal={reveal}
              onToggleReveal={() => setReveal((v) => !v)}
              onPreset={handlePreset}
              compact={!isDesktop}
            />
          </div>
          <RubiksCube highlights={highlights} reveal={reveal} cameraApiRef={cameraApiRef} />
        </main>

        {!isDesktop && (
          <MobileSheet
            expanded={sheetExpanded}
            onExpandedChange={setSheetExpanded}
            tab={activeTab}
            onTabChange={setActiveTab}
          >
            {content}
          </MobileSheet>
        )}
      </div>
    </div>
  );
};
