import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Gauge, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCubeStore } from '@/shared/stores/cube-store';
import type { CameraPresetName } from './rubiks-cube';

const PRESETS: { name: CameraPresetName; label: string }[] = [
  { name: 'isometric', label: 'Isometric' },
  { name: 'front', label: 'Front' },
  { name: 'back', label: 'Back' },
  { name: 'left', label: 'Left' },
  { name: 'right', label: 'Right' },
  { name: 'top', label: 'Top' },
  { name: 'bottom', label: 'Bottom' },
];

type Menu = 'view' | 'speed' | null;

interface CanvasToolbarProps {
  reveal: boolean;
  onToggleReveal: () => void;
  onPreset: (name: CameraPresetName) => void;
  compact?: boolean;
}

const ToolButton: React.FC<{
  active?: boolean;
  label: string;
  compact?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, label, compact, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    aria-pressed={active}
    title={label}
    className={cn(
      'inline-flex items-center gap-1.5 h-9 rounded-md text-xs font-semibold transition-colors',
      compact ? 'w-9 justify-center' : 'px-3',
      active ? 'bg-accent text-zinc-50' : 'text-zinc-300 hover:text-zinc-50 hover:bg-white/10',
    )}
  >
    {children}
    {!compact && <span>{label}</span>}
  </button>
);

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({ reveal, onToggleReveal, onPreset, compact }) => {
  const moveSpeed = useCubeStore((s) => s.moveSpeed);
  const setMoveSpeed = useCubeStore((s) => s.setMoveSpeed);
  const [menu, setMenu] = useState<Menu>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(null);
    };
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  const toggle = (m: Menu) => setMenu((cur) => (cur === m ? null : m));

  return (
    <div ref={rootRef} className="relative">
      {menu === 'view' && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-40 p-1 rounded-lg bg-panel/95 border border-zinc-800 shadow-lg shadow-black/40 backdrop-blur animate-pop-in">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => {
                onPreset(p.name);
                setMenu(null);
              }}
              className="w-full text-left px-3 py-2 rounded-md text-xs font-medium text-zinc-300 hover:bg-white/10 hover:text-zinc-50"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
      {menu === 'speed' && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-56 p-3 rounded-lg bg-panel/95 border border-zinc-800 shadow-lg shadow-black/40 backdrop-blur animate-pop-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400">Turn speed</span>
            <span className="font-mono text-xs text-zinc-100">{moveSpeed.toFixed(1)}×</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={moveSpeed}
            onChange={(e) => setMoveSpeed(parseFloat(e.target.value))}
            aria-label="Turn speed"
            className="w-full accent-accent"
          />
        </div>
      )}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-panel/90 border border-zinc-800 shadow-lg shadow-black/40 backdrop-blur">
        <ToolButton label="View" compact={compact} active={menu === 'view'} onClick={() => toggle('view')}>
          <Video size={16} />
        </ToolButton>
        <ToolButton label="X-Ray" compact={compact} active={reveal} onClick={onToggleReveal}>
          {reveal ? <Eye size={16} /> : <EyeOff size={16} />}
        </ToolButton>
        <ToolButton label="Speed" compact={compact} active={menu === 'speed'} onClick={() => toggle('speed')}>
          <Gauge size={16} />
        </ToolButton>
      </div>
    </div>
  );
};
