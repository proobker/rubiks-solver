import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/lib/use-local-storage';

interface SectionProps {
  id: string;
  title: React.ReactNode;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Section: React.FC<SectionProps> = ({ id, title, icon, defaultOpen = true, aside, children, className }) => {
  const [open, setOpen] = useLocalStorage<boolean>(`rubiks-solver:section:${id}`, defaultOpen);
  return (
    <section className={cn('border-t border-white/[0.06] pt-3', className)}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex-1 flex items-center gap-2 py-1 text-left rounded-md group"
        >
          {icon && <span className="text-zinc-500 group-hover:text-zinc-300 transition-colors">{icon}</span>}
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400 group-hover:text-zinc-200 transition-colors">
            {title}
          </span>
          <ChevronDown
            size={14}
            className={cn('ml-auto text-zinc-500 transition-transform duration-200', !open && '-rotate-90')}
          />
        </button>
        {aside}
      </div>
      {open && <div className="pt-3 animate-float-up">{children}</div>}
    </section>
  );
};
