import type { CubeState, FaceName, Move, MoveDirection, MoveString, Face } from '@/shared/types/cube';

function cloneFace(face: Face): Face {
  return face.map(row => [...row]);
}

export function cloneState(state: CubeState): CubeState {
  return {
    U: cloneFace(state.U),
    D: cloneFace(state.D),
    F: cloneFace(state.F),
    B: cloneFace(state.B),
    L: cloneFace(state.L),
    R: cloneFace(state.R),
  };
}

function rotateFaceCW(face: Face): Face {
  const result = cloneFace(face);
  result[0][0] = face[2][0];
  result[0][1] = face[1][0];
  result[0][2] = face[0][0];
  result[1][0] = face[2][1];
  result[1][2] = face[0][1];
  result[2][0] = face[2][2];
  result[2][1] = face[1][2];
  result[2][2] = face[0][2];
  return result;
}



const clockwiseCycle: Record<FaceName, (state: CubeState) => void> = {
  U: (state) => {
    const temp = [state.F[0][0], state.F[0][1], state.F[0][2]];
    state.F[0][0] = state.R[0][0];
    state.F[0][1] = state.R[0][1];
    state.F[0][2] = state.R[0][2];
    state.R[0][0] = state.B[0][0];
    state.R[0][1] = state.B[0][1];
    state.R[0][2] = state.B[0][2];
    state.B[0][0] = state.L[0][0];
    state.B[0][1] = state.L[0][1];
    state.B[0][2] = state.L[0][2];
    state.L[0][0] = temp[0];
    state.L[0][1] = temp[1];
    state.L[0][2] = temp[2];
  },
  D: (state) => {
    const temp = [state.F[2][0], state.F[2][1], state.F[2][2]];
    state.F[2][0] = state.L[2][0];
    state.F[2][1] = state.L[2][1];
    state.F[2][2] = state.L[2][2];
    state.L[2][0] = state.B[2][0];
    state.L[2][1] = state.B[2][1];
    state.L[2][2] = state.B[2][2];
    state.B[2][0] = state.R[2][0];
    state.B[2][1] = state.R[2][1];
    state.B[2][2] = state.R[2][2];
    state.R[2][0] = temp[0];
    state.R[2][1] = temp[1];
    state.R[2][2] = temp[2];
  },
  F: (state) => {
    const temp = [state.U[2][0], state.U[2][1], state.U[2][2]];
    state.U[2][0] = state.L[2][2];
    state.U[2][1] = state.L[1][2];
    state.U[2][2] = state.L[0][2];
    state.L[0][2] = state.D[0][0];
    state.L[1][2] = state.D[0][1];
    state.L[2][2] = state.D[0][2];
    state.D[0][0] = state.R[2][0];
    state.D[0][1] = state.R[1][0];
    state.D[0][2] = state.R[0][0];
    state.R[0][0] = temp[0];
    state.R[1][0] = temp[1];
    state.R[2][0] = temp[2];
  },
  B: (state) => {
    const temp = [state.U[0][0], state.U[0][1], state.U[0][2]];
    state.U[0][0] = state.R[0][2];
    state.U[0][1] = state.R[1][2];
    state.U[0][2] = state.R[2][2];
    state.R[0][2] = state.D[2][2];
    state.R[1][2] = state.D[2][1];
    state.R[2][2] = state.D[2][0];
    state.D[2][0] = state.L[0][0];
    state.D[2][1] = state.L[1][0];
    state.D[2][2] = state.L[2][0];
    state.L[0][0] = temp[2];
    state.L[1][0] = temp[1];
    state.L[2][0] = temp[0];
  },
  L: (state) => {
    const temp = [state.U[0][0], state.U[1][0], state.U[2][0]];
    state.U[0][0] = state.B[2][2];
    state.U[1][0] = state.B[1][2];
    state.U[2][0] = state.B[0][2];
    state.B[0][2] = state.D[2][0];
    state.B[1][2] = state.D[1][0];
    state.B[2][2] = state.D[0][0];
    state.D[0][0] = state.F[0][0];
    state.D[1][0] = state.F[1][0];
    state.D[2][0] = state.F[2][0];
    state.F[0][0] = temp[0];
    state.F[1][0] = temp[1];
    state.F[2][0] = temp[2];
  },
  R: (state) => {
    const temp = [state.U[0][2], state.U[1][2], state.U[2][2]];
    state.U[0][2] = state.F[0][2];
    state.U[1][2] = state.F[1][2];
    state.U[2][2] = state.F[2][2];
    state.F[0][2] = state.D[0][2];
    state.F[1][2] = state.D[1][2];
    state.F[2][2] = state.D[2][2];
    state.D[0][2] = state.B[2][0];
    state.D[1][2] = state.B[1][0];
    state.D[2][2] = state.B[0][0];
    state.B[0][0] = temp[2];
    state.B[1][0] = temp[1];
    state.B[2][0] = temp[0];
  },
};

function applyFaceTurn(state: CubeState, face: FaceName, direction: MoveDirection): CubeState {
  const result = cloneState(state);

  const turns = direction === -1 ? 3 : direction === 2 ? 2 : 1;
  for (let i = 0; i < turns; i++) {
    clockwiseCycle[face](result);
    result[face] = rotateFaceCW(result[face]);
  }

  return result;
}

export function applyMove(state: CubeState, move: MoveString): CubeState {
  const face = move[0] as FaceName;
  let direction: MoveDirection = 1;
  
  if (move.includes("'")) {
    direction = -1;
  } else if (move.includes('2')) {
    direction = 2;
  }
  
  return applyFaceTurn(state, face, direction);
}

export function applyMoves(state: CubeState, moves: MoveString[]): CubeState {
  return moves.reduce((currentState, move) => applyMove(currentState, move), state);
}

export function parseMoveString(moveStr: string): MoveString {
  const cleaned = moveStr.trim().toUpperCase();
  if (cleaned.length === 0) throw new Error('Empty move string');
  
  const face = cleaned[0];
  if (!['U', 'D', 'F', 'B', 'L', 'R'].includes(face)) {
    throw new Error(`Invalid face: ${face}`);
  }
  
  if (cleaned.length === 1) return face as MoveString;
  if (cleaned.length === 2) {
    if (cleaned[1] === "'") return `${face}'` as MoveString;
    if (cleaned[1] === '2') return `${face}2` as MoveString;
  }
  
  throw new Error(`Invalid move: ${cleaned}`);
}

export function parseAlgorithm(algorithm: string): MoveString[] {
  return algorithm.trim().split(/\s+/).map(parseMoveString);
}

export function moveToString(move: Move): MoveString {
  const dir = move.direction === -1 ? "'" : move.direction === 2 ? '2' : '';
  return `${move.face}${dir}` as MoveString;
}

export function isSolved(state: CubeState): boolean {
  const faces: FaceName[] = ['U', 'D', 'F', 'B', 'L', 'R'];
  for (const face of faces) {
    const color = state[face][1][1];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (state[face][row][col] !== color) return false;
      }
    }
  }
  return true;
}
