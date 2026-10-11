import { cva, type VariantProps } from 'class-variance-authority';

export type Accent = 'sky' | 'blue' | 'green' | 'orange' | 'yellow' | 'violet' | 'red';

const SOLID: Record<Accent, string> = {
  sky: 'bg-sky-600 hover:bg-sky-500 text-white',
  blue: 'bg-blue-600 hover:bg-blue-500 text-white',
  green: 'bg-emerald-600 hover:bg-emerald-500 text-white',
  orange: 'bg-orange-500 hover:bg-orange-400 text-white',
  yellow: 'bg-yellow-400 hover:bg-yellow-300 text-zinc-950',
  violet: 'bg-violet-600 hover:bg-violet-500 text-white',
  red: 'bg-red-600 hover:bg-red-500 text-white',
};

const SOFT: Record<Accent, string> = {
  sky: 'border-sky-400/40 text-sky-300 bg-sky-500/10 hover:bg-sky-500/20',
  blue: 'border-blue-400/40 text-blue-300 bg-blue-500/10 hover:bg-blue-500/20',
  green: 'border-emerald-400/40 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20',
  orange: 'border-orange-400/40 text-orange-300 bg-orange-500/10 hover:bg-orange-500/20',
  yellow: 'border-yellow-300/40 text-yellow-200 bg-yellow-400/10 hover:bg-yellow-400/20',
  violet: 'border-violet-400/40 text-violet-300 bg-violet-500/10 hover:bg-violet-500/20',
  red: 'border-red-400/40 text-red-300 bg-red-500/10 hover:bg-red-500/20',
};

export const ACCENT_TEXT: Record<Accent, string> = {
  sky: 'text-sky-300',
  blue: 'text-blue-300',
  green: 'text-emerald-300',
  orange: 'text-orange-300',
  yellow: 'text-yellow-200',
  violet: 'text-violet-300',
  red: 'text-red-300',
};

export const ACCENT_BAR: Record<Accent, string> = {
  sky: 'bg-sky-500',
  blue: 'bg-blue-500',
  green: 'bg-emerald-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-400',
  violet: 'bg-violet-500',
  red: 'bg-red-500',
};

const ACCENTS = Object.keys(SOLID) as Accent[];

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 font-semibold rounded-xl select-none whitespace-nowrap disabled:opacity-40 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'keycap',
        soft: 'border transition-colors',
        secondary: 'keycap bg-white/[0.07] hover:bg-white/[0.12] text-zinc-100 border border-white/10',
        ghost: 'text-zinc-400 hover:text-white hover:bg-white/[0.07] transition-colors',
      },
      accent: Object.fromEntries(ACCENTS.map((a) => [a, ''])) as Record<Accent, string>,
      size: {
        xs: 'h-7 px-2 text-[11px] rounded-lg',
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-5 text-base',
        icon: 'h-9 w-9 p-0',
        'icon-sm': 'h-8 w-8 p-0 rounded-lg',
      },
    },
    compoundVariants: [
      ...ACCENTS.map((accent) => ({ variant: 'primary' as const, accent, class: SOLID[accent] })),
      ...ACCENTS.map((accent) => ({ variant: 'soft' as const, accent, class: SOFT[accent] })),
    ],
    defaultVariants: { variant: 'primary', accent: 'sky', size: 'md' },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
