import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Colors } from '../constants/Colors';
import styled from 'styled-components';
import { useAnimationFrame } from '../utils/useAnimationFrame';

// == microcomponent ===============================================================================
const Bar = ( { className, style, top }: {
  className?: string;
  style?: React.CSSProperties;
  top: number;
} ): JSX.Element => {
  const [ lastTop, setLastTop ] = useState( 0.0 );
  const [ accumMovement, setAccumMovement ] = useState( 0.0 );
  const [ opacity, setOpacity ] = useState( 0.0 );

  if ( top !== lastTop ) {
    const delta = Math.abs( top - lastTop );
    setAccumMovement( accumMovement + delta );
    setLastTop( top );
  }

  useAnimationFrame(
    ( delta ) => {
      if ( opacity === 0.0 ) {
        // do nothing
      } else if ( opacity < 0.01 ) {
        setOpacity( 0.0 );
      } else {
        setOpacity( opacity * Math.exp( -5.0 * delta ) );
      }

      if ( accumMovement !== 0 ) {
        setOpacity( 0.1 * accumMovement );
        setAccumMovement( 0.0 );
      }
    },
    [ opacity, accumMovement ]
  );

  return (
    <div
      className={ className }
      style={ { opacity, ...style } }
    />
  );
};

// == styles =======================================================================================
const StyledBar = styled( Bar )`
  position: absolute;
  width: 0.25rem;
  background: ${ Colors.accent };
  border-radius: 0.125rem;
`;

const Container = styled.div`
  position: absolute;
  width: 100%;
`;

const Root = styled.div`
  position: relative;
  overflow: hidden;
`;

// == components ===================================================================================
export interface ScrollableProps {
  className?: string;
  children?: ReactNode;
  barPosition?: 'left' | 'right' | 'none';
}

const Scrollable = ( props: ScrollableProps ): JSX.Element => {
  const { className, children, barPosition } = props;
  const refRoot = useRef<HTMLDivElement>( null );
  const refContainer = useRef<HTMLDivElement>( null );
  const [ top, setTop ] = useState( 0 );

  const visibleHeight = refRoot.current?.clientHeight || 0.0;
  const contentHeight = refContainer.current?.clientHeight || 1.0;
  const barHeight = visibleHeight / contentHeight;
  const barTop = top / contentHeight;

  const handleWheel = useCallback(
    ( event: WheelEvent ): void => {
      if ( !event.shiftKey && !event.ctrlKey && !event.altKey ) {
        event.preventDefault();
        event.stopPropagation();

        const visibleHeight = refRoot.current?.clientHeight || 0.0;
        const contentHeight = refContainer.current?.clientHeight || 1.0;

        const scrollMax = contentHeight - visibleHeight;
        setTop( Math.min( Math.max( top - event.deltaY, -scrollMax ), 0.0 ) );
      }
    },
    [ top ]
  );

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
      { barPosition !== 'none' && (
        <StyledBar
          top={ top }
          style={ {
            height: `${ 100.0 * barHeight }%`,
            top: `${ -100.0 * barTop }%`,
            left: barPosition === 'left' ? 0 : undefined,
            right: barPosition !== 'left' ? 0 : undefined,
          } }
        />
      ) }
    </Root>
  );
};
export { Scrollable };
