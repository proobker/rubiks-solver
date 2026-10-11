import React from 'react';
import { cn } from '@/lib/utils';
import type { MoveString, FaceName, RotationName, SliceName } from '@/shared/types/cube';

interface MoveButtonProps {
  move: MoveString;
  onClick: (move: MoveString) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const FACE_COLORS: Record<FaceName, string> = {
  U: 'bg-gradient-to-br from-white via-slate-100 to-slate-300 text-zinc-900 border-black/10',
  D: 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-zinc-900 border-black/10',
  F: 'bg-gradient-to-br from-green-400 via-green-500 to-green-600 text-white border-black/10',
  B: 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 text-white border-black/10',
  L: 'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 text-white border-black/10',
  R: 'bg-gradient-to-br from-red-400 via-red-500 to-red-600 text-white border-black/10',
};

const NEUTRAL_COLORS = 'bg-gradient-to-br from-zinc-600 to-zinc-800 text-zinc-50 border-white/10';

function colorsFor(move: MoveString): string {
  return FACE_COLORS[move[0] as FaceName] ?? NEUTRAL_COLORS;
}

const SIZE_CLASSES = {
  sm: 'w-9 h-9 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-12 h-12 text-base',
};

export const MoveButton: React.FC<MoveButtonProps> = ({ move, onClick, disabled = false, className, size = 'md' }) => (
  <button
    type="button"
    onClick={() => onClick(move)}
    disabled={disabled}
    aria-label={`Move ${move}`}
    className={cn(
      'keycap rounded-xl font-bold font-mono border hover:brightness-110',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      colorsFor(move),
      SIZE_CLASSES[size],
      className,
    )}
  >
    {move}
  </button>
);

interface MovePanelProps {
  onMove: (move: MoveString) => void;
  disabled?: boolean;
  showExtras?: boolean;
}

const FACES: FaceName[] = ['U', 'D', 'F', 'B', 'L', 'R'];
const ROTATION_NAMES: RotationName[] = ['x', 'y', 'z'];
const SLICE_NAMES: SliceName[] = ['M', 'E', 'S'];

const GroupLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">{children}</p>
);

export const MovePanel: React.FC<MovePanelProps> = ({ onMove, disabled = false, showExtras = true }) => (
  <div className="flex flex-col gap-4">
    <div>
      <GroupLabel>Faces</GroupLabel>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        {FACES.map((face) => (
          <div key={face} className="flex gap-1.5">
            {(['', "'", '2'] as const).map((suffix) => (
              <MoveButton
                key={suffix}
                move={`${face}${suffix}` as MoveString}
                onClick={onMove}
                disabled={disabled}
                className="flex-1 w-auto"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
    {showExtras && (
      <div className="grid grid-cols-2 gap-3">
        <div>
          <GroupLabel>Rotate cube</GroupLabel>
          <div className="grid grid-cols-2 gap-1.5">
            {ROTATION_NAMES.flatMap((r) => [r, `${r}'`] as MoveString[]).map((move) => (
              <MoveButton key={move} move={move} onClick={onMove} disabled={disabled} size="sm" className="w-auto" />
            ))}
          </div>
        </div>
        <div>
          <GroupLabel>Slices</GroupLabel>
          <div className="grid grid-cols-2 gap-1.5">
            {SLICE_NAMES.flatMap((s) => [s, `${s}'`] as MoveString[]).map((move) => (
              <MoveButton key={move} move={move} onClick={onMove} disabled={disabled} size="sm" className="w-auto" />
            ))}
          </div>
        </div>
      </div>
    )}
  </div>
);
