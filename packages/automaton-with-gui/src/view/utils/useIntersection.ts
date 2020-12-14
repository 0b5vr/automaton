// Ref: https://codesandbox.io/s/userect-hook-1y5t7

import { useElement } from './useElement';
import { useLayoutEffect, useState } from 'react';

export function useIntersection<T extends HTMLElement | SVGElement>(
  ref: React.RefObject<T>,
  options?: IntersectionObserverInit,
): boolean {
  const element = useElement( ref );
  const [ isIntersecting, setIntersecting ] = useState( false );

  useLayoutEffect(
    () => {
      if ( !element ) { return; }

      const observer = new IntersectionObserver(
        ( [ entry ] ) => {
          setIntersecting( entry.isIntersecting );
        },
        options,
      );

      observer.observe( element );

      return () => {
        if ( !observer ) { return; }
        observer.disconnect();
      };
    },
    [ element, options ]
  );

  return isIntersecting;
}
