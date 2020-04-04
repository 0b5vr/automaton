// https://codesandbox.io/s/userect-hook-1y5t7
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

function getRect<T extends Element>( element?: T ): RectResult {
  let rect: RectResult = {
    bottom: 0,
    height: 0,
    left: 0,
    right: 0,
    top: 0,
    width: 0
  };

  if ( element ) { rect = element.getBoundingClientRect(); }
  return rect;
}

export function useRect<T extends Element>(
  ref: React.RefObject<T>
): RectResult {
  const [ rect, setRect ] = useState<RectResult>(
    ref && ref.current ? getRect( ref.current ) : getRect()
  );

  const handleResize = useCallback( () => {
    if ( !ref.current ) { return; }
    setRect( getRect( ref.current ) ); // Update client rect
  }, [ ref ] );

  useLayoutEffect(
    () => {
      const element = ref.current;
      if ( !element ) { return; }

      handleResize();

      const resizeObserver = new ResizeObserver( () => handleResize() );
      resizeObserver.observe( element );

      return () => {
        if ( !resizeObserver ) { return; }
        resizeObserver.disconnect();
      };
    },
    [ ref.current ]
  );

  return rect;
}
