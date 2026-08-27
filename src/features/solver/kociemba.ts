import { Cube, initSolver, solve as kociembaSolve, scramble as kociembaScramble } from 'rubik-solver';
import type { CubeState, MoveString } from '@/shared/types/cube';

let solverReady = false;

async function ensureSolver(): Promise<void> {
  if (!solverReady) {
    initSolver();
    solverReady = true;
  }
}

function stateToFlatString(state: CubeState): string {
  const faces = ['U', 'R', 'F', 'D', 'L', 'B'] as const;
  let result = '';
  for (const face of faces) {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        result += state[face][row][col][0].toUpperCase();
      }
    }
  }
  return result;
}

export async function solveCube(state: CubeState): Promise<MoveString[]> {
  await ensureSolver();
  const stateString = stateToFlatString(state);
  const cube = Cube.fromString(stateString);
  const solution = kociembaSolve(cube);
  if (!solution) throw new Error('No solution found');
  return solution.trim().split(/\s+/).filter(Boolean) as MoveString[];
}

export async function generateStateScramble(): Promise<MoveString[]> {
  await ensureSolver();
  const scramble = kociembaScramble();
  return scramble.trim().split(/\s+/).filter(Boolean) as MoveString[];
}
