import { beforeAll, describe, expect, it } from 'vitest';
import { Cube, initSolver, solve } from 'rubik-solver';
import { SOLVED_STATE, type MoveString } from '@/shared/types/cube';
import { applyMoves, isSolved, parseAlgorithm } from '@/features/engine/moves';
import { generateScramble } from '@/features/engine/scramble';
import { stateToFlatString } from './kociemba';

function solveState(moves: MoveString[]): MoveString[] {
  const solution = solve(Cube.fromString(stateToFlatString(applyMoves(SOLVED_STATE, moves))));
  if (solution === null) throw new Error('No solution');
  return parseAlgorithm(solution);
}

describe('solver', () => {
  beforeAll(() => {
    initSolver();
  }, 60_000);

  it('serializes the solved cube in URFDLB order', () => {
    expect(stateToFlatString(SOLVED_STATE)).toBe(
      ['U', 'R', 'F', 'D', 'L', 'B'].map((face) => face.repeat(9)).join(''),
    );
  });

  it('solves random scrambles', () => {
    for (let i = 0; i < 10; i++) {
      const scramble = generateScramble(25);
      const solution = solveState(scramble);
      expect(isSolved(applyMoves(applyMoves(SOLVED_STATE, scramble), solution))).toBe(true);
    }
  });

  it('solves a cube that has been rotated', () => {
    const setup: MoveString[] = ['x', "y'", ...generateScramble(20)];
    const solution = solveState(setup);
    expect(isSolved(applyMoves(applyMoves(SOLVED_STATE, setup), solution))).toBe(true);
  });
});
