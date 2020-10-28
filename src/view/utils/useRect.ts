// Ref: https://codesandbox.io/s/userect-hook-1y5t7

import { useCallback, useLayoutEffect, useState } from 'react';
import ResizeObserver from 'resize-observer-polyfill';

export interface RectResult {
  bottom: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
}

const nullResult: RectResult = {
  bottom: 0,
  height: 0,
  left: 0,
  right: 0,
  top: 0,
  width: 0
};

function getRect<T extends HTMLElement | SVGElement>( element?: T ): RectResult {
  if ( element ) {
    return element.getBoundingClientRect();
  } else {
    return nullResult;
  }
}

export function useRect<T extends HTMLElement | SVGElement>(
  ref: React.RefObject<T>
): RectResult {
  const [ element, setElement ] = useState( ref.current );
  const [ rect, setRect ] = useState<RectResult>( nullResult );

  useLayoutEffect(
    () => {
      if ( ref.current !== element ) {
        setElement( ref.current );
      }
    },
    [ element, ref ]
  );

  const handleResize = useCallback(
    () => {
      if ( !element ) { return; }
      setRect( getRect( element ) ); // Update client rect
    },
    [ element ]
  );

  useLayoutEffect(
    () => {
      if ( !element ) { return; }

      handleResize();

      const resizeObserver = new ResizeObserver( () => handleResize() );
      resizeObserver.observe( element );

      return () => {
        if ( !resizeObserver ) { return; }
        resizeObserver.disconnect();
      };
    },
    [ element, handleResize ]
  );

  return rect;
}
