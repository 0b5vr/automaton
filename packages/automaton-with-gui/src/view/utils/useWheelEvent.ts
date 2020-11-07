import React, { useEffect, useLayoutEffect, useState } from 'react';

/**
 * See: https://github.com/facebook/react/issues/14856
 */
export function useWheelEvent<T extends HTMLElement>(
  ref: React.RefObject<T>,
  callback: ( event: WheelEvent ) => void,
): void {
  const [ element, setElement ] = useState( ref.current );

  useLayoutEffect(
    () => {
      if ( ref.current !== element ) {
        setElement( ref.current );
      }
    },
    [ element, ref ]
  );

  useEffect(
    () => {
      if ( !element ) { return; }

      element.addEventListener( 'wheel', callback, { passive: false } );
      return () => (
        element.removeEventListener( 'wheel', callback )
      );
    },
    [ element, callback ]
  );
}
