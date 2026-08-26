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
  U: 'bg-white text-black border-gray-300',
  D: 'bg-yellow-400 text-black border-yellow-500',
  F: 'bg-green-500 text-white border-green-600',
  B: 'bg-blue-500 text-white border-blue-600',
  L: 'bg-orange-500 text-white border-orange-600',
  R: 'bg-red-500 text-white border-red-600',
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
