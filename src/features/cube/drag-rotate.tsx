import React, { useRef, useCallback, useState } from 'react';
import { orbitControlsRef } from './orbit-ref';

interface DragRotateProps {
  onMove: (move: string) => void;
  enabled?: boolean;
  disabled?: boolean;
}

const DRAG_THRESHOLD = 30;
const DOUBLE_CLICK_MS = 400;
const ORBIT_SPEED = 0.005;

export const DragRotate: React.FC<DragRotateProps> = ({
  onMove,
  enabled = true,
  disabled = false,
}) => {
  const [isOrbiting, setIsOrbiting] = useState(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const lastClickTime = useRef<number>(0);
  const isOrbitGesture = useRef<boolean>(false);
  const wasOrbitGesture = useRef<boolean>(false);
  const active = enabled && !disabled;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!active) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      e.currentTarget.setPointerCapture(e.pointerId);

      const now = Date.now();
      const secondPress = now - lastClickTime.current < DOUBLE_CLICK_MS;

      dragStart.current = { x: e.clientX, y: e.clientY };
      isOrbitGesture.current = secondPress;
      wasOrbitGesture.current = secondPress;
      lastClickTime.current = 0;
    },
    [active],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!active || !dragStart.current || !isOrbitGesture.current) return;

      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;

      // Second press of a double-click that has moved far enough: this is an
      // orbit gesture. Drive OrbitControls imperatively and keep consuming
      // the drag.
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;

      const controls = orbitControlsRef.current;
      if (!controls) return;

      setIsOrbiting(true);
      controls.rotateLeft(dx * ORBIT_SPEED);
      controls.rotateUp(dy * ORBIT_SPEED);
      dragStart.current = { x: e.clientX, y: e.clientY };
    },
    [active],
  );

  const endPointer = useCallback(() => {
    dragStart.current = null;
    lastClickTime.current = 0;
    isOrbitGesture.current = false;
    wasOrbitGesture.current = false;
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const start = dragStart.current;
      if (active) {
        const wasOrbit = wasOrbitGesture.current;
        endPointer();

        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }

        if (isOrbiting) {
          setIsOrbiting(false);
          return;
        }

        if (!start) return;

        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        if (absX < DRAG_THRESHOLD && absY < DRAG_THRESHOLD) {
          // Plain click. Arm the double-click window, keeping it armed across
          // consecutive quick clicks so click-click-click-drag also orbits.
          lastClickTime.current = Date.now();
          return;
        }

        if (wasOrbit) return;

        if (absX > absY) {
          onMove(dx > 0 ? 'R' : "R'");
        } else {
          onMove(dy < 0 ? 'U' : "U'");
        }
      } else {
        endPointer();
      }
    },
    [active, onMove, isOrbiting, endPointer],
  );

  return (
    <div
      className="absolute inset-0 z-20"
      style={{
        touchAction: 'none',
        cursor: isOrbiting ? 'grabbing' : 'grab',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
};
