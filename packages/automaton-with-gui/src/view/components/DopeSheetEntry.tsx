import { ChannelEditorRectSelectState } from './ChannelEditor';
import { Colors } from '../constants/Colors';
import { DopeSheetRectSelectState } from './DopeSheet';
import { Metrics } from '../constants/Metrics';
import { MouseComboBit, mouseCombo } from '../utils/mouseCombo';
import { TimeRange } from '../utils/TimeValueRange';
import { TimelineItem } from './TimelineItem';
import { arraySetHas } from '../utils/arraySet';
import { binarySearch } from '../utils/binarySearch';
import { hasOverwrap } from '../../utils/hasOverwrap';
import { registerMouseEvent } from '../utils/registerMouseEvent';
import { showToasty } from '../states/Toasty';
import { useDispatch, useSelector } from '../states/store';
import { useDoubleClick } from '../utils/useDoubleClick';
import { useIntersection } from '../utils/useIntersection';
import { useRect } from '../utils/useRect';
import { useSelectAllItemsInChannel } from '../gui-operation-hooks/useSelectAllItemsInChannel';
import { useTimeValueRangeFuncs } from '../utils/useTimeValueRange';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import type { StateChannelItem } from '../../types/StateChannelItem';

// == styles =======================================================================================
const SVGRoot = styled.svg`
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

const Underlay = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  opacity: 0.08;
`;

const Proximity = styled.div`
  position: absolute;
  left: 0;
  top: -100px;
  width: 100%;
  height: calc( 100% + 200px );
  pointer-events: none;
`;

const Container = styled.div`
  position: absolute;
  width: 100%;
  height: ${ Metrics.channelListEntyHeight - 2 }px;
  overflow: hidden;

  &:hover ${ Underlay } {
    background: ${ Colors.fore };
  }
`;

const Root = styled.div`
  display: block;
  position: relative;
  width: 100%;
  height: ${ Metrics.channelListEntyHeight - 2 }px;
`;

// == a content - if it isn't intersecting, return an empty div instead ============================
const Content = ( props: {
  channel: string;
  range: TimeRange;
  rectSelectState: DopeSheetRectSelectState;
  refRoot: React.RefObject<HTMLDivElement>;
} ): JSX.Element => {
  const { range, refRoot, rectSelectState } = props;
  const channelName = props.channel;
  const dispatch = useDispatch();
  const {
    automaton,
    lastSelectedItem,
    selectedCurve,
    sortedItems,
  } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
    lastSelectedItem: state.timeline.lastSelectedItem,
    selectedCurve: state.curveEditor.selectedCurve,
    stateItems: state.automaton.channels[ channelName ].items,
    sortedItems: state.automaton.channels[ channelName ].sortedItems,
  } ) );
  const checkDoubleClick = useDoubleClick();
  const selectAllItemsInChannel = useSelectAllItemsInChannel();

  const channel = automaton?.getChannel( channelName );
  const rect = useRect( refRoot );

  // since TimelineItem only accepts TimeValueRange,,,
  const timeValueRange = useMemo(
    () => ( {
      t0: range.t0,
      t1: range.t1,
      v0: 0.0,
      v1: 1.0,
    } ),
    [ range.t0, range.t1 ]
  );

  const {
    x2t,
    dx2dt,
    dt2dx,
    snapTime,
  } = useTimeValueRangeFuncs( timeValueRange, rect );

  const channelIsRectSelected = useMemo(
    () => arraySetHas( rectSelectState.channels, channelName ),
    [ channelName, rectSelectState.channels ],
  );

  const rectSelectStateForItem: ChannelEditorRectSelectState = useMemo(
    () => {
      return {
        isSelecting: rectSelectState.isSelecting,
        t0: rectSelectState.t0,
        t1: rectSelectState.t1,
        v0: channelIsRectSelected ? -Infinity : Infinity,
        v1: channelIsRectSelected ? Infinity : -Infinity,
      };
    },
    [ channelIsRectSelected, rectSelectState.isSelecting, rectSelectState.t0, rectSelectState.t1 ],
  );

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

  const createConstant = useCallback(
    ( x: number ): void => {
      if ( !channel ) { return; }

      const t = x2t( x - rect.left );

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

      dispatch( {
        type: 'Timeline/SelectItems',
        items: [ {
          id: data.$id,
          channel: channelName
        } ]
      } );

      dispatch( {
        type: 'History/Push',
        description: 'Add Constant',
        commands: [
          {
            type: 'channel/createItemFromData',
            channel: channelName,
            data
          }
        ],
      } );
    },
    [ channel, x2t, rect.left, dispatch, channelName ]
  );

  const createNewCurve = useCallback(
    ( x: number ): void => {
      if ( !automaton || !channel ) { return; }

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
          channel: channelName
        } ]
      } );

      dispatch( {
        type: 'History/Push',
        description: 'Add New Curve',
        commands: [
          {
            type: 'automaton/createCurve',
            data: curve.serializeWithID()
          },
          {
            type: 'channel/createItemFromData',
            channel: channelName,
            data
          }
        ],
      } );
    },
    [ automaton, channel, x2t, rect.left, dispatch, channelName ]
  );

  const createItemAndGrab = useCallback(
    ( x: number ): void => {
      if ( !automaton || !channel ) { return; }

      const t0 = x2t( x - rect.left );

      const thereAreNoOtherItemsHere = channel.items.every( ( item ) => (
        !hasOverwrap( item.time, item.length, t0, 0.0 )
      ) );

      if ( !thereAreNoOtherItemsHere ) { return; }

      let data: StateChannelItem | null = null;

      // try last selected item
      if ( lastSelectedItem ) {
        const srcChannel = automaton.getChannel( lastSelectedItem.channel );
        const src = srcChannel?.tryGetItem( lastSelectedItem.id );
        if ( src ) {
          data = channel.duplicateItem( t0, src );
        }
      }

      if ( !data ) {
        // try selected curve
        if ( selectedCurve != null ) {
          data = channel.createItemCurve( selectedCurve, t0 );
        }
      }

      // fallback to constant
      if ( !data ) {
        data = channel.createItemConstant( t0 );
      }

      const confirmedData = data!; // thanks TypeScript

      dispatch( {
        type: 'Timeline/SelectItems',
        items: [ {
          id: data.$id,
          channel: channelName
        } ]
      } );

      let dx = 0.0;
      let time = t0;

      registerMouseEvent(
        ( event, movementSum ) => {
          dx += movementSum.x;

          const ignoreSnap = event.altKey;

          time = t0 + dx2dt( dx );

          if ( !ignoreSnap ) {
            time = snapTime( time );
          }

          channel.moveItem( confirmedData.$id, time );
        },
        () => {
          channel.moveItem( confirmedData.$id, time );
          confirmedData.time = time;

          dispatch( {
            type: 'History/Push',
            description: confirmedData.curveId != null ? 'Add Curve' : 'Add Constant',
            commands: [
              {
                type: 'channel/createItemFromData',
                channel: channelName,
                data: confirmedData
              }
            ],
          } );
        }
      );
    },
    [
      automaton,
      channel,
      x2t,
      rect.left,
      lastSelectedItem,
      dispatch,
      channelName,
      selectedCurve,
      dx2dt,
      snapTime,
    ],
  );

  const handleMouseDown = useCallback(
    ( event ) => mouseCombo( event, {
      [ MouseComboBit.LMB ]: ( event ) => {
        if ( checkDoubleClick() ) {
          createItemAndGrab( event.clientX );
        } else {
          return false;
        }
      },
      [ MouseComboBit.LMB + MouseComboBit.Alt ]: false, // give a way to seek!
    } ),
    [ checkDoubleClick, createItemAndGrab ]
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
            callback: () => createConstant( x )
          },
          {
            name: 'Create New Curve',
            description: 'Create a new curve and an item.',
            callback: () => createNewCurve( x )
          },
          {
            name: 'Select All Items In Channel',
            description: 'Select all items in the channel.',
            callback: () => selectAllItemsInChannel( channelName )
          },
        ]
      } );
    },
    [ dispatch, createConstant, createNewCurve, selectAllItemsInChannel, channelName ]
  );

  const items = useMemo(
    () => (
      Object.entries( itemsInRange ).map( ( [ id, item ] ) => (
        <TimelineItem
          channel={ channelName }
          key={ id }
          item={ item }
          range={ timeValueRange }
          size={ rect }
          rectSelectState={ rectSelectStateForItem }
          dopeSheetMode
        />
      ) )
    ),
    [ channelName, itemsInRange, rect, rectSelectStateForItem, timeValueRange ]
  );

  return <Container>
    <Underlay
      onMouseDown={ handleMouseDown }
      onContextMenu={ handleContextMenu }
    />
    <SVGRoot>
      { items }
    </SVGRoot>
  </Container>;
};

// == component ====================================================================================
const DopeSheetEntry = ( props: {
  className?: string;
  channel: string;
  range: TimeRange;
  rectSelectState: DopeSheetRectSelectState;
  intersectionRoot: HTMLElement | null;
} ): JSX.Element => {
  const { range, className, intersectionRoot, rectSelectState } = props;
  const channelName = props.channel;

  const refRoot = useRef<HTMLDivElement>( null );
  const refProximity = useRef<HTMLDivElement>( null );

  // whether the channel is out of screen or not
  const isIntersecting = useIntersection( refProximity, {
    root: intersectionRoot,
  } );

  // want to select out of screen channels properly
  const channelIsRectSelected = useMemo(
    () => arraySetHas( rectSelectState.channels, channelName ),
    [ channelName, rectSelectState.channels ],
  );

  // a single update will be required to unselect out of screen channels properly
  const [ prevChannelIsRectSelected, setPrevChannelIsRectSelected ] = useState( false );
  useEffect(
    () => {
      setPrevChannelIsRectSelected( channelIsRectSelected );
    },
    [ channelIsRectSelected ],
  );

  const shouldShowContent = isIntersecting
    || channelIsRectSelected
    || prevChannelIsRectSelected;

  return (
    <Root
      className={ className }
      ref={ refRoot }
    >
      <Proximity
        ref={ refProximity }
      />
      { shouldShowContent ? <Content
        channel={ channelName }
        range={ range }
        rectSelectState={ rectSelectState }
        refRoot={ refRoot }
      /> : null }
    </Root>
  );
};

export { DopeSheetEntry };
