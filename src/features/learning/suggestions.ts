import type { Piece } from '@/features/engine/pieces';
import { pieceAt, stickerColorOn, applyMoveToPieces } from '@/features/engine/pieces';
import { ALL_MOVES, FACE_TO_AXIS } from '@/shared/types/cube';
import type { MoveString, FaceName } from '@/shared/types/cube';

type Slot = [number, number, number];
type FacePair = [FaceName, FaceName];

const CENTER_BY_FACE: Record<FaceName, string> = {
  U: 'white',
  D: 'yellow',
  F: 'green',
  B: 'blue',
  R: 'red',
  L: 'orange',
};

const U_EDGE_SLOTS: Slot[] = [
  [0, 1, 1],
  [0, 1, -1],
  [1, 1, 0],
  [-1, 1, 0],
];
const U_EDGE_SIDE: Record<string, FaceName> = {
  '0,1,1': 'F',
  '0,1,-1': 'B',
  '1,1,0': 'R',
  '-1,1,0': 'L',
};

const U_CORNER_SLOTS: Slot[] = [
  [1, 1, 1],
  [-1, 1, 1],
  [1, 1, -1],
  [-1, 1, -1],
];
const U_CORNER_FACES: Record<string, FacePair> = {
  '1,1,1': ['F', 'R'],
  '-1,1,1': ['F', 'L'],
  '1,1,-1': ['B', 'R'],
  '-1,1,-1': ['B', 'L'],
};

const MID_SLOTS: Slot[] = [
  [1, 0, 1],
  [-1, 0, 1],
  [1, 0, -1],
  [-1, 0, -1],
];
const MID_FACES: Record<string, FacePair> = {
  '1,0,1': ['R', 'F'],
  '-1,0,1': ['L', 'F'],
  '1,0,-1': ['R', 'B'],
  '-1,0,-1': ['L', 'B'],
};

function whiteCross(pieces: Piece[]): number {
  let score = 0;
  for (const [x, y, z] of U_EDGE_SLOTS) {
    const piece = pieceAt(pieces, x, y, z);
    if (!piece) continue;
    const side = U_EDGE_SIDE[`${x},${y},${z}`];
    if (stickerColorOn(piece, 'U') === 'white' && stickerColorOn(piece, side) === CENTER_BY_FACE[side]) {
      score++;
    }
  }
  return score;
}

function whiteCorners(pieces: Piece[]): number {
  let score = 0;
  for (const [x, y, z] of U_CORNER_SLOTS) {
    const piece = pieceAt(pieces, x, y, z);
    if (!piece) continue;
    const [f1, f2] = U_CORNER_FACES[`${x},${y},${z}`];
    if (
      stickerColorOn(piece, 'U') === 'white' &&
      stickerColorOn(piece, f1) === CENTER_BY_FACE[f1] &&
      stickerColorOn(piece, f2) === CENTER_BY_FACE[f2]
    ) {
      score++;
    }
  }
  return score;
}

function middleLayer(pieces: Piece[]): number {
  let score = 0;
  for (const [x, y, z] of MID_SLOTS) {
    const piece = pieceAt(pieces, x, y, z);
    if (!piece) continue;
    const [f1, f2] = MID_FACES[`${x},${y},${z}`];
    if (
      stickerColorOn(piece, f1) === CENTER_BY_FACE[f1] &&
      stickerColorOn(piece, f2) === CENTER_BY_FACE[f2]
    ) {
      score++;
    }
  }
  return score;
}

function yellowOnU(pieces: Piece[]): number {
  let score = 0;
  const all = [...U_EDGE_SLOTS, ...U_CORNER_SLOTS];
  for (const [x, y, z] of all) {
    const piece = pieceAt(pieces, x, y, z);
    if (!piece) continue;
    if (stickerColorOn(piece, 'U') === 'yellow') score++;
  }
  return score;
}

function positionCorners(pieces: Piece[]): number {
  let score = 0;
  for (const [x, y, z] of U_CORNER_SLOTS) {
    const piece = pieceAt(pieces, x, y, z);
    if (!piece) continue;
    const [f1, f2] = U_CORNER_FACES[`${x},${y},${z}`];
    if (
      stickerColorOn(piece, f1) === CENTER_BY_FACE[f1] &&
      stickerColorOn(piece, f2) === CENTER_BY_FACE[f2]
    ) {
      score++;
    }
  }
  return score;
}

function permuteEdges(pieces: Piece[]): number {
  let score = 0;
  for (const [x, y, z] of U_EDGE_SLOTS) {
    const piece = pieceAt(pieces, x, y, z);
    if (!piece) continue;
    const side = U_EDGE_SIDE[`${x},${y},${z}`];
    if (stickerColorOn(piece, 'U') === 'yellow' && stickerColorOn(piece, side) === CENTER_BY_FACE[side]) {
      score++;
    }
  }
  return score;
}

interface BaseScorer {
  value: (pieces: Piece[]) => number;
  max: number;
}

const SCORERS: Record<string, BaseScorer> = {
  'white-cross': { value: whiteCross, max: 4 },
  'white-corners': { value: whiteCorners, max: 4 },
  'middle-layer': { value: middleLayer, max: 4 },
  'yellow-cross': { value: yellowOnU, max: 4 },
  'yellow-face': { value: yellowOnU, max: 8 },
  'position-corners': { value: positionCorners, max: 4 },
  'permute-edges': { value: permuteEdges, max: 4 },
};

function combined(a: BaseScorer, b: BaseScorer): BaseScorer {
  return {
    value: (pieces) => a.value(pieces) + b.value(pieces),
    max: a.max + b.max,
  };
}

const STAGE_SCOPE: Record<string, BaseScorer | BaseScorer[]> = {
  'white-cross': SCORERS['white-cross'],
  'white-corners': SCORERS['white-corners'],
  'middle-layer': SCORERS['middle-layer'],
  'yellow-cross': SCORERS['yellow-cross'],
  'yellow-face': SCORERS['yellow-face'],
  'position-corners': SCORERS['position-corners'],
  'permute-edges': SCORERS['permute-edges'],
  'cfop-cross': SCORERS['white-cross'],
  'cfop-f2l': [SCORERS['white-corners'], SCORERS['middle-layer']],
  'cfop-oll-2look': SCORERS['yellow-face'],
  'cfop-oll-full': SCORERS['yellow-face'],
  'cfop-pll-2look': [SCORERS['position-corners'], SCORERS['permute-edges']],
  'cfop-pll-full': [SCORERS['position-corners'], SCORERS['permute-edges']],
};

const RATIONALE: Record<string, string> = {
  'white-cross': 'Aim to get each white edge onto the top with its side color matched to its center.',
  'white-corners': 'Aim to slot each white corner home so its side colors match the adjacent centers.',
  'middle-layer': 'Aim to insert each middle edge so both of its colors match their centers.',
  'yellow-cross': 'Aim to orient the yellow edges into a cross on top.',
  'yellow-face': 'Aim to fill the entire top face with yellow.',
  'position-corners': 'Aim to put each yellow corner in its correct top position.',
  'permute-edges': 'Aim to cycle the yellow edges into their final correct spots.',
  cfop: 'Work toward this stage’s goal — see the progress bar for how close you are.',
};

function stageScorer(stageId: string): BaseScorer {
  const scope = STAGE_SCOPE[stageId];
  if (!scope) return { value: () => 0, max: 0 };
  if (Array.isArray(scope)) {
    return scope.reduce((acc, s) => combined(acc, s));
  }
  return scope;
}

function dirOf(move: MoveString): 1 | -1 | 2 {
  if (move.includes("'")) return -1;
  if (move.includes('2')) return 2;
  return 1;
}

export interface StageProgress {
  move: MoveString | null;
  moves: MoveString[];
  delta: number;
  value: number;
  max: number;
  rationale: string;
}

const MAX_SEQUENCE_LENGTH = 3;

function faceOf(move: MoveString): FaceName {
  return move[0] as FaceName;
}

function isRedundant(seq: MoveString[], move: MoveString): boolean {
  if (seq.length === 0) return false;
  const prev = seq[seq.length - 1];
  return faceOf(prev) === faceOf(move);
}

interface SearchState {
  pieces: Piece[];
  moves: MoveString[];
}

export function getStageProgress(stageId: string, pieces: Piece[]): StageProgress {
  const scorer = stageScorer(stageId);
  const current = scorer.value(pieces);
  const rationale = RATIONALE[stageId] ?? RATIONALE.cfop;

  if (current >= scorer.max) {
    return { move: null, moves: [], delta: 0, value: current, max: scorer.max, rationale };
  }

  const apply = (base: Piece[], move: MoveString): Piece[] =>
    applyMoveToPieces(base, FACE_TO_AXIS[faceOf(move)], dirOf(move));

  let bestSingle: MoveString | null = null;
  let bestSingleScore = current;

  let queue: SearchState[] = [{ pieces, moves: [] }];
  for (let depth = 1; depth <= MAX_SEQUENCE_LENGTH && queue.length > 0; depth++) {
    const nextLevel: SearchState[] = [];
    for (const { pieces: base, moves } of queue) {
      for (const move of ALL_MOVES) {
        if (isRedundant(moves, move)) continue;

        const next = apply(base, move);
        const score = scorer.value(next);

        if (depth === 1 && score > bestSingleScore) {
          bestSingleScore = score;
          bestSingle = move;
        }

        const seq = [...moves, move];
        if (score === scorer.max) {
          return {
            move: seq[0],
            moves: seq,
            delta: scorer.max - current,
            value: current,
            max: scorer.max,
            rationale,
          };
        }

        if (depth < MAX_SEQUENCE_LENGTH) {
          nextLevel.push({ pieces: next, moves: seq });
        }
      }
    }
    queue = nextLevel;
  }

  return {
    move: bestSingle,
    moves: bestSingle ? [bestSingle] : [],
    delta: bestSingleScore - current,
    value: current,
    max: scorer.max,
    rationale,
  };
}
