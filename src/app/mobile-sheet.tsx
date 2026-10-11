import React, { useRef } from 'react';
import { cn } from '@/lib/utils';
import { ACCENT_TEXT } from '@/components/ui/variants';
import { TABS, type Tab } from './tabs';

interface MobileSheetProps {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  children: React.ReactNode;
}

const DRAG_THRESHOLD = 30;

export const MobileSheet: React.FC<MobileSheetProps> = ({ expanded, onExpandedChange, tab, onTabChange, children }) => {
  const startY = useRef<number | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    startY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (startY.current === null) return;
    const dy = e.clientY - startY.current;
    startY.current = null;
    if (dy < -DRAG_THRESHOLD) onExpandedChange(true);
    else if (dy > DRAG_THRESHOLD) onExpandedChange(false);
    else onExpandedChange(!expanded);
  };

  return (
    <>
      <div
        className={cn(
          'flex flex-col bg-panel border-t border-white/[0.08] rounded-t-3xl -mt-4 relative z-10 shadow-[0_-12px_30px_rgba(0,0,0,0.45)] transition-[height] duration-300 ease-out',
          expanded ? 'h-[78dvh]' : 'h-[42dvh]',
        )}
      >
        <button
          type="button"
          aria-label={expanded ? 'Collapse panel' : 'Expand panel'}
          aria-expanded={expanded}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          className="shrink-0 flex justify-center pt-2.5 pb-2 touch-none"
        >
          <span className="h-1.5 w-12 rounded-full bg-white/25" />
        </button>
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">{children}</div>
      </div>
      <nav className="shrink-0 grid grid-cols-4 bg-panel border-t border-white/[0.08] pb-[env(safe-area-inset-bottom)]">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onTabChange(t.id)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors',
                active ? ACCENT_TEXT[t.accent] : 'text-zinc-500',
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 2} />
              {t.label}
            </button>
          );
        })}
      </nav>
    </>
  );
};
