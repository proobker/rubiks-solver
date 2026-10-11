import React from 'react';
import { cn } from '@/lib/utils';
import { buttonVariants, type ButtonVariantProps } from './variants';
import { useAccent } from './accent-context';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariantProps {
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant, accent, size, icon, className, children, type, ...props }) => {
  const contextAccent = useAccent();
  return (
    <button
      type={type ?? 'button'}
      className={cn(buttonVariants({ variant, accent: accent ?? contextAccent, size }), className)}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
};
