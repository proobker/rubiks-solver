import React, { useMemo, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import * as THREE from 'three';
import type { FaceName, FaceColor, CubeState } from '@/shared/types/cube';
import { COLOR_TO_HEX, FACE_TO_AXIS } from '@/shared/types/cube';
import { useCubeStore } from '@/shared/stores/cube-store';
import type { HighlightedPiece } from '@/features/learning/highlights';

const CUBIE_SIZE = 0.93;
const GAP = 0.06;
const ANGLE_MAP: Record<number, number> = {
  1: Math.PI / 2,
  '-1': -Math.PI / 2,
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

interface CubieProps {
  position: [number, number, number];
  faces: Partial<Record<FaceName, FaceColor>>;
  animating?: boolean;
  animationAxis?: [number, number, number];
  animationAngle?: number;
  highlighted?: boolean;
  highlightLabel?: string;
}

const Cubie: React.FC<CubieProps> = ({ position, faces, animating, animationAxis, animationAngle, highlighted, highlightLabel }) => {
  const groupRef = useRef<THREE.Group>(null);

  const targetRotation = animating && animationAxis && animationAngle
    ? (() => {
        const axis = animationAxis;
        const angle = animationAngle;
        const ax = axis[0], ay = axis[1], az = axis[2];
        const s = Math.sin(angle / 2);
        const qx = ax * s, qy = ay * s, qz = az * s;
        const qw = Math.cos(angle / 2);
        const sinr_cosp = 2 * (qw * qx - qy * qz);
        const cosr_cosp = 1 - 2 * (qx * qx + qz * qz);
        const x = Math.atan2(sinr_cosp, cosr_cosp);
        const sinp = 2 * (qw * qy + qz * qx);
        const y = Math.abs(sinp) >= 1 ? Math.sign(sinp) * Math.PI / 2 : Math.asin(sinp);
        const siny_cosp = 2 * (qw * qz + qx * qy);
        const cosy_cosp = 1 - 2 * (qx * qx + qy * qy);
        const z = Math.atan2(siny_cosp, cosy_cosp);
        return [x, y, z] as [number, number, number];
      })()
    : [0, 0, 0] as [number, number, number];

  const springs = useSpring({
    rotation: targetRotation,
    config: { duration: 300 },
  });

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
    <animated.group ref={groupRef} position={position} rotation={springs.rotation as unknown as [number, number, number]}>
      <mesh>
        <boxGeometry args={[CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE]} />
        <meshStandardMaterial
          color={highlighted ? '#444444' : '#1a1a1a'}
          roughness={0.3}
          metalness={0.1}
          emissive={highlighted ? '#333333' : '#000000'}
        />
      </mesh>
      {stickerData.map((sticker, i) => (
        <Sticker key={i} {...sticker} />
      ))}
      {highlighted && highlightLabel && (
        <Html position={[0, CUBIE_SIZE / 2 + 0.15, 0]} center>
          <div className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap pointer-events-none">
            {highlightLabel}
          </div>
        </Html>
      )}
    </animated.group>
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

function isCubieOnFace(x: number, y: number, z: number, face: FaceName): boolean {
  switch (face) {
    case 'U': return y === 1;
    case 'D': return y === -1;
    case 'F': return z === 1;
    case 'B': return z === -1;
    case 'L': return x === -1;
    case 'R': return x === 1;
  }
}

interface AnimatedCubiesProps {
  highlights?: HighlightedPiece[];
}

const AnimatedCubies: React.FC<AnimatedCubiesProps> = ({ highlights }) => {
  const state = useCubeStore((s) => s.state);
  const currentAnimation = useCubeStore((s) => s.currentAnimation);
  const isAnimating = useCubeStore((s) => s.isAnimating);
  const onAnimationComplete = useCubeStore((s) => s.onAnimationComplete);
  const moveSpeed = useCubeStore((s) => s.moveSpeed);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isAnimating && currentAnimation) {
      const duration = 300 / moveSpeed;
      timerRef.current = setTimeout(() => {
        onAnimationComplete();
      }, duration);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isAnimating, currentAnimation, moveSpeed, onAnimationComplete]);

  const highlightMap = useMemo(() => {
    if (!highlights) return new Map<string, HighlightedPiece>();
    const map = new Map<string, HighlightedPiece>();
    for (const h of highlights) {
      map.set(h.position.toString(), h);
    }
    return map;
  }, [highlights]);

  const cubies = useMemo(() => {
    const result: {
      position: [number, number, number];
      coords: [number, number, number];
      faces: Partial<Record<FaceName, FaceColor>>;
    }[] = [];

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && y === 0 && z === 0) continue;
          result.push({
            position: [x * (CUBIE_SIZE + GAP), y * (CUBIE_SIZE + GAP), z * (CUBIE_SIZE + GAP)],
            coords: [x, y, z],
            faces: getCubieFaces(state, x, y, z),
          });
        }
      }
    }
    return result;
  }, [state]);

  return (
    <group>
      {cubies.map((cubie, i) => {
        const [x, y, z] = cubie.coords;
        const isOnFace = currentAnimation ? isCubieOnFace(x, y, z, currentAnimation.face) : false;
        const highlight = highlightMap.get(cubie.position.toString());

        return (
          <Cubie
            key={i}
            position={cubie.position}
            faces={cubie.faces}
            animating={isAnimating && isOnFace}
            animationAxis={currentAnimation ? FACE_TO_AXIS[currentAnimation.face] : undefined}
            animationAngle={currentAnimation && isOnFace ? ANGLE_MAP[currentAnimation.direction] : undefined}
            highlighted={!!highlight}
            highlightLabel={highlight?.label}
          />
        );
      })}
    </group>
  );
};

interface RubiksCubeProps {
  highlights?: HighlightedPiece[];
}

export const RubiksCube: React.FC<RubiksCubeProps> = ({ highlights }) => {
  return (
    <Canvas
      camera={{ position: [3, 3, 3], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} />

      <AnimatedCubies highlights={highlights} />

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
