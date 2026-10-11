import type { MoveString } from '@/shared/types/cube';
import { ALL_MOVES, moveBase } from '@/shared/types/cube';
import type { Piece } from '@/features/engine/pieces';
import type { Facelets } from './facelets';
import {
  COLORS,
  EDGE_SLOTS,
  WHITE,
  applyFaceletMoves,
  applyPerm,
  movePerm,
  piecesToFacelets,
  slotHas,
  slotSolved,
  topColor,
} from './facelets';
import type { StageGoal } from './stage-goals';
import { STAGE_GOALS } from './stage-goals';
import type { DrillItem } from './stages';
import { stageById, stageItems } from './stages';

export type HintStepKind = 'rotate' | 'auf' | 'alg' | 'moves';

export interface HintStep {
  kind: HintStepKind;
  moves: MoveString[];
  label: string;
}

export type HintStatus = 'done' | 'prereq' | 'reorient' | 'hint' | 'stuck';

export interface StageHint {
  status: HintStatus;
  steps: HintStep[];
  explanation: string;
  gain: number;
}

const OPPOSITE_AXIS: Record<string, string> = { U: 'D', D: 'U', F: 'B', B: 'F', L: 'R', R: 'L' };
const SEARCH_DEPTH = 5;
const NODE_LIMIT = 1_500_000;

export function reorientMove(f: Facelets, color: number): MoveString | null {
  if (topColor(f) === color) return null;
  for (const rotation of ['z2', 'x2', 'x', "x'", 'z', "z'"] as MoveString[]) {
    if (topColor(applyFaceletMoves(f, [rotation])) === color) return rotation;
  }
  return null;
}

function reorientHint(f: Facelets, color: number): StageHint | null {
  const rotation = reorientMove(f, color);
  if (!rotation) return null;
  return {
    status: 'reorient',
    steps: [{ kind: 'rotate', moves: [rotation], label: `Rotate ${rotation}` }],
    explanation: `Hold the cube with ${COLORS[color]} on top for this stage.`,
    gain: 0,
  };
}

function searchMoves(f: Facelets, goal: StageGoal): MoveString[] | null {
  const current = goal.progress(f);
  const keep = EDGE_SLOTS.filter((s) => slotHas(f, s, WHITE) && slotSolved(f, s));
  const path: MoveString[] = [];
  let nodes = 0;

  const dfs = (state: Facelets, depth: number): boolean => {
    if (depth === 0) {
      return goal.progress(state) > current && keep.every((s) => slotSolved(state, s));
    }
    for (const move of ALL_MOVES) {
      const face = moveBase(move);
      const prev = path.length > 0 ? moveBase(path[path.length - 1]) : null;
      if (prev === face) continue;
      if (prev && OPPOSITE_AXIS[prev] === face && prev > face) continue;
      if (++nodes > NODE_LIMIT) return false;
      path.push(move);
      if (dfs(applyPerm(state, movePerm(move)), depth - 1)) return true;
      path.pop();
    }
    return false;
  };

  for (let depth = 1; depth <= SEARCH_DEPTH; depth++) {
    if (dfs(f, depth)) return [...path];
    if (nodes > NODE_LIMIT) break;
  }
  return null;
}

interface Macro {
  steps: HintStep[];
  moves: MoveString[];
}

function buildMacros(items: DrillItem[]): Macro[] {
  const rotations: (MoveString | null)[] = [null, 'y', "y'", 'y2'];
  const aufs: (MoveString | null)[] = [null, 'U', "U'", 'U2'];
  const macros: Macro[] = [];
  for (const rotation of rotations) {
    for (const auf of aufs) {
      for (const item of items) {
        for (let reps = 1; reps <= item.repeat; reps++) {
          const steps: HintStep[] = [];
          if (rotation) steps.push({ kind: 'rotate', moves: [rotation], label: `Rotate ${rotation}` });
          if (auf) steps.push({ kind: 'auf', moves: [auf], label: `Turn ${auf}` });
          const algMoves = Array.from({ length: reps }, () => item.moves).flat();
          steps.push({ kind: 'alg', moves: algMoves, label: reps > 1 ? `${item.name} ×${reps}` : item.name });
          macros.push({ steps, moves: steps.flatMap((s) => s.moves) });
        }
      }
    }
  }
  return macros;
}

function itemsFor(stageId: string, goal: StageGoal): DrillItem[] {
  const ids = [stageId, ...(goal.borrowAlgorithmsFrom ?? [])];
  const seen = new Set<string>();
  return ids
    .flatMap((id) => {
      const stage = stageById(id);
      return stage ? stageItems(stage) : [];
    })
    .filter((item) => {
      if (seen.has(item.notation)) return false;
      seen.add(item.notation);
      return true;
    });
}

interface Candidate {
  steps: HintStep[];
  gain: number;
  length: number;
}

function better(a: Candidate, b: Candidate | null): boolean {
  if (!b) return true;
  if (a.gain !== b.gain) return a.gain > b.gain;
  return a.length < b.length;
}

function searchMacros(f: Facelets, goal: StageGoal, macros: Macro[]): Candidate | null {
  const current = goal.progress(f);
  const results = macros.map((macro) => {
    const next = applyFaceletMoves(f, macro.moves);
    return { macro, next, ok: goal.prereq(next), gain: goal.progress(next) - current };
  });

  let best: Candidate | null = null;
  for (const r of results) {
    if (!r.ok || r.gain <= 0) continue;
    const candidate = { steps: r.macro.steps, gain: r.gain, length: r.macro.moves.length };
    if (better(candidate, best)) best = candidate;
  }
  if (best) return best;

  for (const first of results) {
    if (!first.ok) continue;
    for (const second of macros) {
      const next = applyFaceletMoves(first.next, second.moves);
      if (!goal.prereq(next)) continue;
      const gain = goal.progress(next) - current;
      if (gain <= 0) continue;
      const candidate = {
        steps: [...first.macro.steps, ...second.steps],
        gain,
        length: first.macro.moves.length + second.moves.length,
      };
      if (better(candidate, best)) best = candidate;
    }
  }
  return best;
}

function describe(gain: number, steps: HintStep[]): string {
  const algs = steps.filter((s) => s.kind === 'alg').map((s) => s.label);
  const what = algs.length > 0 ? `Use ${algs.join(', then ')}. ` : '';
  return `${what}Solves ${gain} more piece${gain === 1 ? '' : 's'} for this stage.`;
}

export function getStageHint(stageId: string, pieces: Piece[]): StageHint {
  const goal = STAGE_GOALS[stageId];
  if (!goal) return { status: 'stuck', steps: [], explanation: 'No hints for this stage.', gain: 0 };

  const f = piecesToFacelets(pieces);
  if (!goal.prereq(f)) {
    return {
      status: 'prereq',
      steps: [],
      explanation: 'Earlier stages are not solved yet. Finish them first, or set up a practice position.',
      gain: 0,
    };
  }
  if (goal.progress(f) >= goal.max) {
    return { status: 'done', steps: [], explanation: 'Stage complete!', gain: 0 };
  }
  if (goal.preferredTop !== null) {
    const reorient = reorientHint(f, goal.preferredTop);
    if (reorient) return reorient;
  }

  if (goal.hintMode === 'search') {
    const moves = searchMoves(f, goal);
    if (!moves) {
      return {
        status: 'stuck',
        steps: [],
        explanation: 'No short sequence found. Try bringing a target piece into the top or bottom layer first.',
        gain: 0,
      };
    }
    const gain = goal.progress(applyFaceletMoves(f, moves)) - goal.progress(f);
    return {
      status: 'hint',
      steps: [{ kind: 'moves', moves, label: 'Moves' }],
      explanation: `Solves ${gain} more piece${gain === 1 ? '' : 's'} without breaking what's done.`,
      gain,
    };
  }

  const best = searchMacros(f, goal, buildMacros(itemsFor(stageId, goal)));
  if (!best) {
    for (const fallbackId of goal.fallbackStages ?? []) {
      const fallback = STAGE_GOALS[fallbackId];
      if (!fallback.prereq(f) || fallback.progress(f) >= fallback.max) continue;
      const hint = getStageHint(fallbackId, pieces);
      if (hint.status === 'hint') {
        const name = stageById(fallbackId)?.name ?? fallbackId;
        return { ...hint, explanation: `Beginner-style step (${name}): ${hint.explanation}` };
      }
    }
    return {
      status: 'stuck',
      steps: [],
      explanation: 'No known algorithm makes progress from here. Try a few U turns, or set up a new practice position.',
      gain: 0,
    };
  }
  return { status: 'hint', steps: best.steps, explanation: describe(best.gain, best.steps), gain: best.gain };
}
