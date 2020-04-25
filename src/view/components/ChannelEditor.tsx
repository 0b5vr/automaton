import { MouseComboBit, mouseCombo } from '../utils/mouseCombo';
import React, { useCallback, useEffect, useRef } from 'react';
import { TimeValueRange, v2y, x2t, y2v } from '../utils/TimeValueRange';
import { useDispatch, useSelector } from '../states/store';
import { Colors } from '../constants/Colors';
import { RangeBar } from './RangeBar';
import { Resolution } from '../utils/Resolution';
import { SerializedChannelItem } from '@fms-cat/automaton';
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
  channel: string | null;
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
interface Props {
  className?: string;
}

// == component ====================================================================================
const ChannelEditor = ( { className }: Props ): JSX.Element => {
  const dispatch = useDispatch();
  const {
    automaton,
    selectedChannel,
    range,
    length,
    lastSelectedItem,
    selectedCurve
  } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
    selectedChannel: state.timeline.selectedChannel,
    range: state.timeline.range,
    length: state.automaton.length,
    lastSelectedItem: state.timeline.lastSelectedItem,
    selectedCurve: state.curveEditor.selectedCurve
  } ) );
  const channel = selectedChannel != null && automaton?.getChannel( selectedChannel );

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

  const createConstant = useCallback(
    ( x: number, y: number ): void => {
      if ( !selectedChannel || !channel ) { return; }

      const t = x2t( x, range, rect.width );
      const v = y2v( y, range, rect.height );

      const thereAreNoOtherItemsHere = channel.items.every( ( item ) => (
        !hasOverwrap( item.time, item.length, t, 0.0 )
      ) );

      if ( !thereAreNoOtherItemsHere ) { return; }

      const data = channel.createItemConstant( t );
      channel.changeItemValue( data.$id, v );
      data.value = v;

      dispatch( {
        type: 'Timeline/SelectItems',
        items: [ {
          id: data.$id,
          channel: selectedChannel
        } ]
      } );

      dispatch( {
        type: 'History/Push',
        description: 'Add Constant',
        commands: [
          {
            type: 'channel/createItemFromData',
            channel: selectedChannel,
            data
          }
        ],
      } );
    },
    [ range, rect, selectedChannel, channel ]
  );

  const createNewCurve = useCallback(
    ( x: number ): void => {
      if ( !automaton || !selectedChannel || !channel ) { return; }

      const t = x2t( x, range, rect.width );

      const thereAreNoOtherItemsHere = channel.items.every( ( item ) => (
        !hasOverwrap( item.time, item.length, t, 0.0 )
      ) );

      if ( !thereAreNoOtherItemsHere ) { return; }

      const curve = automaton.createCurve();
      const curveId = automaton.getCurveIndex( curve );
      const data = channel.createItemCurve( curveId, t );

      dispatch( {
        type: 'Timeline/SelectItems',
        items: [ {
          id: data.$id,
          channel: selectedChannel
        } ]
      } );

      dispatch( {
        type: 'History/Push',
        description: 'Add Curve',
        commands: [
          {
            type: 'channel/createItemFromData',
            channel: selectedChannel,
            data
          }
        ],
      } );
    },
    [ automaton, range, rect, selectedChannel, channel ]
  );

  const createItemAndGrab = useCallback(
    ( x0: number, y0: number ): void => {
      if ( !automaton || !selectedChannel || !channel ) { return; }

      let x = x0;
      let y = y0;

      const t0 = x2t( x, range, rect.width );

      const thereAreNoOtherItemsHere = channel.items.every( ( item ) => (
        !hasOverwrap( item.time, item.length, t0, 0.0 )
      ) );

      if ( !thereAreNoOtherItemsHere ) { return; }

      let data: Required<SerializedChannelItem> & WithID | null = null;

      // try last selected item
      if ( lastSelectedItem ) {
        const srcChannel = automaton.getChannel( lastSelectedItem.channel );
        const src = srcChannel?.tryGetItem( lastSelectedItem.id );
        if ( src ) {
          data = channel.duplicateItem( t0, src );
          y = v2y( data.value, range, rect.height );
        }
      }

      if ( !data ) {
        // try selected curve
        if ( selectedCurve != null ) {
          data = channel.createItemCurve( selectedCurve, t0 );
          channel.changeItemValue( data.$id, y2v( y, range, rect.height ) );
        }
      }

      // fallback to constant
      if ( !data ) {
        data = channel.createItemConstant( t0 );
        channel.changeItemValue( data.$id, y2v( y, range, rect.height ) );
      }

      const confirmedData = data!; // thanks TypeScript

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

          channel.moveItem( confirmedData.$id, x2t( x, range, rect.width ) );
          channel.changeItemValue( confirmedData.$id, y2v( y, range, rect.height ) );
        },
        () => {
          const t = x2t( x, range, rect.width );
          channel.moveItem( confirmedData.$id, t );
          confirmedData.time = t;

          const v = y2v( y, range, rect.height );
          channel.changeItemValue( confirmedData.$id, v );
          confirmedData.value = v;

          dispatch( {
            type: 'History/Push',
            description: 'Add Constant',
            commands: [
              {
                type: 'channel/createItemFromData',
                channel: selectedChannel,
                data: confirmedData
              }
            ],
          } );
        }
      );
    },
    [ automaton, lastSelectedItem, selectedCurve, range, rect, selectedChannel, channel ]
  );

  const startSeek = useCallback(
    ( x: number ): void => {
      if ( !automaton ) { return; }
      if ( automaton.isDisabledTimeControls ) { return; }

      const isPlaying = automaton.isPlaying;

      automaton.pause();
      automaton.seek( x2t( x, range, rect.width ) );

      registerMouseEvent(
        ( event ) => {
          automaton.seek( x2t( event.clientX - rect.left, range, rect.width ) );
        },
        ( event ) => {
          automaton.seek( x2t( event.clientX - rect.left, range, rect.width ) );
          if ( isPlaying ) { automaton.play(); }
        }
      );
    },
    [ automaton, range, rect ]
  );

  const handleMouseDown = useCallback(
    mouseCombo( {
      [ MouseComboBit.LMB ]: ( event ) => {
        createItemAndGrab(
          event.clientX - rect.left,
          event.clientY - rect.top
        );
      },
      [ MouseComboBit.LMB + MouseComboBit.Alt ]: ( event ) => {
        startSeek( event.clientX - rect.left );
      },
      [ MouseComboBit.MMB ]: () => {
        registerMouseEvent(
          ( event, movementSum ) => move( movementSum.x, movementSum.y )
        );
      }
    } ),
    [ createItemAndGrab, startSeek, rect, move ]
  );

  const handleContextMenu = useCallback(
    ( event: React.MouseEvent ): void => {
      event.preventDefault();
      event.stopPropagation();

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      dispatch( {
        type: 'ContextMenu/Open',
        position: { x: event.clientX, y: event.clientY },
        commands: [
          {
            name: 'Create Constant',
            description: 'Create a new constant item.',
            callback: () => createConstant( x, y )
          },
          {
            name: 'Create New Curve',
            description: 'Create a new curve and an item.',
            callback: () => createNewCurve( x )
          }
        ]
      } );
    },
    [ rect, createConstant, createNewCurve ]
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

  return (
    <Root
      className={ className }
    >
      <Body
        ref={ refBody }
        onMouseDown={ handleMouseDown }
        onContextMenu={ handleContextMenu }
      >
        <SVGRoot>
          <TimeValueGrid
            range={ range }
            size={ rect }
          />
          { selectedChannel && <>
            <Items
              channel={ selectedChannel }
              range={ range }
              size={ rect }
            />
          </> }
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

export { ChannelEditor };
