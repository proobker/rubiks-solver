import type { CubeState, FaceName, FaceColor, MoveDirection, MoveSpec, MoveString, Vec3 } from '@/shared/types/cube';
import { SOLVED_STATE, moveSpec } from '@/shared/types/cube';

export type AxisVec = Vec3;

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

function axisIndex(axis: AxisVec): number {
  return axis[0] !== 0 ? 0 : axis[1] !== 0 ? 1 : 2;
}

export function inMove(position: AxisVec, spec: MoveSpec): boolean {
  return spec.layers.includes(position[axisIndex(spec.axis)]);
}

function snap(v: [number, number, number]): [number, number, number] {
  return [Math.round(v[0]), Math.round(v[1]), Math.round(v[2])];
}

export function rotateVec(v: AxisVec, spec: MoveSpec): AxisVec {
  const i = axisIndex(spec.axis);
  const theta = angleFor(spec.direction) * spec.axis[i];
  const rotate = i === 0 ? rotX : i === 1 ? rotY : rotZ;
  return snap(rotate(v, theta));
}

export function applyMoveToPieces(pieces: Piece[], spec: MoveSpec): Piece[] {
  const next = clonePieces(pieces);
  for (const piece of next) {
    if (!inMove(piece.position, spec)) continue;
    piece.position = rotateVec(piece.position, spec);
    for (const sticker of piece.stickers) {
      sticker.dir = rotateVec(sticker.dir, spec);
    }
  }
  return next;
}

export function applyMovesToPieces(pieces: Piece[], moves: MoveString[]): Piece[] {
  return moves.reduce((current, move) => applyMoveToPieces(current, moveSpec(move)), pieces);
}

export function piecesInMove(pieces: Piece[], spec: MoveSpec): Piece[] {
  return pieces.filter((p) => inMove(p.position, spec));
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

const FACE_DIR: Record<FaceName, AxisVec> = {
  U: [0, 1, 0], D: [0, -1, 0], F: [0, 0, 1], B: [0, 0, -1], L: [-1, 0, 0], R: [1, 0, 0],
};

// Singmaster net layout: maps a grid cell (face, row, col) of CubeState to the
// 3D slot holding that sticker. Must stay consistent with clockwiseCycle in moves.ts.
export function faceletPosition(face: FaceName, row: number, col: number): AxisVec {
  const a = row - 1;
  const b = col - 1;
  switch (face) {
    case 'U': return [b, 1, a];
    case 'D': return [b, -1, -a];
    case 'F': return [b, -a, 1];
    case 'B': return [-b, -a, -1];
    case 'L': return [-1, -a, b];
    case 'R': return [1, -a, -b];
  }
}

export function faceletCell(face: FaceName, position: AxisVec): [number, number] {
  const [x, y, z] = position;
  switch (face) {
    case 'U': return [z + 1, x + 1];
    case 'D': return [1 - z, x + 1];
    case 'F': return [1 - y, x + 1];
    case 'B': return [1 - y, 1 - x];
    case 'L': return [1 - y, z + 1];
    case 'R': return [1 - y, 1 - z];
  }
}

export function faceDir(face: FaceName): AxisVec {
  return FACE_DIR[face];
}

export function piecesToState(pieces: Piece[]): CubeState {
  const grid = (): FaceColor[][] => [0, 1, 2].map(() => ['white', 'white', 'white'] as FaceColor[]);
  const state: CubeState = { U: grid(), D: grid(), F: grid(), B: grid(), L: grid(), R: grid() };
  for (const piece of pieces) {
    for (const sticker of piece.stickers) {
      const face = stickerFace(sticker.dir);
      if (!face) continue;
      const [row, col] = faceletCell(face, piece.position);
      state[face][row][col] = sticker.color;
    }
  }
  return state;
}
