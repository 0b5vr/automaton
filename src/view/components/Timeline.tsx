import React, { useCallback, useEffect, useRef } from 'react';
import { SerializedChannelItem, SerializedChannelItemConstant } from '@fms-cat/automaton';
import { TimeValueRange, x2t, y2v } from '../utils/TimeValueRange';
import { useDispatch, useSelector } from '../states/store';
import { Colors } from '../constants/Colors';
import { RangeBar } from './RangeBar';
import { Resolution } from '../utils/Resolution';
import { TimeValueGrid } from './TimeValueGrid';
import { TimeValueLines } from './TimeValueLines';
import { TimelineItem } from './TimelineItem';
import { WithID } from '../../types/WithID';
import { hasOverwrap } from '../../utils/hasOverwrap';
import { registerMouseEvent } from '../utils/registerMouseEvent';
import styled from 'styled-components';
import { useRect } from '../utils/useRect';

// == microcomponent ===============================================================================
const Lines = ( { channel, range, size }: {
  channel?: string;
  range: TimeValueRange;
  size: Resolution;
} ): JSX.Element => {
  const { time, value } = useSelector( ( state ) => ( {
    time: state.automaton.time,
    value: channel != null ? state.automaton.channels[ channel ].value : null
  } ) );

  return <TimeValueLines
    range={ range }
    size={ size }
    time={ time }
    value={ value ?? undefined }
  />;
};

const Items = ( { channel, range, size }: {
  channel: string;
  range: TimeValueRange;
  size: Resolution;
} ): JSX.Element => {
  const { items } = useSelector( ( state ) => ( {
    items: state.automaton.channels[ channel ].items
  } ) );

  return <>
    { Object.entries( items ).map( ( [ id, item ] ) => (
      <TimelineItem
        key={ id }
        channel={ channel }
        item={ item }
        range={ range }
        size={ size }
      />
    ) ) }
  </>;
};

// == styles =======================================================================================
const SVGRoot = styled.svg`
  width: 100%;
  height: 100%;
`;

const Body = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: calc( 100% - 4px );
  background: ${ Colors.back1 };
  pointer-events: auto;
`;

const StyledRangeBar = styled( RangeBar )`
  position: absolute;
  left: 0;
  bottom: 0;
  height: 4px;
`;

const Root = styled.div`
`;

// == props ========================================================================================
export interface TimelineProps {
  className?: string;
}

// == component ====================================================================================
const Timeline = ( { className }: TimelineProps ): JSX.Element => {
  const dispatch = useDispatch();
  const {
    automaton,
    selectedChannel,
    range,
    length,
    lastSelectedItem
  } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
    selectedChannel: state.timeline.selectedChannel,
    range: state.timeline.range,
    length: state.automaton.length,
    lastSelectedItem: state.timeline.lastSelectedItem
  } ) );
  const channel = selectedChannel != null && automaton?.getChannel( selectedChannel );
  const { stateItems } = useSelector( ( state ) => ( {
    stateItems: selectedChannel != null
      ? state.automaton.channels[ selectedChannel ].items
      : null
  } ) );

  const refBody = useRef<HTMLDivElement>( null );
  const rect = useRect( refBody );

  const move = useCallback(
    ( dx: number, dy: number ): void => {
      dispatch( {
        type: 'Timeline/MoveRange',
        size: rect,
        dx,
        dy,
        tmax: length // 🔥
      } );
    },
    [ rect, length ]
  );

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

  const createItem = useCallback(
    ( x0: number, y0: number ): void => {
      if ( !automaton || !lastSelectedItem || !selectedChannel || !channel ) { return; }

      let x = x0;
      let y = y0;

      const t0 = x2t( x, range, rect.width );

      const thereAreNoOtherItemsHere = channel.items.every( ( item ) => (
        !hasOverwrap( item.time, item.length, t0, 0.0 )
      ) );

      if ( !thereAreNoOtherItemsHere ) { return; }

      const srcChannel = automaton.getChannel( lastSelectedItem.channel );
      const src = srcChannel?.tryGetItem( lastSelectedItem.id );

      let data: Required<SerializedChannelItem> & WithID;
      if ( src ) {
        data = channel.duplicateItem( t0, src );
      } else {
        data = channel.createItemConstant( t0 );
        channel.changeConstantValue( data.$id, y2v( y, range, rect.height ) );
      }

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

          channel.moveItem( data.$id, x2t( x, range, rect.width ) );

          if ( 'value' in data ) {
            channel.changeConstantValue( data.$id, y2v( y, range, rect.height ) );
          }
        },
        () => {
          const t = x2t( x, range, rect.width );
          channel.moveItem( data.$id, t );
          data.time = t;

          if ( 'value' in data ) {
            const v = y2v( y, range, rect.height );
            channel.changeConstantValue( data.$id, v );
            ( data as SerializedChannelItemConstant ).value = v;
          }

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
    [ automaton, lastSelectedItem, range, rect, selectedChannel, channel ]
  );

  const handleMouseDown = useCallback(
    ( event: React.MouseEvent ): void => {
      event.preventDefault();

      if ( event.buttons === 1 ) {
        createItem(
          event.clientX - rect.left,
          event.clientY - rect.top
        );
      } else if ( event.buttons === 4 ) {
        registerMouseEvent(
          ( event, movementSum ) => move( movementSum.x, movementSum.y )
        );
      }
    },
    [ createItem, rect, move ]
  );

  const handleWheel = useCallback(
    ( event: WheelEvent ): void => {
      event.preventDefault();

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if ( event.shiftKey ) {
        zoom( x, y, event.deltaY, 0.0 );
      } else if ( event.ctrlKey ) {
        zoom( x, y, 0.0, event.deltaY );
      } else {
        move( -event.deltaX, -event.deltaY );
      }
    },
    [ zoom, rect, move ]
  );

  useEffect( // 🔥 fuck
    () => {
      const body = refBody.current;
      if ( !body ) { return; }

      body.addEventListener( 'wheel', handleWheel, { passive: false } );
      return () => (
        body.removeEventListener( 'wheel', handleWheel )
      );
    },
    [ refBody.current, handleWheel ]
  );

  if ( !automaton || !selectedChannel || !channel || !stateItems ) { return <></>; }

  return (
    <Root
      className={ className }
    >
      <Body
        ref={ refBody }
        onMouseDown={ handleMouseDown }
      >
        <SVGRoot>
          <TimeValueGrid
            range={ range }
            size={ rect }
          />
          <Items
            channel={ selectedChannel }
            range={ range }
            size={ rect }
          />
          <Lines
            channel={ selectedChannel }
            range={ range }
            size={ rect }
          />
        </SVGRoot>
      </Body>
      <StyledRangeBar
        range={ range }
        width={ rect.width }
        length={ length }
      />
    </Root>
  );
};

export { Timeline };
