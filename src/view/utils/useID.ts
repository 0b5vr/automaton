import { DependencyList, useMemo } from 'react';

let globalId = 0;

export function useID( deps?: DependencyList ): number {
  return useMemo(
    () => {
      globalId ++;
      return globalId;
    },
    deps ?? []
  );
}
