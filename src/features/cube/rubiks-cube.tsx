import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { FaceName, FaceColor, CubeState } from '@/shared/types/cube';
import { COLOR_TO_HEX } from '@/shared/types/cube';
import { useCubeStore } from '@/shared/stores/cube-store';

const CUBIE_SIZE = 0.93;
const GAP = 0.06;

interface StickerProps {
  color: FaceColor;
  position: [number, number, number];
  rotation: [number, number, number];
}

const Sticker: React.FC<StickerProps> = ({ color, position, rotation }) => {
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[CUBIE_SIZE, CUBIE_SIZE]} />
      <meshStandardMaterial color={COLOR_TO_HEX[color]} />
    </mesh>
  );
};

interface CubieProps {
  position: [number, number, number];
  faces: Partial<Record<FaceName, FaceColor>>;
  highlighted?: boolean;
}

const Cubie: React.FC<CubieProps> = ({ position, faces, highlighted }) => {
  const stickerData = useMemo(() => {
    const stickers: StickerProps[] = [];
    const half = CUBIE_SIZE / 2 + 0.001;

    if (faces.U) stickers.push({ color: faces.U, position: [0, half, 0], rotation: [-Math.PI / 2, 0, 0] });
    if (faces.D) stickers.push({ color: faces.D, position: [0, -half, 0], rotation: [Math.PI / 2, 0, 0] });
    if (faces.F) stickers.push({ color: faces.F, position: [0, 0, half], rotation: [0, 0, 0] });
    if (faces.B) stickers.push({ color: faces.B, position: [0, 0, -half], rotation: [0, Math.PI, 0] });
    if (faces.L) stickers.push({ color: faces.L, position: [-half, 0, 0], rotation: [0, -Math.PI / 2, 0] });
    if (faces.R) stickers.push({ color: faces.R, position: [half, 0, 0], rotation: [0, Math.PI / 2, 0] });

    return stickers;
  }, [faces]);

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE]} />
        <meshStandardMaterial
          color={highlighted ? '#333333' : '#1a1a1a'}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      {stickerData.map((sticker, i) => (
        <Sticker key={i} {...sticker} />
      ))}
    </group>
  );
};

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

interface RubiksCubeProps {
  highlightedPositions?: Set<string>;
}

export const RubiksCube: React.FC<RubiksCubeProps> = ({ highlightedPositions }) => {
  const state = useCubeStore((s) => s.state);

  const cubies = useMemo(() => {
    const result: { position: [number, number, number]; faces: Partial<Record<FaceName, FaceColor>> }[] = [];

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && y === 0 && z === 0) continue;
          result.push({
            position: [x * (CUBIE_SIZE + GAP), y * (CUBIE_SIZE + GAP), z * (CUBIE_SIZE + GAP)],
            faces: getCubieFaces(state, x, y, z),
          });
        }
      }
    }
    return result;
  }, [state]);

  return (
    <Canvas
      camera={{ position: [3, 3, 3], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} />

      <group>
        {cubies.map((cubie, i) => (
          <Cubie
            key={i}
            position={cubie.position}
            faces={cubie.faces}
            highlighted={highlightedPositions?.has(`${cubie.position}`)}
          />
        ))}
      </group>

      <OrbitControls
        enablePan={false}
        minDistance={4}
        maxDistance={12}
        enableDamping
        dampingFactor={0.05}
      />
    </Canvas>
  );
};
