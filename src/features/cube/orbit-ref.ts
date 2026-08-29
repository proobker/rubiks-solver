export interface OrbitHandle {
  rotateLeft: (angle: number) => void;
  rotateUp: (angle: number) => void;
}

export const orbitControlsRef: { current: OrbitHandle | null } = {
  current: null,
};
