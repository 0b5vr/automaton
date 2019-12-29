import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { Colors } from '../constants/Colors';
import styled from 'styled-components';
import { useAnimationFrame } from '../utils/useAnimationFrame';

// == styles =======================================================================================
export const Bar = styled.div`
  position: absolute;
  width: 0.25rem;
  background: ${ Colors.accent };
  border-radius: 0.125rem;
`;

export const Container = styled.div`
  position: absolute;
  width: 100%;
`;

export const Root = styled.div`
  position: relative;
  overflow: hidden;
`;

// == components ===================================================================================
export interface ScrollableProps {
  className?: string;
  children?: ReactNode;
  barPosition?: 'left' | 'right';
}

export const Scrollable = ( props: ScrollableProps ): JSX.Element => {
  const { className, children, barPosition } = props;
  const refOpacity = useRef<number>( 0 );
  const [ top, setTop ] = useState<number>( 0 );
  const refRoot = useRef<HTMLDivElement>( null );
  const refContainer = useRef<HTMLDivElement>( null );

  const visibleHeight = refRoot.current?.clientHeight || 0.0;
  const contentHeight = refContainer.current?.clientHeight || 1.0;
  const barHeight = visibleHeight / contentHeight;
  const barTop = top / contentHeight;

  const handleWheel = ( event: WheelEvent ): void => {
    event.preventDefault();
    event.stopPropagation();

    const scrollMax = contentHeight - visibleHeight;
    setTop( Math.min( Math.max( top - event.deltaY, -scrollMax ), 0.0 ) );
    refOpacity.current = 1.0;
  };

  useAnimationFrame( ( delta ) => {
    refOpacity.current *= Math.exp( -5.0 * delta );
  } );

  useEffect( // 🔥 fuck
    () => {
      const root = refRoot.current;
      if ( !root ) { return; }

      root.addEventListener( 'wheel', handleWheel, { passive: false } );
      return () => (
        root.removeEventListener( 'wheel', handleWheel )
      );
    },
    [ handleWheel ]
  );

  return (
    <Root
      ref={ refRoot }
      className={ className }
    >
      <Container
        ref={ refContainer }
        style={ {
          top: `${ top }px`
        } }
      >
        { children }
      </Container>
      <Bar
        style={ {
          height: `${ 100.0 * barHeight }%`,
          top: `${ -100.0 * barTop }%`,
          left: barPosition === 'left' ? 0 : undefined,
          right: barPosition !== 'left' ? 0 : undefined,
          opacity: refOpacity.current
        } }
      />
    </Root>
  );
};
