import React from 'react';
import { cn } from '@/lib/utils';
import { buttonVariants, type ButtonVariantProps } from './variants';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariantProps {
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant, accent, size, icon, className, children, type, ...props }) => (
  <button type={type ?? 'button'} className={cn(buttonVariants({ variant, accent, size }), className)} {...props}>
    {icon}
    {children}
  </button>
);
