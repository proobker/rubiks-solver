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
  | { type: 'ready' }
  | { type: 'solve-result'; solution: string | null }
  | { type: 'error'; message: string };

let solverWorker: Worker | null = null;
let solverReady: Promise<void> | null = null;

function getWorker(): Worker {
  if (!solverWorker) {
    solverWorker = new Worker(new URL('./solver.worker.ts', import.meta.url), {
      type: 'module',
    });
  }
  return solverWorker;
}

export async function ensureSolver(): Promise<void> {
  if (!solverReady) {
    solverReady = new Promise<void>((resolve, reject) => {
      const worker = getWorker();
      const onMessage = (event: MessageEvent<WorkerResponse>) => {
        if (event.data.type === 'ready') {
          cleanup();
          resolve();
        } else if (event.data.type === 'error') {
          cleanup();
          reject(new Error(event.data.message));
        }
      };
      const onError = (err: ErrorEvent) => {
        cleanup();
        reject(new Error(err.message || 'Solver worker failed'));
      };
      const cleanup = () => {
        worker.removeEventListener('message', onMessage);
        worker.removeEventListener('error', onError);
      };
      worker.addEventListener('message', onMessage);
      worker.addEventListener('error', onError);
      worker.postMessage({ type: 'ping' });
    });
  }
  return solverReady;
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
      const worker = getWorker();
      const onMessage = (event: MessageEvent<WorkerResponse>) => {
        if (event.data.type === 'solve-result') {
          cleanup();
          const solution = event.data.solution;
          if (!solution) {
            reject(new Error('No solution found'));
          } else {
            resolve(parseAlgorithm(solution));
          }
        } else if (event.data.type === 'error') {
          cleanup();
          reject(new Error(event.data.message));
        }
      };
      const onError = (err: ErrorEvent) => {
        cleanup();
        reject(new Error(err.message || 'Solver worker failed'));
      };
      const cleanup = () => {
        worker.removeEventListener('message', onMessage);
        worker.removeEventListener('error', onError);
      };
      worker.addEventListener('message', onMessage);
      worker.addEventListener('error', onError);
      worker.postMessage({ type: 'solve', stateString: stateToFlatString(state) });
    });
  });
}
