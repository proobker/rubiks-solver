import type { FaceColor, FaceName, MoveString } from '@/shared/types/cube';
import { FACE_NAMES, ALL_MOVES, ROTATIONS, moveSpec } from '@/shared/types/cube';
import type { AxisVec, Piece } from '@/features/engine/pieces';
import {
  faceDir,
  faceletCell,
  faceletPosition,
  inMove,
  piecesToState,
  rotateVec,
  stickerFace,
} from '@/features/engine/pieces';

export type Facelets = Uint8Array;
export type Slot = number[];

export const COLORS: FaceColor[] = ['white', 'yellow', 'green', 'blue', 'orange', 'red'];
export const COLOR_INDEX: Record<FaceColor, number> = {
  white: 0, yellow: 1, green: 2, blue: 3, orange: 4, red: 5,
};
export const WHITE = COLOR_INDEX.white;
export const YELLOW = COLOR_INDEX.yellow;

export function faceletIndex(face: FaceName, row: number, col: number): number {
  return FACE_NAMES.indexOf(face) * 9 + row * 3 + col;
}

export const FACE_OF = Array.from({ length: 54 }, (_, i) => FACE_NAMES[Math.floor(i / 9)]);
export const CENTER_OF = Array.from({ length: 54 }, (_, i) => Math.floor(i / 9) * 9 + 4);

const POSITION_OF: AxisVec[] = Array.from({ length: 54 }, (_, i) =>
  faceletPosition(FACE_OF[i], Math.floor((i % 9) / 3), i % 3),
);

function posKey(p: AxisVec): string {
  return p.join(',');
}

function buildSlots(nonZero: number): { slots: Slot[]; positions: AxisVec[] } {
  const byPos = new Map<string, number[]>();
  POSITION_OF.forEach((p, i) => {
    if (p.filter((v) => v !== 0).length !== nonZero) return;
    const key = posKey(p);
    byPos.set(key, [...(byPos.get(key) ?? []), i]);
  });
  const positions = [...byPos.keys()].map((k) => k.split(',').map(Number) as AxisVec);
  return { slots: [...byPos.values()], positions };
}

const edges = buildSlots(2);
const corners = buildSlots(3);
export const EDGE_SLOTS = edges.slots;
export const CORNER_SLOTS = corners.slots;
export const ALL_SLOTS: Slot[] = [...EDGE_SLOTS, ...CORNER_SLOTS];
export const SLOT_POSITIONS: AxisVec[] = [...edges.positions, ...corners.positions];

function compilePerm(move: MoveString): Uint8Array {
  const spec = moveSpec(move);
  const dest = new Uint8Array(54);
  for (let i = 0; i < 54; i++) {
    const position = POSITION_OF[i];
    if (!inMove(position, spec)) {
      dest[i] = i;
      continue;
    }
    const face = stickerFace(rotateVec(faceDir(FACE_OF[i]), spec))!;
    const [row, col] = faceletCell(face, rotateVec(position, spec));
    dest[i] = faceletIndex(face, row, col);
  }
  return dest;
}

const PERM_CACHE = new Map<MoveString, Uint8Array>();

export function movePerm(move: MoveString): Uint8Array {
  let perm = PERM_CACHE.get(move);
  if (!perm) {
    perm = compilePerm(move);
    PERM_CACHE.set(move, perm);
  }
  return perm;
}

for (const move of [...ALL_MOVES, ...ROTATIONS]) movePerm(move);

export function applyPerm(f: Facelets, dest: Uint8Array): Facelets {
  const out = new Uint8Array(54);
  for (let i = 0; i < 54; i++) out[dest[i]] = f[i];
  return out;
}

export function applyFaceletMove(f: Facelets, move: MoveString): Facelets {
  return applyPerm(f, movePerm(move));
}

export function applyFaceletMoves(f: Facelets, moves: MoveString[]): Facelets {
  return moves.reduce(applyFaceletMove, f);
}

export function solvedFacelets(): Facelets {
  const f = new Uint8Array(54);
  const centers: Record<FaceName, FaceColor> = {
    U: 'white', D: 'yellow', F: 'green', B: 'blue', L: 'orange', R: 'red',
  };
  for (let i = 0; i < 54; i++) f[i] = COLOR_INDEX[centers[FACE_OF[i]]];
  return f;
}

export function piecesToFacelets(pieces: Piece[]): Facelets {
  const state = piecesToState(pieces);
  const f = new Uint8Array(54);
  for (const face of FACE_NAMES) {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        f[faceletIndex(face, row, col)] = COLOR_INDEX[state[face][row][col]];
      }
    }
  }
  return f;
}

export function stickerHome(f: Facelets, i: number): boolean {
  return f[i] === f[CENTER_OF[i]];
}

export function slotSolved(f: Facelets, slot: Slot): boolean {
  return slot.every((i) => stickerHome(f, i));
}

export function slotHas(f: Facelets, slot: Slot, color: number): boolean {
  return slot.some((i) => f[i] === color);
}

export function slotOriented(f: Facelets, slot: Slot, color: number): boolean {
  return slot.some((i) => f[i] === color && f[CENTER_OF[i]] === color);
}

export function topColor(f: Facelets): number {
  return f[faceletIndex('U', 1, 1)];
}

export function slotPieceId(pieces: Piece[], slotIndex: number): number | undefined {
  const [x, y, z] = SLOT_POSITIONS[slotIndex];
  return pieces.find((p) => p.position[0] === x && p.position[1] === y && p.position[2] === z)?.id;
}
