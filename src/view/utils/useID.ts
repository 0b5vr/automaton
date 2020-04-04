import { useMemo } from 'react';

let globalId = 0;

export function useID( deps?: any[] ): number {
  return useMemo(
    () => {
      globalId ++;
      return globalId;
    },
    deps || []
  );
}
