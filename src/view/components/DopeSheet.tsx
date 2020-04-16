import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from '../states/store';
import { DopeSheetEntry } from './DopeSheetEntry';
import { registerMouseEvent } from '../utils/registerMouseEvent';
import styled from 'styled-components';
import { useRect } from '../utils/useRect';

// == styles =======================================================================================
const StyledDopeSheetEntry = styled( DopeSheetEntry )`
  margin: 2px 0;
`;

const Root = styled.div`
`;

// == props ========================================================================================
export interface DopeSheetProps {
  className?: string;
}

// == component ====================================================================================
const DopeSheet = ( { className }: DopeSheetProps ): JSX.Element => {
  const dispatch = useDispatch();
  const refRoot = useRef<HTMLDivElement>( null );
  const rect = useRect( refRoot );
  const { channelNames, length } = useSelector( ( state ) => ( {
    channelNames: state.automaton.channelNames,
    length: state.automaton.length
  } ) );

  const sortedChannelNames = useMemo(
    () => Array.from( channelNames ).sort(),
    [ channelNames ]
  );

  const move = useCallback(
    ( dx: number ): void => {
      dispatch( {
        type: 'Timeline/MoveRange',
        size: rect,
        dx,
        dy: 0.0,
        tmax: length // 🔥
      } );
    },
    [ rect, length ]
  );

  const zoom = useCallback(
    ( cx: number, dx: number ): void => {
      dispatch( {
        type: 'Timeline/ZoomRange',
        size: rect,
        cx,
        cy: 0.0,
        dx,
        dy: 0.0,
        tmax: length // 🔥
      } );
    },
    [ rect, length ]
  );

  const handleMouseDown = useCallback(
    ( event: React.MouseEvent ): void => {
      if ( event.buttons === 4 ) {
        event.preventDefault();
        event.stopPropagation();

        registerMouseEvent(
          ( event, movementSum ) => move( movementSum.x )
        );
      }
    },
    [ move ]
  );

  const handleWheel = useCallback(
    ( event: WheelEvent ): void => {
      if ( event.shiftKey ) {
        event.preventDefault();
        zoom( event.clientX - rect.left, event.deltaY );
      } else {
        move( -event.deltaX );
      }
    },
    [ rect, zoom, move ]
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
    [ refRoot.current, handleWheel ]
  );

  return (
    <Root
      className={ className }
      ref={ refRoot }
      onMouseDown={ handleMouseDown }
    >
      { sortedChannelNames.map( ( channel ) => (
        <StyledDopeSheetEntry
          key={ channel }
          channel={ channel }
        />
      ) ) }
    </Root>
  );
};

export { DopeSheet };
