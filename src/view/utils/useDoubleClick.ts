import { useState } from 'react';

export function useDoubleClick( interval = 250 ): () => boolean {
  const [ lastClick, setLastClick ] = useState<number>( 0 );

  return () => {
    const date = Date.now();
    const delta = date - lastClick;
    setLastClick( date );
    return ( delta < interval );
  };
}
