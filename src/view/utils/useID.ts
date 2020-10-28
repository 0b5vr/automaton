import { DependencyList, useMemo } from 'react';

let globalId = 0;

export function useID( deps?: DependencyList ): number {
  return useMemo(
    () => {
      globalId ++;
      return globalId;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps ?? []
  );
}
