import React from 'react';
import { cn } from '@/lib/utils';
import type { MoveString, FaceName } from '@/shared/types/cube';

interface MoveButtonProps {
  move: MoveString;
  onClick: (move: MoveString) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const FACE_COLORS: Record<FaceName, string> = {
  U: 'bg-gradient-to-br from-white via-slate-100 to-slate-300 text-zinc-900 border-white/70 shadow-[inset_0_2px_3px_rgba(255,255,255,0.8),0_0_14px_rgba(255,255,255,0.35)]',
  D: 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 text-zinc-900 border-yellow-200/70 shadow-[inset_0_2px_3px_rgba(255,255,255,0.6),0_0_14px_rgba(250,204,21,0.45)]',
  F: 'bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 text-white border-green-300/60 shadow-[inset_0_2px_3px_rgba(255,255,255,0.4),0_0_14px_rgba(34,197,94,0.5)]',
  B: 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700 text-white border-blue-300/60 shadow-[inset_0_2px_3px_rgba(255,255,255,0.4),0_0_14px_rgba(59,130,246,0.5)]',
  L: 'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-700 text-white border-orange-300/60 shadow-[inset_0_2px_3px_rgba(255,255,255,0.4),0_0_14px_rgba(249,115,22,0.5)]',
  R: 'bg-gradient-to-br from-red-400 via-red-500 to-red-700 text-white border-red-300/60 shadow-[inset_0_2px_3px_rgba(255,255,255,0.4),0_0_14px_rgba(239,68,68,0.5)]',
};

export const MoveButton: React.FC<MoveButtonProps> = ({
  move,
  onClick,
  disabled = false,
  className,
  size = 'md',
}) => {
  const face = move[0] as FaceName;
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  return (
    <button
      onClick={() => onClick(move)}
      disabled={disabled}
      className={cn(
        'rounded-lg font-bold border-2 transition-all duration-150',
        'hover:scale-105 hover:brightness-110 active:scale-95',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        FACE_COLORS[face],
        sizeClasses[size],
        className
      )}
    >
      {move}
    </button>
  );
};

interface MovePanelProps {
  onMove: (move: MoveString) => void;
  disabled?: boolean;
  showWide?: boolean;
}

const FACES: FaceName[] = ['U', 'D', 'F', 'B', 'L', 'R'];

export const MovePanel: React.FC<MovePanelProps> = ({ onMove, disabled = false, showWide = true }) => {
  return (
    <div className="flex flex-col gap-2">
      {FACES.map((face) => (
        <div key={face} className="flex items-center gap-1">
          <MoveButton
            move={`${face}` as MoveString}
            onClick={onMove}
            disabled={disabled}
            size="md"
          />
          <MoveButton
            move={`${face}'` as MoveString}
            onClick={onMove}
            disabled={disabled}
            size="md"
          />
          {showWide && (
            <MoveButton
              move={`${face}2` as MoveString}
              onClick={onMove}
              disabled={disabled}
              size="md"
            />
          )}
        </div>
      ))}
    </div>
  );
};
