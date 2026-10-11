import React from 'react';
import { cn } from '@/lib/utils';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement> & { tone?: 'default' | 'inset' }> = ({
  className,
  tone = 'default',
  ...props
}) => (
  <div
    className={cn(
      'rounded-2xl border p-4',
      tone === 'default' ? 'border-white/[0.08] bg-white/[0.035]' : 'border-white/[0.06] bg-black/25',
      className,
    )}
    {...props}
  />
);

interface CardHeaderProps {
  title: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, icon, actions, className }) => (
  <div className={cn('flex items-center justify-between gap-2 mb-3', className)}>
    <div className="flex items-center gap-2 min-w-0">
      {icon && <span className="text-zinc-400 shrink-0">{icon}</span>}
      <h3 className="text-sm font-semibold text-zinc-100 truncate">{title}</h3>
    </div>
    {actions && <div className="flex items-center gap-1.5 shrink-0">{actions}</div>}
  </div>
);
