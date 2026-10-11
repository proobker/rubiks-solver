import React from 'react';
import { cn } from '@/lib/utils';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement> & { tone?: 'default' | 'inset' }> = ({
  className,
  tone = 'default',
  ...props
}) => (
  <div
    className={cn(
      'rounded-lg border p-4',
      tone === 'default' ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-800 bg-panel',
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
      <h3 className="text-sm font-medium text-zinc-50 truncate">{title}</h3>
    </div>
    {actions && <div className="flex items-center gap-1.5 shrink-0">{actions}</div>}
  </div>
);
