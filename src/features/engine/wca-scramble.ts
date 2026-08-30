import { generateStateScramble } from '@/features/solver/kociemba';
import type { MoveString } from '@/shared/types/cube';

export async function generateWCAScramble(): Promise<MoveString[]> {
  return generateStateScramble();
}
