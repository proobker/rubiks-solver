import React, { useMemo } from 'react';
import type { FaceName, MoveString } from '@/shared/types/cube';
import { COLOR_TO_HEX } from '@/shared/types/cube';
import { invertAlgorithm } from '@/features/engine/moves';
import { COLORS, YELLOW, applyFaceletMoves, faceletIndex, solvedFacelets } from './facelets';

interface CaseDiagramProps {
  /** Algorithm that solves the case; the diagram shows the state it solves. */
  moves: MoveString[];
  /** 'oll' greys out everything except yellow. */
  mode?: 'oll' | 'full';
  size?: number;
}

const GREY = '#3f3f46';
const CELL = 10;
const STRIP = 4;
const GAP = 1;

type Sticker = { x: number; y: number; w: number; h: number; face: FaceName; row: number; col: number };

const OFFSET = STRIP + GAP * 2;

const STICKERS: Sticker[] = [
  ...[0, 1, 2].flatMap((row) =>
    [0, 1, 2].map((col) => ({
      x: OFFSET + col * (CELL + GAP), y: OFFSET + row * (CELL + GAP), w: CELL, h: CELL, face: 'U' as const, row, col,
    })),
  ),
  ...[0, 1, 2].map((i) => ({
    x: OFFSET + i * (CELL + GAP), y: 0, w: CELL, h: STRIP, face: 'B' as const, row: 0, col: 2 - i,
  })),
  ...[0, 1, 2].map((i) => ({
    x: OFFSET + i * (CELL + GAP), y: OFFSET + 3 * (CELL + GAP) + GAP, w: CELL, h: STRIP, face: 'F' as const, row: 0, col: i,
  })),
  ...[0, 1, 2].map((i) => ({
    x: 0, y: OFFSET + i * (CELL + GAP), w: STRIP, h: CELL, face: 'L' as const, row: 0, col: i,
  })),
  ...[0, 1, 2].map((i) => ({
    x: OFFSET + 3 * (CELL + GAP) + GAP, y: OFFSET + i * (CELL + GAP), w: STRIP, h: CELL, face: 'R' as const, row: 0, col: 2 - i,
  })),
];

const VIEW = OFFSET * 2 + 3 * CELL + 2 * GAP;

export const CaseDiagram: React.FC<CaseDiagramProps> = ({ moves, mode = 'full', size = 56 }) => {
  const facelets = useMemo(
    () => applyFaceletMoves(solvedFacelets(), ['z2', ...invertAlgorithm(moves)]),
    [moves],
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      role="img"
      aria-label="Top view of the case"
      className="shrink-0"
    >
      {STICKERS.map((s) => {
        const color = facelets[faceletIndex(s.face, s.row, s.col)];
        const fill = mode === 'oll' && color !== YELLOW ? GREY : COLOR_TO_HEX[COLORS[color]];
        return (
          <rect key={`${s.face}${s.row}${s.col}`} x={s.x} y={s.y} width={s.w} height={s.h} rx={1.2} fill={fill} />
        );
      })}
    </svg>
  );
};
