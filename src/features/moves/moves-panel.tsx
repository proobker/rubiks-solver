import React from 'react';
import { Keyboard, RotateCcw, Shuffle, Sparkles, Undo2 } from 'lucide-react';
import { useCubeStore } from '@/shared/stores/cube-store';
import { useWCAScramble } from '@/features/engine/use-wca-scramble';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Section } from '@/components/ui/section';
import { MovePanel } from '@/components/ui/move-button';
import { MoveChips } from '@/components/ui/move-chips';

const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className="inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-md bg-white/[0.08] border border-zinc-800 border-b-2 font-mono text-[11px] text-zinc-200">
    {children}
  </kbd>
);

export const MovesPanel: React.FC = () => {
  const applyMove = useCubeStore((s) => s.applyMove);
  const scramble = useCubeStore((s) => s.scramble);
  const reset = useCubeStore((s) => s.reset);
  const undo = useCubeStore((s) => s.undo);
  const scrambleMoves = useCubeStore((s) => s.scrambleMoves);
  const { scramble: scrambleWCA, loading: wcaLoading } = useWCAScramble();

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        <Button icon={<Shuffle size={16} />} onClick={() => scramble()}>
          Scramble
        </Button>
        <Button
          variant="soft"
          icon={<Sparkles size={16} />}
          onClick={() => void scrambleWCA()}
          disabled={wcaLoading}
          title="Official WCA random-state scramble"
        >
          {wcaLoading ? 'Generating…' : 'WCA'}
        </Button>
        <Button variant="secondary" icon={<Undo2 size={16} />} onClick={undo}>
          Undo
        </Button>
        <Button variant="secondary" icon={<RotateCcw size={16} />} onClick={reset}>
          Reset
        </Button>
      </div>

      {scrambleMoves.length > 0 && (
        <Card tone="inset" className="p-3 animate-float-up">
          <p className="text-xs font-medium text-zinc-400 mb-2">Scramble</p>
          <MoveChips moves={scrambleMoves} />
        </Card>
      )}

      <MovePanel onMove={applyMove} />

      <Section id="keyboard-help" title="Keyboard" icon={<Keyboard size={14} />} defaultOpen={false}>
        <div className="flex flex-col gap-2 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5 flex-wrap">
            {['U', 'D', 'F', 'B', 'L', 'R'].map((k) => (
              <Kbd key={k}>{k}</Kbd>
            ))}
            <span>turn a face</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {['X', 'Y', 'Z'].map((k) => (
              <Kbd key={k}>{k}</Kbd>
            ))}
            <span>rotate the cube</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Kbd>Shift</Kbd>
            <span>+ key = prime (counter-clockwise)</span>
          </div>
        </div>
      </Section>
    </div>
  );
};
