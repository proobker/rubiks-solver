import type { CubeState, MoveString, FaceColor } from '@/shared/types/cube';

const COLOR_TO_FACE_LETTER: Record<FaceColor, string> = {
  white: 'U',
  yellow: 'D',
  green: 'F',
  blue: 'B',
  orange: 'L',
  red: 'R',
};

type WorkerResponse =
  | { type: 'solve-result'; solution: string | null }
  | { type: 'error'; message: string };

type PendingRequest = {
  resolve: (solution: string) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

const SOLVE_TIMEOUT_MS = 20000;

let solverWorker: Worker | null = null;
let workerReady: Promise<void> | null = null;
let pending: PendingRequest | null = null;

function createWorker(): void {
  solverWorker = new Worker(new URL('./solver.worker.ts', import.meta.url), {
    type: 'module',
  });

  solverWorker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    if (!pending) return;
    const { resolve, reject, timer } = pending;
    pending = null;
    clearTimeout(timer);
    if (event.data.type === 'error') {
      reject(new Error(event.data.message));
      return;
    }
    const solution = event.data.solution;
    if (!solution) {
      reject(new Error('No solution found'));
    } else {
      resolve(solution);
    }
  };

  solverWorker.onerror = (err: ErrorEvent) => {
    if (!pending) return;
    const { reject, timer } = pending;
    pending = null;
    clearTimeout(timer);
    reject(new Error(err.message || 'Solver worker failed'));
  };
}

export async function ensureSolver(): Promise<void> {
  if (!workerReady) {
    workerReady = (async () => {
      if (!solverWorker) createWorker();
      return undefined;
    })();
  }
  return workerReady;
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

function parseAlgorithm(algorithm: string): MoveString[] {
  return algorithm.trim().split(/\s+/).filter(Boolean) as MoveString[];
}

export function solveCube(state: CubeState): Promise<MoveString[]> {
  return ensureSolver().then(() => {
    return new Promise<MoveString[]>((resolve, reject) => {
      if (!solverWorker) {
        reject(new Error('Solver worker unavailable'));
        return;
      }
      if (pending) {
        reject(new Error('A solve is already in progress'));
        return;
      }

      const timer = setTimeout(() => {
        pending = null;
        reject(new Error(`Solver timed out after ${SOLVE_TIMEOUT_MS / 1000}s`));
      }, SOLVE_TIMEOUT_MS);

      pending = {
        resolve: (solution) => resolve(parseAlgorithm(solution)),
        reject,
        timer,
      };

      solverWorker.postMessage({ type: 'solve', stateString: stateToFlatString(state) });
    });
  });
}