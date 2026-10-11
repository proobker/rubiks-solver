import algorithmsData from './algorithms.json';
import type { MoveString } from '@/shared/types/cube';
import { parseAlgorithm } from '@/features/engine/moves';

export interface AlgorithmCase {
  id: string;
  name: string;
  moves: string;
  description: string;
  recognition?: string;
}

export interface Algorithm {
  id: string;
  name: string;
  notation: string;
  description: string;
  recognition?: string;
  repeat?: number;
  cases?: AlgorithmCase[];
}

export type MethodType = 'beginner' | 'cfop';

export interface LearningStage {
  id: string;
  name: string;
  description: string;
  method: MethodType;
  order: number;
  goal: string;
  tips?: string[];
  drill?: boolean;
  algorithms: Algorithm[];
  prerequisite?: string | null;
}

export const ALL_STAGES: LearningStage[] = algorithmsData.stages as LearningStage[];

export const BEGINNER_STAGES = ALL_STAGES.filter((s) => s.method === 'beginner');
export const CFOP_STAGES = ALL_STAGES.filter((s) => s.method === 'cfop');

export function stageById(id: string): LearningStage | undefined {
  return ALL_STAGES.find((s) => s.id === id);
}

/** Something the learner can recognise and execute: a case, or a case-less algorithm. */
export interface DrillItem {
  key: string;
  name: string;
  moves: MoveString[];
  notation: string;
  description: string;
  recognition?: string;
  repeat: number;
}

export function stageItems(stage: LearningStage): DrillItem[] {
  return stage.algorithms.flatMap((algo) =>
    algo.cases && algo.cases.length > 0
      ? algo.cases.map((c) => ({
          key: `${stage.id}/${algo.id}/${c.id}`,
          name: c.name,
          moves: parseAlgorithm(c.moves),
          notation: c.moves,
          description: c.description,
          recognition: c.recognition,
          repeat: 1,
        }))
      : [
          {
            key: `${stage.id}/${algo.id}`,
            name: algo.name,
            moves: parseAlgorithm(algo.notation),
            notation: algo.notation,
            description: algo.description,
            recognition: algo.recognition,
            repeat: algo.repeat ?? 1,
          },
        ],
  );
}

export function diagramModeFor(stageId: string): 'oll' | 'full' {
  return stageId.includes('oll') || stageId === 'yellow-cross' || stageId === 'yellow-face' ? 'oll' : 'full';
}

export function isStageLocked(stage: LearningStage, completedStages: Set<string>): boolean {
  return !!stage.prerequisite && !completedStages.has(stage.prerequisite);
}
