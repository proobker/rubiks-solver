import type { CubeState, MoveString, FaceColor } from '@/shared/types/cube';

const COLOR_TO_FACE_LETTER: Record<FaceColor, string> = {
  white: 'U',
  yellow: 'D',
  green: 'F',
  blue: 'B',
  orange: 'L',
  red: 'R',
};

interface SolverModule {
  initSolver: () => void;
  solve: (cube: unknown, maxDepth?: number) => string | null;
  scramble: (length?: number) => string;
  Cube: { fromString: (str: string) => unknown };
}

let modulePromise: Promise<SolverModule> | null = null;

function loadSolver(): Promise<SolverModule> {
  if (!modulePromise) {
    modulePromise = import('rubik-solver').then((mod) => mod as unknown as SolverModule);
  }
  return modulePromise;
}

let solverReady = false;

export async function ensureSolver(): Promise<void> {
  if (solverReady) return;
  const mod = await loadSolver();
  mod.initSolver();
  solverReady = true;
}

const scrambleCache: MoveString[][] = [];
const CACHE_TARGET = 5;

function parseAlgorithm(algorithm: string): MoveString[] {
  return algorithm.trim().split(/\s+/).filter(Boolean) as MoveString[];
}

export function takeCachedScramble(): MoveString[] | null {
  if (scrambleCache.length === 0) return null;
  return scrambleCache.shift() ?? null;
}

export async function refillScrambleCache(): Promise<void> {
  if (!solverReady) return;
  while (scrambleCache.length < CACHE_TARGET) {
    const mod = await loadSolver();
    scrambleCache.push(parseAlgorithm(mod.scramble()));
  }
}

function stateToFlatString(state: CubeState): string {
  const faces = ['U', 'R', 'F', 'D', 'L', 'B'] as const;
  let result = '';
  for (const face of faces) {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        result += COLOR_TO_FACE_LETTER[state[face][row][col]];
      }
    }
  }
  return result;
}

export async function solveCube(state: CubeState): Promise<MoveString[]> {
  await ensureSolver();
  const mod = await loadSolver();
  const stateString = stateToFlatString(state);
  const cube = mod.Cube.fromString(stateString);
  const solution = mod.solve(cube);
  if (!solution) throw new Error('No solution found');
  return parseAlgorithm(solution);
}

export async function generateStateScramble(): Promise<MoveString[]> {
  await ensureSolver();
  const cached = takeCachedScramble();
  if (cached) return cached;
  const mod = await loadSolver();
  return parseAlgorithm(mod.scramble());
}
