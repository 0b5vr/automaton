import { Action, State } from '../states/store';
import React, { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Dispatch } from 'redux';
import { DopeSheetEntry } from './DopeSheetEntry';
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
  const dispatch = useDispatch<Dispatch<Action>>();
  const refRoot = useRef<HTMLDivElement>( null );
  const rect = useRect( refRoot );
  const { channelNames, length } = useSelector( ( state: State ) => ( {
    channelNames: Array.from( state.automaton.channelNames ),
    length: state.automaton.length
  } ) );

  const zoom = useCallback(
    ( cx: number, cy: number, dx: number, dy: number ): void => {
      dispatch( {
        type: 'Timeline/ZoomRange',
        size: rect,
        cx,
        cy,
        dx,
        dy,
        tmax: length // 🔥
      } );
    },
    [ rect, length ]
  );

  const handleWheel = useCallback(
    ( event: WheelEvent ): void => {
      if ( event.shiftKey ) {
        event.preventDefault();
        zoom(
          event.clientX - rect.left,
          event.offsetY - rect.top,
          event.deltaY,
          0.0
        );
      }
    },
    [ rect, zoom ]
  );

  useEffect( // 🔥 fuck
    () => {
      const svgRoot = refRoot.current;
      if ( !svgRoot ) { return; }

      svgRoot.addEventListener( 'wheel', handleWheel, { passive: false } );
      return () => (
        svgRoot.removeEventListener( 'wheel', handleWheel )
      );
    },
    [ refRoot.current, handleWheel ]
  );

  return (
    <Root
      className={ className }
      ref={ refRoot }
    >
      { channelNames.map( ( channel ) => (
        <StyledDopeSheetEntry
          key={ channel }
          channel={ channel }
        />
      ) ) }
    </Root>
  );
};

export { DopeSheet };
