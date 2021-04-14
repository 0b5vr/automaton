import { Colors } from '../constants/Colors';
import { Labels } from './Labels';
import { MouseComboBit, mouseCombo } from '../utils/mouseCombo';
import { RangeBar } from './RangeBar';
import { RectSelectView } from './RectSelectView';
import { Resolution } from '../utils/Resolution';
import { TimeLoopRegion } from './TimeLoopRegion';
import { TimeValueGrid } from './TimeValueGrid';
import { TimeValueLines } from './TimeValueLines';
import { TimeValueRange } from '../utils/TimeValueRange';
import { TimelineItem } from './TimelineItem';
import { binarySearch } from '../utils/binarySearch';
import { hasOverwrap } from '../../utils/hasOverwrap';
import { registerMouseEvent } from '../utils/registerMouseEvent';
import { showToasty } from '../states/Toasty';
import { useDispatch, useSelector } from '../states/store';
import { useDoubleClick } from '../utils/useDoubleClick';
import { useRect } from '../utils/useRect';
import { useTimeValueRangeFuncs } from '../utils/useTimeValueRange';
import { useWheelEvent } from '../utils/useWheelEvent';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import type { StateChannelItem } from '../../types/StateChannelItem';

// == rect select - interface ======================================================================
export interface ChannelEditorRectSelectState {
  isSelecting: boolean;
  t0: number;
  v0: number;
  t1: number;
  v1: number;
}

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
    isAbsolute
  />;
};

const Items = ( { channel, range, size, rectSelect }: {
  channel: string;
  range: TimeValueRange;
  size: Resolution;
  rectSelect: {
    isSelecting: boolean;
    t0: number;
    t1: number;
    v0: number;
    v1: number;
  };
} ): JSX.Element => {
  const { sortedItems } = useSelector( ( state ) => ( {
    sortedItems: state.automaton.channels[ channel ].sortedItems,
  } ) );
  const { dt2dx } = useTimeValueRangeFuncs( range, size );

  const itemsInRange = useMemo(
    () => {
      const i0 = binarySearch(
        sortedItems,
        ( item ) => dt2dx( ( item.time + item.length ) - range.t0 ) < -20.0,
      );
      const i1 = binarySearch(
        sortedItems,
        ( item ) => dt2dx( item.time - range.t1 ) < 20.0,
      );
      return sortedItems.slice( i0, i1 );
    },
    [ dt2dx, range.t0, range.t1, sortedItems ]
  );

  return <>
    { Object.entries( itemsInRange ).map( ( [ id, item ] ) => (
      <TimelineItem
        key={ id }
        channel={ channel }
        item={ item }
        range={ range }
        size={ size }
        rectSelectState={ rectSelect }
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
  position: relative;
  overflow: hidden;
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
    automatonLength,
    lastSelectedItem,
    selectedCurve
  } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
    selectedChannel: state.timeline.selectedChannel,
    range: state.timeline.range,
    automatonLength: state.automaton.length,
    lastSelectedItem: state.timeline.lastSelectedItem,
    selectedCurve: state.curveEditor.selectedCurve
  } ) );
  const channel = selectedChannel != null && automaton?.getChannel( selectedChannel );
  const checkDoubleClick = useDoubleClick();

  const refBody = useRef<HTMLDivElement>( null );
  const rect = useRect( refBody );
  const {
    x2t,
    y2v,
    dx2dt,
    t2x,
    v2y,
    dy2dv,
    snapTime,
    snapValue,
  } = useTimeValueRangeFuncs( range, rect );

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

      const t = x2t( x - rect.left );
      const v = y2v( y - rect.top );

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
    [ selectedChannel, channel, x2t, rect.left, rect.top, y2v, dispatch ]
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

      const t = x2t( x - rect.left );

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
    [ automaton, selectedChannel, channel, x2t, rect.left, dispatch ]
  );

  const createLabel = useCallback(
    ( x: number, y: number ): void => {
      if ( !automaton ) { return; }

      const time = x2t( x - rect.left );

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
    [ automaton, x2t, rect.left, dispatch ]
  );

  const createItemAndGrab = useCallback(
    ( x: number, y: number ): void => {
      if ( !automaton || !selectedChannel || !channel ) { return; }

      const t0 = x2t( x - rect.left );

      const thereAreNoOtherItemsHere = channel.items.every( ( item ) => (
        !hasOverwrap( item.time, item.length, t0, 0.0 )
      ) );

      if ( !thereAreNoOtherItemsHere ) { return; }

      let data: StateChannelItem | null = null;

      let v0 = y2v( y - rect.top );

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

          time = holdTime ? t0 : ( t0 + dx2dt( dx ) );
          value = holdValue ? v0 : ( v0 + dy2dv( dy ) );

          if ( !ignoreSnap ) {
            if ( !holdTime ) { time = snapTime( time ); }
            if ( !holdValue ) { value = snapValue( value ); }
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
      selectedChannel,
      channel,
      x2t,
      rect.left,
      rect.top,
      y2v,
      lastSelectedItem,
      dispatch,
      selectedCurve,
      dx2dt,
      dy2dv,
      snapTime,
      snapValue,
    ]
  );

  const startSeek = useCallback(
    ( x: number ): void => {
      if ( !automaton ) { return; }

      const isPlaying = automaton.isPlaying;
      automaton.pause();

      const t0 = x2t( x - rect.left );
      automaton.seek( t0 );

      let dx = 0.0;
      let t = t0;

      registerMouseEvent(
        ( event, movementSum ) => {
          dx += movementSum.x;
          t = t0 + dx2dt( dx );
          automaton.seek( t );
        },
        () => {
          automaton.seek( t );
          if ( isPlaying ) { automaton.play(); }
        }
      );
    },
    [ automaton, dx2dt, rect.left, x2t ]
  );

  const startSetLoopRegion = useCallback(
    ( x: number ): void => {
      if ( !automaton ) { return; }

      const t0Raw = x2t( x - rect.left );
      const t0 = snapTime( t0Raw );

      let dx = 0.0;
      let t = t0;

      registerMouseEvent(
        ( event, movementSum ) => {
          dx += movementSum.x;

          const tRaw = t0 + dx2dt( dx );
          t = snapTime( tRaw );

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
    [ automaton, x2t, rect.left, snapTime, dx2dt ]
  );

  const refX2t = useRef( x2t );
  const refY2v = useRef( y2v );
  useEffect( () => { refX2t.current = x2t; }, [ x2t ] );
  useEffect( () => { refY2v.current = y2v; }, [ y2v ] );

  const [ rectSelectState, setRectSelectState ] = useState<ChannelEditorRectSelectState>( {
    isSelecting: false,
    t0: Infinity,
    t1: -Infinity,
    v0: Infinity,
    v1: -Infinity,
  } );

  const startRectSelect = useCallback(
    ( x: number, y: number ) => {
      const t0 = refX2t.current( x - rect.left );
      const v0 = refY2v.current( y - rect.top );
      let t1 = t0;
      let v1 = v0;

      setRectSelectState( {
        isSelecting: true,
        t0,
        t1,
        v0,
        v1,
      } );

      registerMouseEvent(
        ( event ) => {
          t1 = refX2t.current( event.clientX - rect.left );
          v1 = refY2v.current( event.clientY - rect.top );

          setRectSelectState( {
            isSelecting: true,
            t0: Math.min( t0, t1 ),
            t1: Math.max( t0, t1 ),
            v0: Math.min( v0, v1 ),
            v1: Math.max( v0, v1 ),
          } );
        },
        () => {
          setRectSelectState( {
            isSelecting: false,
            t0: Infinity,
            t1: -Infinity,
            v0: Infinity,
            v1: -Infinity,
          } );
        },
      );
    },
    [ rect.left, rect.top ]
  );

  const handleMouseDown = useCallback(
    ( event ) => mouseCombo( event, {
      [ MouseComboBit.LMB ]: ( event ) => {
        if ( checkDoubleClick() ) {
          createItemAndGrab(
            event.clientX,
            event.clientY
          );
        } else {
          dispatch( {
            type: 'Timeline/SelectItems',
            items: [],
          } );

          startRectSelect( event.clientX, event.clientY );
        }
      },
      [ MouseComboBit.LMB + MouseComboBit.Ctrl ]: ( event ) => {
        startRectSelect( event.clientX, event.clientY );
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
    [
      checkDoubleClick,
      createItemAndGrab,
      dispatch,
      startRectSelect,
      startSeek,
      startSetLoopRegion,
      move,
    ]
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

  useWheelEvent( refBody, handleWheel );

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
            isAbsolute
          />
          { selectedChannel && <Items
            channel={ selectedChannel }
            range={ range }
            size={ rect }
            rectSelect={ rectSelectState }
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
      { rectSelectState.isSelecting && (
        <RectSelectView
          x0={ t2x( rectSelectState.t0 ) }
          x1={ t2x( rectSelectState.t1 ) }
          y0={ v2y( rectSelectState.v1 ) }
          y1={ v2y( rectSelectState.v0 ) }
        />
      ) }
    </Root>
  );
};

export { ChannelEditor };
