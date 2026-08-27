import React, { useRef, useCallback } from 'react';

interface DragRotateProps {
  onMove: (move: string) => void;
  onToggleMode: () => void;
  enabled?: boolean;
  disabled?: boolean;
  mode: 'turn' | 'orbit';
}

export const DragRotate: React.FC<DragRotateProps> = ({
  onMove,
  onToggleMode,
  enabled = true,
  disabled = false,
  mode,
}) => {
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const lastTapTime = useRef<number>(0);
  const DRAG_THRESHOLD = 30;
  const DOUBLE_TAP_MS = 300;
  const active = enabled && !disabled;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!active || mode !== 'turn') return;
    dragStart.current = { x: e.clientX, y: e.clientY };
  }, [active, mode]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!active) return;

    const now = Date.now();
    const wasTap = dragStart.current && Math.abs(e.clientX - dragStart.current.x) < DRAG_THRESHOLD && Math.abs(e.clientY - dragStart.current.y) < DRAG_THRESHOLD;

    if (mode === 'turn') {
      if (!wasTap && dragStart.current) {
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        dragStart.current = null;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        if (absX < DRAG_THRESHOLD && absY < DRAG_THRESHOLD) return;
        if (absX > absY) {
          onMove(dx > 0 ? 'R' : "R'");
        } else {
          onMove(dy < 0 ? 'U' : "U'");
        }
        return;
      }

      if (wasTap) {
        dragStart.current = null;
        if (now - lastTapTime.current < DOUBLE_TAP_MS) {
          lastTapTime.current = 0;
          onToggleMode();
        } else {
          lastTapTime.current = now;
        }
        return;
      }
    }
  }, [active, mode, onMove, onToggleMode]);

  return (
    <div
      className="absolute inset-0"
      style={{
        touchAction: 'none',
        cursor: mode === 'orbit' ? 'grab' : 'default',
        pointerEvents: mode === 'orbit' ? 'none' : 'auto',
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    />
  );
};
