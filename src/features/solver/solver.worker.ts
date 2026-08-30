import { Cube, initSolver, solve } from 'rubik-solver';

type WorkerRequest =
  | { type: 'solve'; stateString: string }
  | { type: 'ping' };

initSolver();

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { type } = event.data;

  if (type === 'ping') {
    self.postMessage({ type: 'ready' });
    return;
  }

  if (type === 'solve') {
    try {
      const cube = Cube.fromString(event.data.stateString);
      const solution = solve(cube);
      if (solution === null) {
        self.postMessage({ type: 'solve-result', solution: null });
      } else {
        self.postMessage({ type: 'solve-result', solution });
      }
    } catch (err) {
      self.postMessage({
        type: 'error',
        message: err instanceof Error ? err.message : 'Solver error',
      });
    }
  }
};
