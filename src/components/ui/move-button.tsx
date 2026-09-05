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
  U: 'bg-gradient-to-br from-white via-slate-100 to-slate-300 text-zinc-900 border-black/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_1px_2px_rgba(0,0,0,0.35)]',
  D: 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-zinc-900 border-black/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_1px_2px_rgba(0,0,0,0.35)]',
  F: 'bg-gradient-to-br from-green-400 via-green-500 to-green-600 text-white border-black/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_1px_2px_rgba(0,0,0,0.35)]',
  B: 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 text-white border-black/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_1px_2px_rgba(0,0,0,0.35)]',
  L: 'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 text-white border-black/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_1px_2px_rgba(0,0,0,0.35)]',
  R: 'bg-gradient-to-br from-red-400 via-red-500 to-red-600 text-white border-black/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_1px_2px_rgba(0,0,0,0.35)]',
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
        'hover:scale-105 active:scale-95',
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
