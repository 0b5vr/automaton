import React, { useEffect, useMemo, useState } from 'react';
import { Colors } from '../constants/Colors';
import styled from 'styled-components';

// == styles =======================================================================================
const Root = styled.div`
  position: fixed;
  font-size: 0.75rem;
  padding: 0.125rem 0.25rem;
  margin: 0.5rem 1rem;
  background: ${ Colors.back1 };
  border-radius: 0.25rem;
  opacity: 0.8;
`;

// == element ======================================================================================
export interface StalkerProps {
  className?: string;
}

const Stalker = ( { className }: StalkerProps ): JSX.Element => {
  const [ position, setPosition ] = useState( { x: 0, y: 0 } );
  const [ target, setTarget ] = useState<EventTarget | null>( null );

  useEffect( // add event listener
    () => {
      function handleMouseMove( event: MouseEvent ): void {
        setPosition( { x: event.clientX, y: event.clientY } );
        setTarget( event.target );
      }

      window.addEventListener( 'mousemove', handleMouseMove );
      return () => window.removeEventListener( 'mousemove', handleMouseMove );
    },
    []
  );

  const style: React.CSSProperties = useMemo(
    () => {
      const width = document.documentElement.clientWidth;
      const height = document.documentElement.clientHeight;

      const ret: React.CSSProperties = {};
      ( position.x < width - 240 )
        ? ( ret.left = position.x )
        : ( ret.right = width - position.x );
      ( position.y < height - 120 )
        ? ( ret.top = position.y )
        : ( ret.bottom = height - position.y );
      return ret;
    },
    [ position ]
  );

  let text: string | null = null;
  if ( target ) {
    let currentTarget: HTMLElement | null = target as HTMLElement;
    while ( !text && currentTarget ) {
      text = currentTarget.dataset.stalker || null;
      currentTarget = currentTarget.parentElement;
    }
  }

  return <>
    { text && (
      <Root className={ className } style={ style }>
        { text }
      </Root>
    ) }
  </>;
};

export { Stalker };
