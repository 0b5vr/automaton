import { useCallback, useRef } from 'react';

export function useDoubleClick( interval = 250 ): () => boolean {
  const refLastClick = useRef( 0 );

  return useCallback(
    () => {
      const date = Date.now();
      const delta = date - refLastClick.current;
      refLastClick.current = date;
      return ( delta < interval );
    },
    [ interval ]
  );
}
