import { createContext, useContext } from 'react';
import type { Accent } from './variants';

export const AccentContext = createContext<Accent>('sky');

export function useAccent(): Accent {
  return useContext(AccentContext);
}
