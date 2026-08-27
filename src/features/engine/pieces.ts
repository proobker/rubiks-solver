import type { CubeState, FaceName, FaceColor, MoveDirection } from '@/shared/types/cube';
import { SOLVED_STATE } from '@/shared/types/cube';

export type AxisVec = [number, number, number];

export interface PieceSticker {
  dir: AxisVec;
  color: FaceColor;
}

export interface Piece {
  id: number;
  position: [number, number, number];
  stickers: PieceSticker[];
}

export function buildSolvedPieces(): Piece[] {
  const pieces: Piece[] = [];
  let id = 0;

  const colorFor = (state: CubeState, face: 'U' | 'D' | 'F' | 'B' | 'L' | 'R'): FaceColor =>
    state[face][1][1];

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue;

        const stickers: PieceSticker[] = [];
        if (y === 1) stickers.push({ dir: [0, 1, 0], color: colorFor(SOLVED_STATE, 'U') });
        if (y === -1) stickers.push({ dir: [0, -1, 0], color: colorFor(SOLVED_STATE, 'D') });
        if (z === 1) stickers.push({ dir: [0, 0, 1], color: colorFor(SOLVED_STATE, 'F') });
        if (z === -1) stickers.push({ dir: [0, 0, -1], color: colorFor(SOLVED_STATE, 'B') });
        if (x === -1) stickers.push({ dir: [-1, 0, 0], color: colorFor(SOLVED_STATE, 'L') });
        if (x === 1) stickers.push({ dir: [1, 0, 0], color: colorFor(SOLVED_STATE, 'R') });

        pieces.push({ id: id++, position: [x, y, z], stickers });
      }
    }
  }

  return pieces;
}

export function clonePieces(pieces: Piece[]): Piece[] {
  return pieces.map((piece) => ({
    id: piece.id,
    position: [...piece.position] as [number, number, number],
    stickers: piece.stickers.map((s) => ({ dir: [...s.dir] as AxisVec, color: s.color })),
  }));
}

function rotX(p: AxisVec, a: number): AxisVec {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
}

function rotY(p: AxisVec, a: number): AxisVec {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
}

function rotZ(p: AxisVec, a: number): AxisVec {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]];
}

function angleFor(direction: MoveDirection): number {
  if (direction === 2) return Math.PI;
  return direction === 1 ? -Math.PI / 2 : Math.PI / 2;
}

function onSlice(position: [number, number, number], axis: AxisVec): boolean {
  for (let i = 0; i < 3; i++) {
    if (axis[i] !== 0) return position[i] === axis[i];
  }
  return false;
}

function snap(v: [number, number, number]): [number, number, number] {
  return [Math.round(v[0]), Math.round(v[1]), Math.round(v[2])];
}

export function applyMoveToPieces(
  pieces: Piece[],
  axis: AxisVec,
  direction: MoveDirection,
): Piece[] {
  let rotate: ((p: AxisVec, a: number) => AxisVec) | null = null;
  let sign = 1;

  if (axis[0] !== 0) {
    rotate = rotX;
    sign = axis[0];
  } else if (axis[1] !== 0) {
    rotate = rotY;
    sign = axis[1];
  } else if (axis[2] !== 0) {
    rotate = rotZ;
    sign = axis[2];
  }

  if (!rotate) return clonePieces(pieces);

  const theta = angleFor(direction) * sign;
  const next = clonePieces(pieces);

  for (const piece of next) {
    if (!onSlice(piece.position, axis)) continue;
    piece.position = snap(rotate(piece.position, theta));
    for (const sticker of piece.stickers) {
      sticker.dir = snap(rotate(sticker.dir, theta));
    }
  }

  return next;
}

export function applyMovesToPieces(
  pieces: Piece[],
  moves: Array<{ axis: AxisVec; direction: MoveDirection }>,
): Piece[] {
  return moves.reduce((current, { axis, direction }) => applyMoveToPieces(current, axis, direction), pieces);
}

const DIRS: AxisVec[] = [
  [1, 0, 0], [-1, 0, 0],
  [0, 1, 0], [0, -1, 0],
  [0, 0, 1], [0, 0, -1],
];

function sameVec(a: AxisVec, b: AxisVec): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

const DIR_TO_FACE: Record<string, FaceName> = {
  '1,0,0': 'R', '-1,0,0': 'L',
  '0,1,0': 'U', '0,-1,0': 'D',
  '0,0,1': 'F', '0,0,-1': 'B',
};

export function stickerFace(dir: AxisVec): FaceName | undefined {
  return DIR_TO_FACE[`${dir[0]},${dir[1]},${dir[2]}`];
}

export function stickerColorOn(piece: Piece, face: FaceName): FaceColor | undefined {
  const sticker = piece.stickers.find((s) => stickerFace(s.dir) === face);
  return sticker?.color;
}

export function pieceAt(pieces: Piece[], x: number, y: number, z: number): Piece | undefined {
  return pieces.find((p) => p.position[0] === x && p.position[1] === y && p.position[2] === z);
}

export function piecesOnFace(pieces: Piece[], face: FaceName): Piece[] {
  const [fx, fy, fz] = { U: [0, 1, 0], D: [0, -1, 0], F: [0, 0, 1], B: [0, 0, -1], L: [-1, 0, 0], R: [1, 0, 0] }[face];
  return pieces.filter((p) => {
    for (let i = 0; i < 3; i++) if ([fx, fy, fz][i] !== 0) return p.position[i] === [fx, fy, fz][i];
    return false;
  });
}

export function hasAxis(dir: AxisVec): boolean {
  return DIRS.some((d) => sameVec(d, dir));
}

