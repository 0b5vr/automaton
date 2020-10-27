import { Colors } from '../constants/Colors';
import { Labels } from './Labels';
import { MouseComboBit, mouseCombo } from '../utils/mouseCombo';
import { RangeBar } from './RangeBar';
import { Resolution } from '../utils/Resolution';
import { TimeLoopRegion } from './TimeLoopRegion';
import { TimeValueGrid } from './TimeValueGrid';
import { TimeValueLines } from './TimeValueLines';
import { TimeValueRange, dx2dt, dy2dv, snapTime, snapValue, x2t, y2v } from '../utils/TimeValueRange';
import { TimelineItem } from './TimelineItem';
import { hasOverwrap } from '../../utils/hasOverwrap';
import { registerMouseEvent } from '../utils/registerMouseEvent';
import { showToasty } from '../states/Toasty';
import { useDispatch, useSelector } from '../states/store';
import { useRect } from '../utils/useRect';
import React, { useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';
import type { StateChannelItem } from '../../types/StateChannelItem';

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
    guiSettings,
    automatonLength,
    lastSelectedItem,
    selectedCurve
  } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
    selectedChannel: state.timeline.selectedChannel,
    range: state.timeline.range,
    guiSettings: state.automaton.guiSettings,
    automatonLength: state.automaton.length,
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
      } );
    },
    [ dispatch, rect ]
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
      } );
    },
    [ dispatch, rect ]
  );

  const createConstant = useCallback(
    ( x: number, y: number ): void => {
      if ( !selectedChannel || !channel ) {
        showToasty( {
          dispatch,
          kind: 'error',
          message: 'Create Constant: No channel is selected! Select a channel before creating an item.'
        } );
        return;
      }

      const t = x2t( x - rect.left, range, rect.width );
      const v = y2v( y - rect.top, range, rect.height );

      const thereAreNoOtherItemsHere = channel.items.every( ( item ) => (
        !hasOverwrap( item.time, item.length, t, 0.0 )
      ) );

      if ( !thereAreNoOtherItemsHere ) {
        showToasty( {
          dispatch,
          kind: 'error',
          message: 'Create Constant: You cannot overwrap two items.'
        } );
        return;
      }

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
    [ range, rect, selectedChannel, channel, dispatch ]
  );

  const createNewCurve = useCallback(
    ( x: number ): void => {
      if ( !automaton ) { return; }
      if ( !selectedChannel || !channel ) {
        showToasty( {
          dispatch,
          kind: 'error',
          message: 'Create New Curve: No channel is selected! Select a channel before creating an item.'
        } );
        return;
      }

      const t = x2t( x - rect.left, range, rect.width );

      const thereAreNoOtherItemsHere = channel.items.every( ( item ) => (
        !hasOverwrap( item.time, item.length, t, 0.0 )
      ) );

      if ( !thereAreNoOtherItemsHere ) {
        showToasty( {
          dispatch,
          kind: 'error',
          message: 'Create New Curve: You cannot overwrap two items.'
        } );
        return;
      }

      const curve = automaton.createCurve();
      const curveId = curve.$id;
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
            type: 'automaton/createCurve',
            data: curve.serializeWithID()
          },
          {
            type: 'channel/createItemFromData',
            channel: selectedChannel,
            data
          }
        ],
      } );
    },
    [ automaton, range, rect, selectedChannel, channel, dispatch ]
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
            type: 'Timeline/SelectLabels',
            labels: [ name ]
          } );

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
    [ automaton, range, rect, dispatch ]
  );

  const createItemAndGrab = useCallback(
    ( x: number, y: number ): void => {
      if ( !automaton || !selectedChannel || !channel ) { return; }

      const t0 = x2t( x - rect.left, range, rect.width );

      const thereAreNoOtherItemsHere = channel.items.every( ( item ) => (
        !hasOverwrap( item.time, item.length, t0, 0.0 )
      ) );

      if ( !thereAreNoOtherItemsHere ) { return; }

      let data: StateChannelItem | null = null;

      let v0 = y2v( y - rect.top, range, rect.height );

      // try last selected item
      if ( lastSelectedItem ) {
        const srcChannel = automaton.getChannel( lastSelectedItem.channel );
        const src = srcChannel?.tryGetItem( lastSelectedItem.id );
        if ( src ) {
          data = channel.duplicateItem( t0, src );
          v0 = data.value;
        }
      }

      if ( !data ) {
        // try selected curve
        if ( selectedCurve != null ) {
          data = channel.createItemCurve( selectedCurve, t0 );
          channel.changeItemValue( data.$id, v0 );
        }
      }

      // fallback to constant
      if ( !data ) {
        data = channel.createItemConstant( t0 );
        channel.changeItemValue( data.$id, v0 );
      }

      const confirmedData = data!; // thanks TypeScript

      dispatch( {
        type: 'Timeline/SelectItems',
        items: [ {
          id: data.$id,
          channel: selectedChannel
        } ]
      } );

      let dx = 0.0;
      let dy = 0.0;
      let time = t0;
      let value = v0;

      registerMouseEvent(
        ( event, movementSum ) => {
          dx += movementSum.x;
          dy += movementSum.y;

          const holdTime = event.ctrlKey || event.metaKey;
          const holdValue = event.shiftKey;
          const ignoreSnap = event.altKey;

          time = holdTime ? t0 : ( t0 + dx2dt( dx, range, rect.width ) );
          value = holdValue ? v0 : ( v0 + dy2dv( dy, range, rect.height ) );

          if ( !ignoreSnap ) {
            if ( !holdTime ) { time = snapTime( time, range, rect.width, guiSettings ); }
            if ( !holdValue ) { value = snapValue( value, range, rect.height, guiSettings ); }
          }

          channel.moveItem( confirmedData.$id, time );
          channel.changeItemValue( confirmedData.$id, value );
        },
        () => {
          channel.moveItem( confirmedData.$id, time );
          confirmedData.time = time;
          channel.changeItemValue( confirmedData.$id, value );
          confirmedData.value = value;

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
    [
      automaton,
      lastSelectedItem,
      selectedCurve,
      range,
      rect,
      guiSettings,
      selectedChannel,
      channel,
      dispatch
    ]
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
    ( event ) => mouseCombo( event, {
      [ MouseComboBit.LMB ]: ( event ) => {
        createItemAndGrab(
          event.clientX,
          event.clientY
        );
      },
      [ MouseComboBit.LMB + MouseComboBit.Alt ]: ( event ) => {
        startSeek( event.clientX );
      },
      [ MouseComboBit.LMB + MouseComboBit.Shift + MouseComboBit.Alt ]: ( event ) => {
        startSetLoopRegion( event.clientX );
      },
      [ MouseComboBit.MMB ]: () => {
        registerMouseEvent(
          ( event, movementSum ) => move( movementSum.x, movementSum.y )
        );
      }
    } ),
    [ createItemAndGrab, startSeek, move, startSetLoopRegion ]
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
            name: 'Create Constant',
            description: 'Create a new constant item.',
            callback: () => createConstant( x, y )
          },
          {
            name: 'Create New Curve',
            description: 'Create a new curve and an item.',
            callback: () => createNewCurve( x )
          },
          {
            name: 'Create Label',
            description: 'Create a label.',
            callback: () => createLabel( x, y )
          }
        ]
      } );
    },
    [ dispatch, createConstant, createNewCurve, createLabel ]
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
          { selectedChannel && <Items
            channel={ selectedChannel }
            range={ range }
            size={ rect }
          /> }
          <Labels
            range={ range }
            size={ rect }
          />
          <TimeLoopRegion
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
        length={ automatonLength }
      />
    </Root>
  );
};

export { ChannelEditor };
