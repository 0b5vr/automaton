import { MouseComboBit, mouseCombo } from '../utils/mouseCombo';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { dx2dt, snapTime, x2t } from '../utils/TimeValueRange';
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
  const {
    automaton,
    channelNames,
    range,
    guiSettings,
  } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
    channelNames: state.automaton.channelNames,
    range: state.timeline.range,
    guiSettings: state.automaton.guiSettings,
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
      } );
    },
    [ rect ]
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
      } );
    },
    [ rect ]
  );

  const startSeek = useCallback(
    ( x: number ): void => {
      if ( !automaton ) { return; }

      const isPlaying = automaton.isPlaying;
      automaton.pause();

      const t0 = x2t( x - rect.left, range, rect.width );
      automaton.seek( t0 );

      let dx = 0.0;
      let t = t0;

      registerMouseEvent(
        ( event, movementSum ) => {
          dx += movementSum.x;
          t = t0 + dx2dt( dx, range, rect.width );
          automaton.seek( t );
        },
        () => {
          automaton.seek( t );
          if ( isPlaying ) { automaton.play(); }
        }
      );
    },
    [ automaton, range, rect ]
  );

  const startSetLoopRegion = useCallback(
    ( x: number ): void => {
      if ( !automaton ) { return; }

      const t0Raw = x2t( x - rect.left, range, rect.width );
      const t0 = snapTime( t0Raw, range, rect.width, guiSettings );

      let dx = 0.0;
      let t = t0;

      registerMouseEvent(
        ( event, movementSum ) => {
          dx += movementSum.x;

          const tRaw = t0 + dx2dt( dx, range, rect.width );
          t = snapTime( tRaw, range, rect.width, guiSettings );

          if ( t - t0 === 0.0 ) {
            automaton.setLoopRegion( null );
          } else {
            const begin = Math.min( t, t0 );
            const end = Math.max( t, t0 );
            automaton.setLoopRegion( { begin, end } );
          }
        },
        () => {
          if ( t - t0 === 0.0 ) {
            automaton.setLoopRegion( null );
          } else {
            const begin = Math.min( t, t0 );
            const end = Math.max( t, t0 );
            automaton.setLoopRegion( { begin, end } );
          }
        }
      );
    },
    [ automaton, range, rect, guiSettings ]
  );

  const handleMouseDown = useCallback(
    mouseCombo( {
      [ MouseComboBit.LMB + MouseComboBit.Alt ]: ( event ) => {
        startSeek( event.clientX );
      },
      [ MouseComboBit.LMB + MouseComboBit.Shift + MouseComboBit.Alt ]: ( event ) => {
        startSetLoopRegion( event.clientX );
      },
      [ MouseComboBit.MMB ]: () => {
        registerMouseEvent(
          ( event, movementSum ) => move( movementSum.x )
        );
      }
    } ),
    [ move, startSeek, startSetLoopRegion ]
  );

  const createLabel = useCallback(
    ( x: number, y: number ): void => {
      if ( !automaton ) { return; }

      const time = x2t( x - rect.left, range, rect.width );

      dispatch( {
        type: 'TextPrompt/Open',
        position: { x, y },
        placeholder: 'A name for the new label',
        checkValid: ( name: string ) => {
          if ( name === '' ) { return 'Create Label: Name cannot be empty.'; }
          if ( automaton.labels[ name ] != null ) { return 'Create Label: A label for the given name already exists.'; }
          return null;
        },
        callback: ( name ) => {
          automaton.setLabel( name, time );

          dispatch( {
            type: 'History/Push',
            description: 'Set Label',
            commands: [
              {
                type: 'automaton/createLabel',
                name,
                time
              }
            ],
          } );
        }
      } );
    },
    [ automaton, range, rect ]
  );

  const handleContextMenu = useCallback(
    ( event: React.MouseEvent ): void => {
      event.preventDefault();

      const x = event.clientX;
      const y = event.clientY;

      dispatch( {
        type: 'ContextMenu/Push',
        position: { x, y },
        commands: [
          {
            name: 'Create Label',
            description: 'Create a label.',
            callback: () => createLabel( x, y )
          }
        ]
      } );
    },
    [ createLabel ]
  );

  const handleWheel = useCallback(
    ( event: WheelEvent ): void => {
      if ( event.shiftKey ) {
        event.preventDefault();
        zoom( event.clientX - rect.left, event.deltaY );
      } else {
        if ( event.deltaX !== 0 ) {
          move( -event.deltaX );
        }
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
      onContextMenu={ handleContextMenu }
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
