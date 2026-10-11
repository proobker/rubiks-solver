import { cva, type VariantProps } from 'class-variance-authority';

export type Accent = 'accent' | 'danger';

const SOLID: Record<Accent, string> = {
  accent: 'bg-accent hover:bg-accent-hover active:bg-accent-active text-white',
  danger: 'bg-red-600 hover:bg-red-500 active:bg-red-700 text-white',
};

const SOFT: Record<Accent, string> = {
  accent: 'border-accent/40 text-accent-soft bg-accent/10 hover:bg-accent/20 active:bg-accent/25',
  danger: 'border-red-400/30 text-red-300 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/25',
};

export const ACCENT_BAR: Record<Accent, string> = {
  accent: 'bg-accent',
  danger: 'bg-red-500',
};

const ACCENTS = Object.keys(SOLID) as Accent[];

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 font-medium rounded-md select-none whitespace-nowrap transition-colors disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: '',
        soft: 'border',
        secondary: 'border border-zinc-800 text-zinc-50 hover:bg-white/[0.05] active:bg-white/[0.08]',
        ghost: 'text-zinc-400 hover:text-zinc-50 hover:bg-white/[0.05] active:bg-white/[0.08]',
      },
      accent: Object.fromEntries(ACCENTS.map((a) => [a, ''])) as Record<Accent, string>,
      size: {
        xs: 'h-7 px-2.5 text-xs',
        sm: 'h-8 px-3 text-[13px]',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-9 w-9 p-0',
        'icon-sm': 'h-8 w-8 p-0',
      },
    },
    compoundVariants: [
      ...ACCENTS.map((accent) => ({ variant: 'primary' as const, accent, class: SOLID[accent] })),
      ...ACCENTS.map((accent) => ({ variant: 'soft' as const, accent, class: SOFT[accent] })),
    ],
    defaultVariants: { variant: 'primary', accent: 'accent', size: 'md' },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
