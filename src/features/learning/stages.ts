import algorithmsData from './algorithms.json';

export interface AlgorithmCase {
  id: string;
  name: string;
  pattern: string;
  moves: string;
  description: string;
}

export interface Algorithm {
  id: string;
  notation: string;
  description: string;
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
  algorithms: Algorithm[];
  prerequisite?: string | null;
}

export const ALL_STAGES: LearningStage[] = algorithmsData.stages as LearningStage[];

export const BEGINNER_STAGES = ALL_STAGES.filter((s) => s.method === 'beginner');
export const CFOP_STAGES = ALL_STAGES.filter((s) => s.method === 'cfop');
