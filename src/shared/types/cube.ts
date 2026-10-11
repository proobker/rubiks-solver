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

export type WideName = 'u' | 'd' | 'f' | 'b' | 'l' | 'r';
export type SliceName = 'M' | 'E' | 'S';
export type RotationName = 'x' | 'y' | 'z';
export type MoveBase = FaceName | WideName | SliceName | RotationName;
export type MoveSuffix = '' | "'" | '2';

export type MoveString = `${MoveBase}${MoveSuffix}`;

export type Vec3 = [number, number, number];

export interface MoveSpec {
  axis: Vec3;
  layers: number[];
  direction: MoveDirection;
}

export const FACE_NAMES: FaceName[] = ['U', 'D', 'F', 'B', 'L', 'R'];

export const ALL_MOVES: MoveString[] = [
  'U', "U'", 'U2',
  'D', "D'", 'D2',
  'F', "F'", 'F2',
  'B', "B'", 'B2',
  'L', "L'", 'L2',
  'R', "R'", 'R2',
];

export const FACE_MOVES = ALL_MOVES;

export const ROTATIONS: MoveString[] = ['x', "x'", 'x2', 'y', "y'", 'y2', 'z', "z'", 'z2'];

const ALL_LAYERS = [-1, 0, 1];

export const MOVE_BASES: Record<MoveBase, { axis: Vec3; layers: number[] }> = {
  U: { axis: [0, 1, 0], layers: [1] },
  D: { axis: [0, -1, 0], layers: [-1] },
  F: { axis: [0, 0, 1], layers: [1] },
  B: { axis: [0, 0, -1], layers: [-1] },
  L: { axis: [-1, 0, 0], layers: [-1] },
  R: { axis: [1, 0, 0], layers: [1] },
  u: { axis: [0, 1, 0], layers: [0, 1] },
  d: { axis: [0, -1, 0], layers: [-1, 0] },
  f: { axis: [0, 0, 1], layers: [0, 1] },
  b: { axis: [0, 0, -1], layers: [-1, 0] },
  l: { axis: [-1, 0, 0], layers: [-1, 0] },
  r: { axis: [1, 0, 0], layers: [0, 1] },
  M: { axis: [-1, 0, 0], layers: [0] },
  E: { axis: [0, -1, 0], layers: [0] },
  S: { axis: [0, 0, 1], layers: [0] },
  x: { axis: [1, 0, 0], layers: ALL_LAYERS },
  y: { axis: [0, 1, 0], layers: ALL_LAYERS },
  z: { axis: [0, 0, 1], layers: ALL_LAYERS },
};

export function moveBase(move: MoveString): MoveBase {
  return move[0] as MoveBase;
}

export function moveDirection(move: MoveString): MoveDirection {
  if (move.endsWith("'")) return -1;
  if (move.endsWith('2')) return 2;
  return 1;
}

export function moveSpec(move: MoveString): MoveSpec {
  const { axis, layers } = MOVE_BASES[moveBase(move)];
  return { axis, layers, direction: moveDirection(move) };
}

export function isRotation(move: MoveString): boolean {
  const base = moveBase(move);
  return base === 'x' || base === 'y' || base === 'z';
}

export function isFaceMove(move: MoveString): boolean {
  return (FACE_NAMES as string[]).includes(moveBase(move));
}

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

export const FACE_TO_AXIS: Record<FaceName, Vec3> = {
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
