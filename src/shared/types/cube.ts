export type FaceName = 'U' | 'D' | 'F' | 'B' | 'L' | 'R';

export type FaceColor = 'white' | 'yellow' | 'green' | 'blue' | 'red' | 'orange';

export type Face = FaceColor[][];

export interface CubeState {
  U: Face;
  D: Face;
  F: Face;
  B: Face;
  L: Face;
  R: Face;
}

export type MoveDirection = 1 | -1 | 2;

export interface Move {
  face: FaceName;
  direction: MoveDirection;
}

export type MoveString = 
  | 'U' | "U'" | 'U2'
  | 'D' | "D'" | 'D2'
  | 'F' | "F'" | 'F2'
  | 'B' | "B'" | 'B2'
  | 'L' | "L'" | 'L2'
  | 'R' | "R'" | 'R2';

export const FACE_NAMES: FaceName[] = ['U', 'D', 'F', 'B', 'L', 'R'];

export const ALL_MOVES: MoveString[] = [
  'U', "U'", 'U2',
  'D', "D'", 'D2',
  'F', "F'", 'F2',
  'B', "B'", 'B2',
  'L', "L'", 'L2',
  'R', "R'", 'R2',
];

export const SOLVED_STATE: CubeState = {
  U: Array(3).fill(null).map(() => Array(3).fill('white' as FaceColor)),
  D: Array(3).fill(null).map(() => Array(3).fill('yellow' as FaceColor)),
  F: Array(3).fill(null).map(() => Array(3).fill('green' as FaceColor)),
  B: Array(3).fill(null).map(() => Array(3).fill('blue' as FaceColor)),
  L: Array(3).fill(null).map(() => Array(3).fill('orange' as FaceColor)),
  R: Array(3).fill(null).map(() => Array(3).fill('red' as FaceColor)),
};

export const COLOR_TO_HEX: Record<FaceColor, string> = {
  white: '#ffffff',
  yellow: '#ffd500',
  green: '#009b48',
  blue: '#0046ad',
  red: '#b90000',
  orange: '#ff5900',
};

export const FACE_TO_AXIS: Record<FaceName, [number, number, number]> = {
  U: [0, 1, 0],
  D: [0, -1, 0],
  F: [0, 0, 1],
  B: [0, 0, -1],
  L: [-1, 0, 0],
  R: [1, 0, 0],
};

export const FACE_TO_POSITION: Record<FaceName, [number, number, number]> = {
  U: [0, 1, 0],
  D: [0, -1, 0],
  F: [0, 0, 1],
  B: [0, 0, -1],
  L: [-1, 0, 0],
  R: [1, 0, 0],
};
