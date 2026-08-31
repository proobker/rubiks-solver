import { useCallback, useMemo, useState } from 'react';
import { useCubeStore } from '@/shared/stores/cube-store';
import { generateWCAScramble, takePreloadedWCAScramble } from './wca-scramble';

export function useWCAScramble() {
  const applyScramble = useCubeStore((s) => s.applyScramble);
  const [loading, setLoading] = useState(false);

  const scramble = useCallback(async () => {
    setLoading(true);
    try {
      const moves = takePreloadedWCAScramble() ?? (await generateWCAScramble());
      applyScramble(moves);
    } finally {
      setLoading(false);
    }
  }, [applyScramble]);

  return useMemo(() => ({ scramble, loading }), [scramble, loading]);
}
