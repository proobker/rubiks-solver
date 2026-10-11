import React, { useState } from 'react';
import { Play, Zap } from 'lucide-react';
import type { MoveString } from '@/shared/types/cube';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoveChips } from '@/components/ui/move-chips';
import type { Algorithm, DrillItem } from './stages';
import type { CaseStats } from './case-stats';
import { statSummary } from './case-stats';
import { CaseDiagram } from './case-diagram';

interface AlgorithmCardProps {
  algorithm: Algorithm;
  items: DrillItem[];
  diagramMode: 'oll' | 'full';
  practicingKey: string | null;
  stats: CaseStats;
  onApply: (moves: MoveString[]) => void;
  onStepMove: (move: MoveString) => void;
  onPractice: (item: DrillItem) => void;
}

const ItemDetail: React.FC<{
  item: DrillItem;
  practicing: boolean;
  summary: string | null;
  onApply: (moves: MoveString[]) => void;
  onStepMove: (move: MoveString) => void;
  onPractice: (item: DrillItem) => void;
}> = ({ item, practicing, summary, onApply, onStepMove, onPractice }) => (
  <div className="flex flex-col gap-2.5">
    <div className="flex items-start justify-between gap-2">
      <code className="text-sm font-mono font-semibold text-amber-300 break-words">
        {item.notation}
        {item.repeat > 1 && <span className="text-zinc-500 font-normal"> ×1–{item.repeat}</span>}
      </code>
      {summary && <Badge tone="green">{summary}</Badge>}
    </div>
    <p className="text-xs text-zinc-400">{item.description}</p>
    {item.recognition && (
      <p className="text-xs text-zinc-400">
        <span className="font-semibold text-zinc-200">Look for: </span>
        {item.recognition}
      </p>
    )}
    {item.moves.length > 1 && <MoveChips moves={item.moves} onMove={onStepMove} />}
    <div className="flex gap-2">
      <Button
        size="sm"
        variant={practicing ? 'primary' : 'soft'}
        icon={<Play size={13} />}
        onClick={() => onPractice(item)}
        title="Load the position this algorithm solves, then step through it"
      >
        {practicing ? 'Practicing' : 'Practice'}
      </Button>
      <Button
        size="sm"
        variant="secondary"
        icon={<Zap size={13} />}
        onClick={() => onApply(item.moves)}
        title="Apply to the cube as it is now"
      >
        Apply
      </Button>
    </div>
  </div>
);

export const AlgorithmCard: React.FC<AlgorithmCardProps> = ({
  algorithm,
  items,
  diagramMode,
  practicingKey,
  stats,
  onApply,
  onStepMove,
  onPractice,
}) => {
  const hasCases = !!algorithm.cases && algorithm.cases.length > 0;
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const expanded = items.find((i) => i.key === expandedKey) ?? null;

  if (!hasCases) {
    const item = items[0];
    return (
      <div className="rounded-lg border border-zinc-800 bg-white/[0.035] p-3 flex gap-3">
        <CaseDiagram moves={item.moves} mode={diagramMode} size={64} />
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-100">{algorithm.name}</p>
          <ItemDetail
            item={item}
            practicing={practicingKey === item.key}
            summary={statSummary(stats[item.key])}
            onApply={onApply}
            onStepMove={onStepMove}
            onPractice={onPractice}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-sm font-semibold text-zinc-100">{algorithm.name}</p>
        <p className="text-xs text-zinc-500">{algorithm.description}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => {
          const isOpen = item.key === expandedKey;
          const stat = stats[item.key];
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setExpandedKey(isOpen ? null : item.key)}
              aria-expanded={isOpen}
              className={cn(
                'flex items-center gap-2.5 p-2 rounded-md border text-left transition-all duration-150 hover:-translate-y-0.5',
                isOpen
                  ? 'border-emerald-400/50 bg-emerald-500/10'
                  : practicingKey === item.key
                    ? 'border-accent/40 bg-accent/10'
                    : 'border-zinc-800 bg-black/25 hover:border-zinc-800',
              )}
            >
              <CaseDiagram moves={item.moves} mode={diagramMode} size={44} />
              <span className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-zinc-100 truncate">{item.name}</span>
                {stat && stat.seen > 0 && (
                  <span className="text-[10px] text-emerald-300/80 tabular-nums">
                    {stat.recognized}/{stat.seen} seen
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      {expanded && (
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/[0.06] p-3 animate-float-up">
          <div className="flex items-center gap-3 mb-2">
            <CaseDiagram moves={expanded.moves} mode={diagramMode} size={72} />
            <p className="text-sm font-semibold text-zinc-100">{expanded.name}</p>
          </div>
          <ItemDetail
            item={expanded}
            practicing={practicingKey === expanded.key}
            summary={statSummary(stats[expanded.key])}
            onApply={onApply}
            onStepMove={onStepMove}
            onPractice={onPractice}
          />
        </div>
      )}
    </div>
  );
};
