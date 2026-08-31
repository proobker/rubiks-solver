import { randomScrambleForEvent } from 'cubing/scramble';
import type { MoveString } from '@/shared/types/cube';
import { parseMoveString } from './moves';

let cached: MoveString[] | null = null;

export async function generateWCAScramble(): Promise<MoveString[]> {
  const alg = await randomScrambleForEvent('333');
  const tokens = alg.toString().trim().split(/\s+/).filter(Boolean);
  return tokens.map(parseMoveString);
}

export async function preloadWCAScramble(): Promise<void> {
  try {
    cached ??= await generateWCAScramble();
  } catch {
    cached = null;
  }
}

export function takePreloadedWCAScramble(): MoveString[] | null {
  const value = cached;
  cached = null;
  return value;
}
