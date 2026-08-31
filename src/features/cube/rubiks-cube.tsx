import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { CameraControls, Html } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import type { FaceName } from '@/shared/types/cube';
import { COLOR_TO_HEX, FACE_TO_AXIS } from '@/shared/types/cube';
import { useCubeStore } from '@/shared/stores/cube-store';
import type { Piece } from '@/features/engine/pieces';
import { piecesOnFace } from '@/features/engine/pieces';

export type CameraPresetName =
  | 'isometric'
  | 'front'
  | 'back'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom';

export interface CameraApi {
  setPreset: (name: CameraPresetName) => void;
}

const CAMERA_PRESETS: Record<CameraPresetName, [number, number, number]> = {
  isometric: [5.5, 5, 7],
  front: [0, 0, 9],
  back: [0, 0, -9],
  left: [-9, 0, 0],
  right: [9, 0, 0],
  top: [0, 9, 0],
  bottom: [0, -9, 0],
};

const CUBIE_SIZE = 0.94;
const GAP = 0.06;
const SLOT = CUBIE_SIZE + GAP;

const INTERIOR_COLOR = '#161616';

const ANGLE_MAP: Record<number, number> = {
  1: -Math.PI / 2,
  '-1': Math.PI / 2,
  2: Math.PI,
};

const DIR_TO_SLOT: Record<string, number> = {
  '1,0,0': 0,
  '-1,0,0': 1,
  '0,1,0': 2,
  '0,-1,0': 3,
  '0,0,1': 4,
  '0,0,-1': 5,
};

interface PieceMeshProps {
  piece: Piece;
  highlighted?: boolean;
  highlightLabel?: string;
  reveal?: boolean;
}

const PieceMesh: React.FC<PieceMeshProps> = ({ piece, highlighted, highlightLabel, reveal }) => {
  const slotColors = useMemo<(string | null)[]>(() => {
    const faces: (string | null)[] = [null, null, null, null, null, null];
    for (const s of piece.stickers) {
      const slot = DIR_TO_SLOT[`${s.dir[0]},${s.dir[1]},${s.dir[2]}`];
      if (slot !== undefined) faces[slot] = COLOR_TO_HEX[s.color];
    }
    return faces;
  }, [piece.stickers]);

  return (
    <group
      position={[piece.position[0] * SLOT, piece.position[1] * SLOT, piece.position[2] * SLOT]}
    >
      <mesh>
        <boxGeometry args={[CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE]} />
        {slotColors.map((color, i) => (
          <meshStandardMaterial
            key={i}
            attach={`material-${i}`}
            color={color ?? INTERIOR_COLOR}
            roughness={0.55}
            metalness={0.05}
            transparent={reveal}
            opacity={reveal ? 0.35 : 1}
            depthWrite={!reveal}
            emissive={highlighted ? '#888888' : '#000000'}
            emissiveIntensity={highlighted ? 0.35 : 0}
          />
        ))}
      </mesh>
      {highlighted && highlightLabel && (
        <Html
          position={[0, CUBIE_SIZE / 2 + 0.15, 0]}
          center
          zIndexRange={[-1, 0]}
        >
          <div className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap pointer-events-none">
            {highlightLabel}
          </div>
        </Html>
      )}
    </group>
  );
};

interface AnimatedSliceProps {
  face: FaceName;
  direction: number;
  slicePieces: Piece[];
  onRest: () => void;
  reveal?: boolean;
}

const AnimatedSlice: React.FC<AnimatedSliceProps> = ({ face, direction, slicePieces, onRest, reveal }) => {
  const moveSpeed = useCubeStore((s) => s.moveSpeed);
  const axis = FACE_TO_AXIS[face];
  const angle = ANGLE_MAP[direction];

  const springs = useSpring({
    from: { rotation: 0 },
    to: { rotation: angle },
    config: { duration: 300 / moveSpeed },
    onRest,
  });

  return (
    <animated.group
      rotation-x={springs.rotation.to((t) => axis[0] * t)}
      rotation-y={springs.rotation.to((t) => axis[1] * t)}
      rotation-z={springs.rotation.to((t) => axis[2] * t)}
    >
      {slicePieces.map((p) => (
        <PieceMesh key={p.id} piece={p} reveal={reveal} />
      ))}
    </animated.group>
  );
};

interface AnimatedPiecesProps {
  highlights?: Map<number, { label?: string }>;
  reveal?: boolean;
}

const AnimatedPieces: React.FC<AnimatedPiecesProps> = ({ highlights, reveal }) => {
  const pieces = useCubeStore((s) => s.pieces);
  const currentAnimation = useCubeStore((s) => s.currentAnimation);
  const isAnimating = useCubeStore((s) => s.isAnimating);
  const animationId = useCubeStore((s) => s.animationId);
  const onAnimationComplete = useCubeStore((s) => s.onAnimationComplete);

  const turningFace = isAnimating ? currentAnimation?.face : undefined;
  const slicePieces = useMemo<Piece[]>(() => {
    if (!isAnimating || !currentAnimation) return [];
    return piecesOnFace(pieces, currentAnimation.face);
  }, [isAnimating, currentAnimation, pieces]);

  return (
    <group>
      {pieces.map((piece) => {
        if (turningFace && slicePieces.includes(piece)) return null;
        const highlight = highlights?.get(piece.id);
        return (
          <PieceMesh
            key={piece.id}
            piece={piece}
            highlighted={!!highlight}
            highlightLabel={highlight?.label}
            reveal={reveal}
          />
        );
      })}

      {isAnimating && currentAnimation && slicePieces.length > 0 && (
        <AnimatedSlice
          key={`${currentAnimation.face}-${currentAnimation.move}-${currentAnimation.direction}-${animationId}`}
          face={currentAnimation.face}
          direction={currentAnimation.direction}
          slicePieces={slicePieces}
          onRest={onAnimationComplete}
          reveal={reveal}
        />
      )}
    </group>
  );
};

interface RubiksCubeProps {
  highlights?: Map<number, { label?: string }>;
  reveal?: boolean;
  cameraApiRef?: React.MutableRefObject<CameraApi | null>;
}

export const RubiksCube: React.FC<RubiksCubeProps> = ({
  highlights,
  reveal,
  cameraApiRef,
}) => {
  const currentAnimation = useCubeStore((s) => s.currentAnimation);
  const isAnimating = useCubeStore((s) => s.isAnimating);
  const controlsRef = useRef<CameraControls | null>(null);

  const cameraApi = useMemo<CameraApi>(
    () => ({
      setPreset: (name) => {
        const pos = CAMERA_PRESETS[name];
        void controlsRef.current?.setLookAt(pos[0], pos[1], pos[2], 0, 0, 0, true);
      },
    }),
    [],
  );

  useEffect(() => {
    if (cameraApiRef) cameraApiRef.current = cameraApi;
  }, [cameraApiRef, cameraApi]);

  return (
    <Canvas
      camera={{ position: [5.5, 5, 7], fov: 35 }}
      dpr={[1, 2]}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.65} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} />
      <directionalLight position={[-3, -2, -4]} intensity={0.25} />

      <AnimatedPieces highlights={highlights} reveal={reveal} />

      {isAnimating && currentAnimation && (
        <Html center position={[0, -2.2, 0]} zIndexRange={[-1, 0]}>
          <div className="bg-black/80 text-white text-xl font-mono px-4 py-2 rounded-lg border-2 border-yellow-400/50 shadow-lg">
            {currentAnimation.move}
          </div>
        </Html>
      )}

      <CameraControls
        makeDefault
        ref={controlsRef}
        smoothTime={0.25}
        minDistance={4}
        maxDistance={12}
      />
    </Canvas>
  );
};
