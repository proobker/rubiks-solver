import { ensureSolver, refillScrambleCache } from './kociemba';

let started = false;

export function preloadSolver(): void {
  if (started) return;
  started = true;

  const schedule = (fn: () => void) => {
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => fn(), { timeout: 2000 });
    } else {
      setTimeout(fn, 500);
    }
  };

  schedule(() => {
    ensureSolver().then(() => {
      schedule(() => {
        void refillScrambleCache();
      });
    });
  });
}
