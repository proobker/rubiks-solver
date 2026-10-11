import { describe, expect, it } from 'vitest';
import { applyFaceletMoves, solvedFacelets } from './facelets';
import { STAGE_GOALS, generateStageSetup, stageStatus } from './stage-goals';
import { ALL_STAGES, stageItems } from './stages';

describe('learning content', () => {
  it.each(ALL_STAGES.map((s) => [s.id, s] as const))('every algorithm in %s parses', (_, stage) => {
    for (const item of stageItems(stage)) expect(item.moves.length, item.key).toBeGreaterThan(0);
  });

  it('has unique drill item keys', () => {
    const keys = ALL_STAGES.flatMap((s) => stageItems(s).map((i) => i.key));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('reports every stage complete on a solved cube', () => {
    for (const stageId of Object.keys(STAGE_GOALS)) {
      expect(stageStatus(stageId, solvedFacelets()).complete, stageId).toBe(true);
    }
  });

  it.each(Object.keys(STAGE_GOALS))('practice setup for %s satisfies its prerequisite', (stageId) => {
    const setup = generateStageSetup(stageId);
    const status = stageStatus(stageId, applyFaceletMoves(solvedFacelets(), setup));
    expect(status.prereq).toBe(true);
    expect(status.complete).toBe(false);
  });
});
