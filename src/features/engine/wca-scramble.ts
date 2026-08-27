import { generateStateScramble } from '@/features/solver/kociemba';
import type { MoveString } from '@/shared/types/cube';

let cached: MoveString[] | null = null;

export async function generateWCAScramble(): Promise<MoveString[]> {
  if (!cached) {
    cached = await generateStateScramble();
  }
  return [...cached];
}
