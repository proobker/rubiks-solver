import type { MoveString, FaceName } from '@/shared/types/cube';
import { applyMove, cloneState } from './moves';
import type { CubeState } from '@/shared/types/cube';

const FACES: FaceName[] = ['U', 'D', 'F', 'B', 'L', 'R'];
const OPPOSITE: Record<FaceName, FaceName> = {
  U: 'D', D: 'U', F: 'B', B: 'F', L: 'R', R: 'L',
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateScramble(length: number = 20): MoveString[] {
  const moves: MoveString[] = [];
  let lastFace: FaceName | null = null;
  let secondLastFace: FaceName | null = null;

  for (let i = 0; i < length; i++) {
    let face: FaceName;
    do {
      face = FACES[randomInt(0, 5)];
    } while (
      face === lastFace ||
      (face === secondLastFace && isOpposite(face, lastFace!))
    );

    const dir = randomInt(0, 2);
    const move: MoveString = dir === 0
      ? face
      : dir === 1
        ? `${face}'` as MoveString
        : `${face}2` as MoveString;

    moves.push(move);
    secondLastFace = lastFace;
    lastFace = face;
  }

  return moves;
}

function isOpposite(a: FaceName, b: FaceName): boolean {
  return OPPOSITE[a] === b;
}

export function scrambleCube(state: CubeState, moves?: MoveString[]): { state: CubeState; moves: MoveString[] } {
  const scrambleMoves = moves ?? generateScramble();
  const newState = cloneState(state);
  return {
    state: scrambleMoves.reduce((s, m) => applyMove(s, m), newState),
    moves: scrambleMoves,
  };
}

export function randomState(): CubeState {
  let state: CubeState = {
    U: Array(3).fill(null).map(() => Array(3).fill('white' as const)),
    D: Array(3).fill(null).map(() => Array(3).fill('yellow' as const)),
    F: Array(3).fill(null).map(() => Array(3).fill('green' as const)),
    B: Array(3).fill(null).map(() => Array(3).fill('blue' as const)),
    L: Array(3).fill(null).map(() => Array(3).fill('orange' as const)),
    R: Array(3).fill(null).map(() => Array(3).fill('red' as const)),
  };

  const scramble = generateScramble(100);
  for (const move of scramble) {
    state = applyMove(state, move);
  }

  return state;
}
