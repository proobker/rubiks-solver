import { ensureSolver } from './kociemba';

let started = false;

export function preloadSolver(): void {
  if (started) return;
  started = true;
  void ensureSolver();
}
