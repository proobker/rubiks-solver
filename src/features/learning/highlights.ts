import type { Piece } from '@/features/engine/pieces';
import { piecesToFacelets, slotPieceId } from './facelets';
import { STAGE_GOALS } from './stage-goals';

export type HighlightMap = Map<number, { label?: string }>;

export function getStageHighlights(stageId: string, pieces: Piece[]): HighlightMap {
  const highlights: HighlightMap = new Map();
  const goal = STAGE_GOALS[stageId];
  if (!goal) return highlights;

  const f = piecesToFacelets(pieces);
  if (!goal.prereq(f)) return highlights;

  for (const slotIndex of goal.targets(f)) {
    const id = slotPieceId(pieces, slotIndex);
    if (id !== undefined) highlights.set(id, {});
  }
  return highlights;
}
