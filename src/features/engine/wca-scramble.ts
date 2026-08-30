import { generateScramble } from './scramble';
import type { MoveString } from '@/shared/types/cube';

export function generateWCAScramble(length: number = 20): MoveString[] {
  return generateScramble(length);
}
