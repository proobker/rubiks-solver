import React, { useRef, useCallback } from 'react';

interface DragRotateProps {
  onMove: (move: string) => void;
  enabled?: boolean;
  disabled?: boolean;
}

export const DragRotate: React.FC<DragRotateProps> = ({ onMove, enabled = true, disabled = false }) => {
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const DRAG_THRESHOLD = 30;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!enabled || disabled) return;
    dragStart.current = { x: e.clientX, y: e.clientY };
  }, [enabled, disabled]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!enabled || disabled || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    dragStart.current = null;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (absX < DRAG_THRESHOLD && absY < DRAG_THRESHOLD) return;

    // Horizontal drag = R face, Vertical drag = U face
    if (absX > absY) {
      onMove(dx > 0 ? 'R' : "R'");
    } else {
      onMove(dy < 0 ? 'U' : "U'");
    }
  }, [enabled, disabled, onMove]);

  return (
    <div
      className="absolute inset-0"
      style={{ touchAction: 'none', cursor: 'default' }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    />
  );
};
