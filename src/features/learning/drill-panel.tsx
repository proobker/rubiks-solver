import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Flame, RotateCcw, Target, X } from 'lucide-react';
import { useCubeStore } from '@/shared/stores/cube-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Celebration } from '@/components/ui/celebration';
import type { DrillItem } from './stages';
import type { CaseStats, DrillResult } from './case-stats';
import { formatSeconds, statSummary } from './case-stats';
import type { DrillRound } from './drill';
import { startDrillRound } from './drill';
import { CaseDiagram } from './case-diagram';
import { piecesToFacelets } from './facelets';
import { stageStatus } from './stage-goals';

interface DrillPanelProps {
  stageId: string;
  stageName: string;
  items: DrillItem[];
  initialRound: DrillRound;
  diagramMode: 'oll' | 'full';
  stats: CaseStats;
  onRecord: (key: string, result: DrillResult) => void;
  onExit: () => void;
}

type Phase = 'recognize' | 'execute' | 'done';

export const DrillPanel: React.FC<DrillPanelProps> = ({
  stageId,
  stageName,
  items,
  initialRound,
  diagramMode,
  stats,
  onRecord,
  onExit,
}) => {
  const resetToPracticeStart = useCubeStore((s) => s.resetToPracticeStart);

  const [{ item, options }, setRound] = useState<DrillRound>(initialRound);
  const [phase, setPhase] = useState<Phase>('recognize');
  const [choice, setChoice] = useState<string | null>(null);
  const [assisted, setAssisted] = useState(false);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [timing, setTiming] = useState(false);
  const startAtRef = useRef<number | null>(null);
  const recordedRef = useRef(false);

  const [session, setSession] = useState({ answered: 0, correct: 0, streak: 0, bestStreak: 0 });
  const [newBest, setNewBest] = useState(false);

  const recognized = choice === item.key;
  const previousBest = stats[item.key]?.bestMs ?? null;

  const record = useCallback(
    (solvedMs: number | null) => {
      if (recordedRef.current) return;
      recordedRef.current = true;
      onRecord(item.key, { recognized, solvedMs, assisted });
    },
    [item, recognized, assisted, onRecord],
  );

  useEffect(() => {
    if (phase !== 'execute') return;
    return useCubeStore.subscribe((state, prev) => {
      if (startAtRef.current === null && (state.isAnimating || state.history.length > 0)) {
        startAtRef.current = Date.now();
        setTiming(true);
      }
      if (state.pieces === prev.pieces || state.history.length === 0) return;
      if (!stageStatus(stageId, piecesToFacelets(state.pieces)).complete) return;
      const ms = Date.now() - (startAtRef.current ?? Date.now());
      setElapsedMs(ms);
      setNewBest(!assisted && (previousBest === null || ms < previousBest));
      setPhase('done');
      record(ms);
    });
  }, [phase, stageId, record, assisted, previousBest]);

  const restartTimer = () => {
    startAtRef.current = null;
    setTiming(false);
    setElapsedMs(null);
    setNewBest(false);
  };

  const handleChoose = (key: string | null) => {
    const correct = key === item.key;
    setSession((s) => {
      const streak = correct ? s.streak + 1 : 0;
      return {
        answered: s.answered + 1,
        correct: s.correct + (correct ? 1 : 0),
        streak,
        bestStreak: Math.max(s.bestStreak, streak),
      };
    });
    setChoice(key);
    setPhase('execute');
  };

  const handleRetry = () => {
    resetToPracticeStart();
    restartTimer();
    setPhase('execute');
  };

  const handleNext = () => {
    if (phase !== 'done') record(null);
    setRound(startDrillRound(items, stats, item.key));
    restartTimer();
    recordedRef.current = false;
    setChoice(null);
    setAssisted(false);
    setPhase('recognize');
  };

  const handleExit = () => {
    if (phase !== 'done') record(null);
    onExit();
  };

  const accuracy = session.answered > 0 ? Math.round((session.correct / session.answered) * 100) : null;

  return (
    <div className="relative rounded-2xl border border-violet-400/40 bg-violet-500/[0.07] p-4 flex flex-col gap-4 animate-pop-in">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-violet-300">Drill</p>
          <p className="text-sm font-bold text-white truncate">{stageName}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge tone="amber">
            <Flame size={11} /> {session.streak}
          </Badge>
          <Badge tone="violet">
            <Target size={11} /> {accuracy === null ? '—' : `${accuracy}%`}
          </Badge>
          <Button size="icon-sm" variant="ghost" onClick={handleExit} aria-label="Exit drill">
            <X size={16} />
          </Button>
        </div>
      </div>

      {phase === 'recognize' ? (
        <div key={`q-${item.key}-${session.answered}`} className="flex flex-col gap-3 animate-float-up">
          <p className="text-sm text-zinc-200">
            Look at the cube <span className="text-zinc-500">(yellow on top)</span>. Which case is it?
          </p>
          <div className="grid grid-cols-2 gap-2">
            {options.map((o) => (
              <Button key={o.key} size="lg" variant="secondary" className="text-sm h-14" onClick={() => handleChoose(o.key)}>
                {o.name}
              </Button>
            ))}
          </div>
          <Button size="xs" variant="ghost" className="self-start" onClick={() => handleChoose(null)}>
            I don't know — show me
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div
            className={cn(
              'flex gap-3 items-center rounded-xl p-3 border animate-pop-in',
              recognized ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-amber-400/40 bg-amber-500/10',
            )}
          >
            <CaseDiagram moves={item.moves} mode={diagramMode} size={64} />
            <div className="flex flex-col gap-1 min-w-0">
              <p className={cn('text-sm font-bold', recognized ? 'text-emerald-300' : 'text-amber-200')}>
                {recognized ? `✓ ${item.name}` : `It's ${item.name}`}
              </p>
              {item.recognition && <p className="text-[11px] text-zinc-300">Look for: {item.recognition}</p>}
              {statSummary(stats[item.key]) && (
                <p className="text-[10px] text-zinc-500">{statSummary(stats[item.key])}</p>
              )}
            </div>
          </div>

          {phase === 'execute' && (
            <>
              <p className="text-xs text-zinc-300">
                Now solve it with the move buttons or keyboard — it may need a U turn first.
                {timing ? ' ⏱ Timing…' : ' The timer starts on your first move.'}
              </p>
              {assisted ? (
                <code className="text-sm font-mono font-semibold bg-black/40 px-3 py-2 rounded-xl text-amber-300 border border-white/10">
                  {item.notation}
                </code>
              ) : (
                <Button size="xs" variant="ghost" className="self-start" onClick={() => setAssisted(true)}>
                  Show algorithm
                </Button>
              )}
            </>
          )}

          {phase === 'done' && (
            <div className="relative text-center py-2 animate-pop-in">
              {newBest && <Celebration seed={session.answered} />}
              <p className="font-mono text-3xl font-bold text-emerald-300 tabular-nums">
                {elapsedMs !== null ? formatSeconds(elapsedMs) : 'Solved'}
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                {newBest ? 'New personal best for this case!' : assisted ? 'Solved with the algorithm shown.' : 'Solved!'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" icon={<RotateCcw size={14} />} onClick={handleRetry}>
              Retry
            </Button>
            <Button accent="violet" onClick={handleNext}>
              Next case <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
