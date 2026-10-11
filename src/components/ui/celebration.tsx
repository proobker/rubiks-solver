import React, { useMemo } from 'react';

const COLORS = ['#ffffff', '#ffd500', '#009b48', '#0046ad', '#b90000', '#ff5900'];
const PIECES = 28;

function makePieces(seed: number) {
  let x = (seed * 9301 + 49297) % 233280;
  const rand = () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
  return Array.from({ length: PIECES }, (_, i) => {
    const angle = rand() * Math.PI * 2;
    const dist = 60 + rand() * 110;
    return {
      color: COLORS[i % COLORS.length],
      dx: `${Math.cos(angle) * dist}px`,
      dy: `${Math.sin(angle) * dist + 60}px`,
      rot: `${Math.round(rand() * 720 - 360)}deg`,
      delay: `${Math.round(rand() * 120)}ms`,
      size: 6 + Math.round(rand() * 5),
    };
  });
}

/** CSS-only confetti burst. Remount with a new `key` to replay. */
export const Celebration: React.FC<{ seed?: number; className?: string }> = ({ seed = 0, className }) => {
  const pieces = useMemo(() => makePieces(seed), [seed]);

  return (
    <div aria-hidden className={className ?? 'pointer-events-none absolute left-1/2 top-1/2 z-20'}>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece absolute block rounded-[2px] animate-confetti"
          style={
            {
              width: p.size,
              height: p.size,
              background: p.color,
              animationDelay: p.delay,
              '--dx': p.dx,
              '--dy': p.dy,
              '--rot': p.rot,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
};
