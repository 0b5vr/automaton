import { Action, State } from '../states/store';
import React, { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { x2t, y2v } from '../utils/TimeValueRange';
import { Colors } from '../constants/Colors';
import { Dispatch } from 'redux';
import { TimeValueGrid } from './TimeValueGrid';
import { TimeValueLines } from './TimeValueLines';
import { TimelineItem } from './TimelineItem';
import { registerMouseEvent } from '../utils/registerMouseEvent';
import styled from 'styled-components';
import { useDoubleClick } from '../utils/useDoubleClick';

// == styles =======================================================================================
const Root = styled.div`
  background: ${ Colors.back1 };
  overflow: hidden;
`;

// == props ========================================================================================
export interface TimelineProps {
  className?: string;
}

// == component ====================================================================================
const Timeline = ( { className }: TimelineProps ): JSX.Element => {
  const dispatch = useDispatch<Dispatch<Action>>();
  const checkDoubleClick = useDoubleClick();
  const {
    automaton,
    time,
    selectedChannel,
    range,
    size,
    length
  } = useSelector( ( state: State ) => ( {
    automaton: state.automaton.instance,
    time: state.automaton.time,
    selectedChannel: state.timeline.selectedChannel,
    range: state.timeline.range,
    size: state.timeline.size,
    length: state.automaton.length
  } ) );
  const channel = selectedChannel != null && automaton?.getChannel( selectedChannel );
  const { channelValue, stateItems } = useSelector( ( state: State ) => ( {
    channelValue: selectedChannel != null
      ? state.automaton.channels[ selectedChannel ].value
      : null,
    stateItems: selectedChannel != null
      ? state.automaton.channels[ selectedChannel ].items
      : null
  } ) );

  const refRoot = useRef<HTMLDivElement>( null );

  useEffect( // listen its resize
    () => {
      function heck(): void {
        if ( !refRoot.current ) { return; }

        dispatch( {
          type: 'Timeline/SetSize',
          size: {
            width: refRoot.current.clientWidth,
            height: refRoot.current.clientHeight,
          }
        } );
      }

      heck();
      window.addEventListener( 'resize', () => heck() );
    },
    [ refRoot.current ]
  );

  const move = useCallback(
    ( dx: number, dy: number ): void => {
      dispatch( {
        type: 'Timeline/MoveRange',
        dx,
        dy,
        tmax: length // 🔥
      } );
    },
    [ length ]
  );

  const zoom = useCallback(
    ( cx: number, cy: number, dx: number, dy: number ): void => {
      dispatch( {
        type: 'Timeline/ZoomRange',
        cx,
        cy,
        dx,
        dy,
        tmax: length // 🔥
      } );
    },
    [ length ]
  );

  const createConstant = useCallback(
    ( x0: number, y0: number ): void => {
      if ( !selectedChannel || !channel ) { return; }

      let x = x0;
      let y = y0;

      const data = channel.createItemConstant( x2t( x, range, size.width ) );
      channel.changeConstantValue( data.$id, y2v( y, range, size.height ) );

      dispatch( {
        type: 'Timeline/SelectItems',
        items: [ {
          id: data.$id,
          channel: selectedChannel
        } ]
      } );

      registerMouseEvent(
        ( event, movementSum ) => {
          x += movementSum.x;
          y += movementSum.y;

          channel.moveItem( data.$id, x2t( x, range, size.width ) );
          channel.changeConstantValue( data.$id, y2v( y, range, size.height ) );
        },
        () => {
          const t = x2t( x, range, size.width );
          const v = y2v( y, range, size.height );
          channel.moveItem( data.$id, t );
          channel.changeConstantValue( data.$id, v );

          data.time = t;
          data.value = v;

          const undo = (): void => {
            channel.removeItem( data.$id );
          };

          const redo = (): void => {
            channel.createItemFromData( data );
          };

          dispatch( {
            type: 'History/Push',
            entry: {
              description: 'Add Constant',
              redo,
              undo
            }
          } );
        }
      );
    },
    [ range, size, channel ]
  );

  const handleMouseDown = useCallback(
    ( event: React.MouseEvent ): void => {
      event.preventDefault();

      if ( event.buttons === 1 ) {
        if ( checkDoubleClick() ) {
          createConstant( event.nativeEvent.offsetX, event.nativeEvent.offsetY );
        }
      } else if ( event.buttons === 4 ) {
        registerMouseEvent(
          ( event, movementSum ) => move( movementSum.x, movementSum.y )
        );
      }
    },
    [ createConstant, move ]
  );

  const handleWheel = useCallback(
    ( event: WheelEvent ): void => {
      event.preventDefault();

      if ( event.shiftKey ) {
        zoom( event.offsetX, event.offsetY, event.deltaY, 0.0 );
      } else if ( event.ctrlKey ) {
        zoom( event.offsetX, event.offsetY, 0.0, event.deltaY );
      } else {
        move( -event.deltaX, -event.deltaY );
      }
    },
    [ zoom, move ]
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

  if ( !automaton || !selectedChannel || !channel || !stateItems ) { return <></>; }

  return (
    <Root
      ref={ refRoot }
      className={ className }
      onMouseDown={ handleMouseDown }
    >
      <TimeValueGrid
        range={ range }
        size={ size }
      />
      { Object.entries( stateItems ).map( ( [ id, item ] ) => (
        <TimelineItem
          key={ id }
          channel={ selectedChannel }
          item={ item }
          range={ range }
          size={ size }
        />
      ) ) }
      <TimeValueLines
        time={ time }
        value={ channelValue != null ? channelValue : undefined }
        range={ range }
        size={ size }
      />
    </Root>
  );
};

export { Timeline };
