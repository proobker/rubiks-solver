import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import type { FaceName, FaceColor } from '@/shared/types/cube';
import { COLOR_TO_HEX, FACE_TO_AXIS } from '@/shared/types/cube';
import { useCubeStore } from '@/shared/stores/cube-store';
import type { Piece } from '@/features/engine/pieces';
import { stickerFace, piecesOnFace } from '@/features/engine/pieces';

const CUBIE_SIZE = 0.93;
const GAP = 0.06;
const SLOT = CUBIE_SIZE + GAP;

const ANGLE_MAP: Record<number, number> = {
  1: -Math.PI / 2,
  '-1': Math.PI / 2,
  2: Math.PI,
};

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

function stickerPlacement(dir: [number, number, number]): { position: [number, number, number]; rotation: [number, number, number] } {
  const half = CUBIE_SIZE / 2 + 0.001;
  const [x, y, z] = dir;
  if (y === 1) return { position: [0, half, 0], rotation: [-Math.PI / 2, 0, 0] };
  if (y === -1) return { position: [0, -half, 0], rotation: [Math.PI / 2, 0, 0] };
  if (z === 1) return { position: [0, 0, half], rotation: [0, 0, 0] };
  if (z === -1) return { position: [0, 0, -half], rotation: [0, Math.PI, 0] };
  if (x === -1) return { position: [-half, 0, 0], rotation: [0, -Math.PI / 2, 0] };
  return { position: [half, 0, 0], rotation: [0, Math.PI / 2, 0] };
}

interface PieceMeshProps {
  piece: Piece;
  highlighted?: boolean;
  highlightLabel?: string;
}

const PieceMesh: React.FC<PieceMeshProps> = ({ piece, highlighted, highlightLabel }) => {
  const stickers = useMemo(() => {
    return piece.stickers.map((s) => {
      const face = stickerFace(s.dir) ?? 'R';
      const { position, rotation } = stickerPlacement(s.dir);
      return { key: face, color: s.color, position, rotation };
    });
  }, [piece.stickers]);

  return (
    <group
      position={[piece.position[0] * SLOT, piece.position[1] * SLOT, piece.position[2] * SLOT]}
    >
      <mesh>
        <boxGeometry args={[CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE]} />
        <meshStandardMaterial
          color={highlighted ? '#444444' : '#1a1a1a'}
          roughness={0.3}
          metalness={0.1}
          emissive={highlighted ? '#333333' : '#000000'}
        />
      </mesh>
      {stickers.map((s) => (
        <Sticker key={s.key} color={s.color} position={s.position} rotation={s.rotation} />
      ))}
      {highlighted && highlightLabel && (
        <Html position={[0, CUBIE_SIZE / 2 + 0.15, 0]} center>
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
}

const AnimatedSlice: React.FC<AnimatedSliceProps> = ({ face, direction, slicePieces, onRest }) => {
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
        <PieceMesh key={p.id} piece={p} />
      ))}
    </animated.group>
  );
};

interface AnimatedPiecesProps {
  highlights?: Map<number, { label?: string }>;
}

const AnimatedPieces: React.FC<AnimatedPiecesProps> = ({ highlights }) => {
  const pieces = useCubeStore((s) => s.pieces);
  const currentAnimation = useCubeStore((s) => s.currentAnimation);
  const isAnimating = useCubeStore((s) => s.isAnimating);
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
          />
        );
      })}

      {isAnimating && currentAnimation && slicePieces.length > 0 && (
        <AnimatedSlice
          key={`${currentAnimation.face}-${currentAnimation.move}-${currentAnimation.direction}`}
          face={currentAnimation.face}
          direction={currentAnimation.direction}
          slicePieces={slicePieces}
          onRest={onAnimationComplete}
        />
      )}
    </group>
  );
};

interface RubiksCubeProps {
  highlights?: Map<number, { label?: string }>;
  mode?: 'turn' | 'orbit';
  onToggleMode?: () => void;
}

export const RubiksCube: React.FC<RubiksCubeProps> = ({ highlights, mode = 'turn', onToggleMode }) => {
  const currentAnimation = useCubeStore((s) => s.currentAnimation);
  const isAnimating = useCubeStore((s) => s.isAnimating);

  return (
    <Canvas
      camera={{ position: [3, 3, 3], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
      onDoubleClick={mode === 'orbit' ? onToggleMode : undefined}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} />

      <AnimatedPieces highlights={highlights} />

      {isAnimating && currentAnimation && (
        <Html center position={[0, -2.2, 0]}>
          <div className="bg-black/80 text-white text-xl font-mono px-4 py-2 rounded-lg border-2 border-yellow-400/50 shadow-lg">
            {currentAnimation.move}
          </div>
        </Html>
      )}

      <OrbitControls
        enableRotate={true}
        enablePan={mode === 'orbit'}
        minDistance={4}
        maxDistance={12}
        enableDamping
        dampingFactor={0.05}
      />
    </Canvas>
  );
};
