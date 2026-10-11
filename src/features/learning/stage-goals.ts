import type { MoveString } from '@/shared/types/cube';
import { invertAlgorithm, parseAlgorithm } from '@/features/engine/moves';
import { generateScramble } from '@/features/engine/scramble';
import type { Facelets, Slot } from './facelets';
import {
  ALL_SLOTS,
  CORNER_SLOTS,
  EDGE_SLOTS,
  WHITE,
  YELLOW,
  applyFaceletMoves,
  slotHas,
  slotOriented,
  slotSolved,
  solvedFacelets,
} from './facelets';

type Count = (f: Facelets) => number;

const isWhite = (f: Facelets, s: Slot) => slotHas(f, s, WHITE);
const isYellow = (f: Facelets, s: Slot) => slotHas(f, s, YELLOW);
const isMiddle = (f: Facelets, s: Slot) => !isWhite(f, s) && !isYellow(f, s);

function countSlots(slots: Slot[], belongs: (f: Facelets, s: Slot) => boolean, done: (f: Facelets, s: Slot) => boolean): Count {
  return (f) => slots.filter((s) => belongs(f, s) && done(f, s)).length;
}

function pendingSlots(slots: Slot[], belongs: (f: Facelets, s: Slot) => boolean, done: (f: Facelets, s: Slot) => boolean) {
  return (f: Facelets) =>
    slots.flatMap((s) => (belongs(f, s) && !done(f, s) ? [ALL_SLOTS.indexOf(s)] : []));
}

const orientedYellow = (f: Facelets, s: Slot) => slotOriented(f, s, YELLOW);

const crossCount = countSlots(EDGE_SLOTS, isWhite, slotSolved);
const whiteCornerCount = countSlots(CORNER_SLOTS, isWhite, slotSolved);
const middleCount = countSlots(EDGE_SLOTS, isMiddle, slotSolved);
const llEdgesOriented = countSlots(EDGE_SLOTS, isYellow, orientedYellow);
const llCornersOriented = countSlots(CORNER_SLOTS, isYellow, orientedYellow);
const llCornersSolved = countSlots(CORNER_SLOTS, isYellow, slotSolved);
const llEdgesSolved = countSlots(EDGE_SLOTS, isYellow, slotSolved);

const crossDone = (f: Facelets) => crossCount(f) === 4;
const firstLayerDone = (f: Facelets) => crossDone(f) && whiteCornerCount(f) === 4;
const f2lDone = (f: Facelets) => firstLayerDone(f) && middleCount(f) === 4;
const llOriented = (f: Facelets) => llEdgesOriented(f) === 4 && llCornersOriented(f) === 4;

export type HintMode = 'search' | 'macros';

export interface StageGoal {
  prereq: (f: Facelets) => boolean;
  progress: Count;
  max: number;
  /** Color the learner should hold on top, or null if any orientation works. */
  preferredTop: number | null;
  /** Slot indices (into ALL_SLOTS) of pieces this stage still has to solve. */
  targets: (f: Facelets) => number[];
  hintMode: HintMode;
  /** Extra stages whose algorithms the hint engine may also use. */
  borrowAlgorithmsFrom?: string[];
  /** Simpler stages to hint from when no direct hint is found (e.g. beginner-style F2L). */
  fallbackStages?: string[];
  setup: () => MoveString[];
}

const AUF = ['U', "U'", 'U2'];
const Y = ['y', "y'", 'y2'];

const CROSS_PRESERVING = ['R', 'L', 'F', 'B'].flatMap((face) =>
  ['', "'"].flatMap((dir) => {
    const inverse = dir ? face : `${face}'`;
    return AUF.map((u) => `${face}${dir} ${u} ${inverse}`);
  }),
);

const ALG = {
  insertRight: "U R U' R' U' F' U F",
  insertLeft: "U' L' U L U F U' F'",
  edgeFlip: "F R U R' U' F'",
  sune: "R U R' U R U2 R'",
  antiSune: "R U2 R' U' R U' R'",
  aPerm: "R' F R' B2 R F' R' B2 R2",
  yPerm: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
  tPerm: "R U R' U' R' F R2 U' R' U' R U R' F'",
  ua: "R U' R U R U R U' R' U' R2",
  ub: "R2 U R U R' U' R' U' R' U R'",
  h: 'M2 U M2 U2 M2 U M2',
  z: "M' U M2 U M2 U M' U2 M2",
};

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomMacros(generators: string[], count: number): MoveString[] {
  const moves: MoveString[] = [];
  for (let i = 0; i < count; i++) {
    const alg = parseAlgorithm(pick(generators));
    moves.push(...(Math.random() < 0.5 ? alg : invertAlgorithm(alg)));
  }
  return moves;
}

function macroSetup(generators: string[], min: number, max: number): () => MoveString[] {
  return () => ['z2', ...randomMacros(generators, min + Math.floor(Math.random() * (max - min + 1)))];
}

const scrambleSetup = () => generateScramble(25);

const cornersGenerators = [...CROSS_PRESERVING, ...AUF];
const middleGenerators = [ALG.insertRight, ALG.insertLeft, ...AUF, ...Y];
const llAll = [ALG.edgeFlip, ALG.sune, ALG.antiSune, ALG.aPerm, ALG.ua, ...AUF, ...Y];
const keepsEdgeOrientation = [ALG.sune, ALG.antiSune, ALG.aPerm, ALG.ua, ALG.ub, ...AUF, ...Y];
const keepsOrientation = [ALG.aPerm, ALG.yPerm, ALG.tPerm, ALG.ua, ALG.ub, ALG.h, ALG.z, ...AUF, ...Y];
const keepsCorners = [ALG.ua, ALG.ub, ALG.h, ALG.z, ...Y];

const cross = {
  progress: crossCount,
  max: 4,
  targets: pendingSlots(EDGE_SLOTS, isWhite, slotSolved),
  hintMode: 'search' as const,
  setup: scrambleSetup,
};

const yellowFace = {
  prereq: f2lDone,
  progress: (f: Facelets) => llEdgesOriented(f) + llCornersOriented(f),
  max: 8,
  preferredTop: YELLOW,
  targets: pendingSlots(ALL_SLOTS, isYellow, orientedYellow),
  hintMode: 'macros' as const,
  setup: macroSetup(llAll, 6, 10),
};

const pll = {
  prereq: (f: Facelets) => f2lDone(f) && llOriented(f),
  progress: (f: Facelets) => llCornersSolved(f) + llEdgesSolved(f),
  max: 8,
  preferredTop: YELLOW,
  targets: pendingSlots(ALL_SLOTS, isYellow, slotSolved),
  hintMode: 'macros' as const,
  setup: macroSetup(keepsOrientation, 5, 8),
};

export const STAGE_GOALS: Record<string, StageGoal> = {
  'white-cross': { ...cross, prereq: () => true, preferredTop: null },
  'white-corners': {
    prereq: crossDone,
    progress: whiteCornerCount,
    max: 4,
    preferredTop: YELLOW,
    targets: pendingSlots(CORNER_SLOTS, isWhite, slotSolved),
    hintMode: 'macros',
    setup: macroSetup(cornersGenerators, 10, 14),
  },
  'middle-layer': {
    prereq: firstLayerDone,
    progress: middleCount,
    max: 4,
    preferredTop: YELLOW,
    targets: pendingSlots(EDGE_SLOTS, isMiddle, slotSolved),
    hintMode: 'macros',
    setup: macroSetup(middleGenerators, 8, 12),
  },
  'yellow-cross': {
    prereq: f2lDone,
    progress: llEdgesOriented,
    max: 4,
    preferredTop: YELLOW,
    targets: pendingSlots(EDGE_SLOTS, isYellow, orientedYellow),
    hintMode: 'macros',
    setup: macroSetup(llAll, 6, 10),
  },
  'yellow-face': {
    prereq: (f) => f2lDone(f) && llEdgesOriented(f) === 4,
    progress: llCornersOriented,
    max: 4,
    preferredTop: YELLOW,
    targets: pendingSlots(CORNER_SLOTS, isYellow, orientedYellow),
    hintMode: 'macros',
    setup: macroSetup(keepsEdgeOrientation, 6, 10),
  },
  'position-corners': {
    prereq: (f) => f2lDone(f) && llOriented(f),
    progress: llCornersSolved,
    max: 4,
    preferredTop: YELLOW,
    targets: pendingSlots(CORNER_SLOTS, isYellow, slotSolved),
    hintMode: 'macros',
    setup: macroSetup(keepsOrientation, 5, 8),
  },
  'permute-edges': {
    prereq: (f) => f2lDone(f) && llOriented(f) && llCornersSolved(f) === 4,
    progress: llEdgesSolved,
    max: 4,
    preferredTop: YELLOW,
    targets: pendingSlots(EDGE_SLOTS, isYellow, slotSolved),
    hintMode: 'macros',
    setup: macroSetup(keepsCorners, 3, 6),
  },
  'cfop-cross': { ...cross, prereq: () => true, preferredTop: null },
  'cfop-f2l': {
    prereq: crossDone,
    progress: (f) => whiteCornerCount(f) + middleCount(f),
    max: 8,
    preferredTop: YELLOW,
    targets: (f) => [
      ...pendingSlots(CORNER_SLOTS, isWhite, slotSolved)(f),
      ...pendingSlots(EDGE_SLOTS, isMiddle, slotSolved)(f),
    ],
    hintMode: 'macros',
    borrowAlgorithmsFrom: ['white-corners', 'middle-layer'],
    fallbackStages: ['white-corners', 'middle-layer'],
    setup: macroSetup(cornersGenerators, 10, 14),
  },
  'cfop-oll-2look': yellowFace,
  'cfop-oll-full': { ...yellowFace, borrowAlgorithmsFrom: ['cfop-oll-2look'] },
  'cfop-pll-2look': pll,
  'cfop-pll-full': { ...pll, borrowAlgorithmsFrom: ['cfop-pll-2look'] },
};

export function stageGoal(stageId: string): StageGoal | undefined {
  return STAGE_GOALS[stageId];
}

export interface StageStatus {
  prereq: boolean;
  progress: number;
  max: number;
  complete: boolean;
}

export function stageStatus(stageId: string, f: Facelets): StageStatus {
  const goal = STAGE_GOALS[stageId];
  if (!goal) return { prereq: true, progress: 0, max: 0, complete: false };
  const prereq = goal.prereq(f);
  const progress = goal.progress(f);
  return { prereq, progress, max: goal.max, complete: prereq && progress === goal.max };
}

const MAX_SETUP_ATTEMPTS = 200;

export function generateStageSetup(stageId: string): MoveString[] {
  const goal = STAGE_GOALS[stageId];
  if (!goal) return scrambleSetup();
  let fallback: MoveString[] = [];
  for (let attempt = 0; attempt < MAX_SETUP_ATTEMPTS; attempt++) {
    const moves = goal.setup();
    const f = applyFaceletMoves(solvedFacelets(), moves);
    if (!goal.prereq(f)) continue;
    const progress = goal.progress(f);
    if (progress < goal.max) fallback = moves;
    if (progress <= goal.max / 2) return moves;
  }
  return fallback;
}
