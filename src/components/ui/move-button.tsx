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

const FACE_SWATCH: Partial<Record<string, string>> = {
  U: 'bg-cube-white',
  D: 'bg-cube-yellow',
  F: 'bg-cube-green',
  B: 'bg-cube-blue',
  L: 'bg-cube-orange',
  R: 'bg-cube-red',
};

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
      'relative overflow-hidden rounded-md font-medium font-mono border border-zinc-800 bg-zinc-900 text-zinc-50 transition-colors',
      'hover:bg-zinc-800 hover:border-zinc-700 active:bg-zinc-700',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      SIZE_CLASSES[size],
      className,
    )}
  >
    {FACE_SWATCH[move[0]] && <span aria-hidden className={cn('absolute inset-x-0 top-0 h-[3px]', FACE_SWATCH[move[0]])} />}
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
  <p className="text-xs font-medium text-zinc-400 mb-2">{children}</p>
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
