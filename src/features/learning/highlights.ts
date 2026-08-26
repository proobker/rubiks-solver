import type { CubeState, FaceName, FaceColor } from '@/shared/types/cube';

export interface HighlightedPiece {
  position: [number, number, number];
  label?: string;
}

export function getStageHighlights(stageId: string, state: CubeState): HighlightedPiece[] {
  switch (stageId) {
    case 'white-cross':
      return getWhiteCrossHighlights(state);
    case 'white-corners':
      return getWhiteCornerHighlights(state);
    case 'middle-layer':
      return getMiddleLayerHighlights();
    case 'yellow-cross':
      return getYellowCrossHighlights();
    case 'yellow-face':
      return getYellowFaceHighlights();
    case 'position-corners':
      return getPositionCornerHighlights();
    case 'permute-edges':
      return getPermuteEdgeHighlights();
    default:
      return [];
  }
}

function getWhiteCrossHighlights(state: CubeState): HighlightedPiece[] {
  const pieces: HighlightedPiece[] = [];
  const white = 'white';

  const edges: [number, number, number][] = [
    [0, 1, 1], [0, 1, -1], [1, 1, 0], [-1, 1, 0],
    [0, -1, 1], [0, -1, -1], [1, -1, 0], [-1, -1, 0],
    [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
  ];

  for (const [x, y, z] of edges) {
    const faces = getCubieFaces(state, x, y, z);
    if (faces.U === white || faces.D === white || faces.F === white || faces.B === white) {
      pieces.push({ position: [x, y, z] });
    }
  }

  return pieces;
}

function getWhiteCornerHighlights(state: CubeState): HighlightedPiece[] {
  const corners: [number, number, number][] = [
    [1, 1, 1], [-1, 1, 1], [1, 1, -1], [-1, 1, -1],
    [1, -1, 1], [-1, -1, 1], [1, -1, -1], [-1, -1, -1],
  ];

  return corners
    .filter(([x, y, z]) => {
      const faces = getCubieFaces(state, x, y, z);
      return faces.U === 'white' || faces.D === 'white';
    })
    .map(([x, y, z]) => ({ position: [x, y, z] }));
}

function getMiddleLayerHighlights(): HighlightedPiece[] {
  const edges: [number, number, number][] = [
    [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
  ];

  return edges.map(([x, y, z]) => ({ position: [x, y, z] }));
}

function getYellowCrossHighlights(): HighlightedPiece[] {
  const edges: [number, number, number][] = [
    [0, 1, 1], [0, 1, -1], [1, 1, 0], [-1, 1, 0],
  ];

  return edges.map(([x, y, z]) => ({ position: [x, y, z] }));
}

function getYellowFaceHighlights(): HighlightedPiece[] {
  const pieces: [number, number, number][] = [
    [1, 1, 1], [-1, 1, 1], [1, 1, -1], [-1, 1, -1],
    [0, 1, 1], [0, 1, -1], [1, 1, 0], [-1, 1, 0],
  ];

  return pieces.map(([x, y, z]) => ({ position: [x, y, z] }));
}

function getPositionCornerHighlights(): HighlightedPiece[] {
  const corners: [number, number, number][] = [
    [1, 1, 1], [-1, 1, 1], [1, 1, -1], [-1, 1, -1],
    [1, -1, 1], [-1, -1, 1], [1, -1, -1], [-1, -1, -1],
  ];

  return corners.map(([x, y, z]) => ({ position: [x, y, z] }));
}

function getPermuteEdgeHighlights(): HighlightedPiece[] {
  const edges: [number, number, number][] = [
    [0, 1, 1], [0, 1, -1], [1, 1, 0], [-1, 1, 0],
    [0, -1, 1], [0, -1, -1], [1, -1, 0], [-1, -1, 0],
    [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
  ];

  return edges.map(([x, y, z]) => ({ position: [x, y, z] }));
}

function getCubieFaces(state: CubeState, x: number, y: number, z: number): Partial<Record<FaceName, FaceColor>> {
  const faces: Partial<Record<FaceName, FaceColor>> = {};

  if (y === 1) faces.U = state.U[2 - z + 1][x + 1];
  if (y === -1) faces.D = state.D[z + 1][x + 1];
  if (z === 1) faces.F = state.F[y === 1 ? 0 : y === -1 ? 2 : 1][x + 1];
  if (z === -1) faces.B = state.B[y === 1 ? 0 : y === -1 ? 2 : 1][2 - (x + 1)];
  if (x === -1) faces.L = state.L[y === 1 ? 0 : y === -1 ? 2 : 1][z === 1 ? 2 : z === -1 ? 0 : 1];
  if (x === 1) faces.R = state.R[y === 1 ? 0 : y === -1 ? 2 : 1][z === 1 ? 0 : z === -1 ? 2 : 1];

  return faces;
}
