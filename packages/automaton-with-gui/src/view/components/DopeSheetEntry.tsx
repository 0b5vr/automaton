import { Colors } from '../constants/Colors';
import { MouseComboBit, mouseCombo } from '../utils/mouseCombo';
import { TimeRange, dt2dx, dx2dt, snapTime, x2t } from '../utils/TimeValueRange';
import { TimelineItem } from './TimelineItem';
import { binarySearch } from '../utils/binarySearch';
import { hasOverwrap } from '../../utils/hasOverwrap';
import { registerMouseEvent } from '../utils/registerMouseEvent';
import { showToasty } from '../states/Toasty';
import { useDispatch, useSelector } from '../states/store';
import { useIntersection } from '../utils/useIntersection';
import { useRect } from '../utils/useRect';
import React, { useCallback, useMemo, useRef } from 'react';
import styled from 'styled-components';
import type { StateChannelItem } from '../../types/StateChannelItem';

// == styles =======================================================================================
const SVGRoot = styled.svg`
  position: absolute;
  width: 100%;
  height: 100%;
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
  height: 18px;
  overflow: hidden;

  &:hover ${ Underlay } {
    background: ${ Colors.fore };
  }
`;

const Root = styled.div`
  display: block;
  position: relative;
  width: 100%;
  height: 18px;
`;

// == a content - if it isn't intersecting, return an empty div instead ============================
const Content = ( props: {
  channel: string;
  range: TimeRange;
  refRoot: React.RefObject<HTMLDivElement>;
} ): JSX.Element => {
  const { range, refRoot } = props;
  const channelName = props.channel;
  const dispatch = useDispatch();
  const {
    automaton,
    lastSelectedItem,
    selectedCurve,
    sortedItems,
    guiSettings
  } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
    lastSelectedItem: state.timeline.lastSelectedItem,
    selectedCurve: state.curveEditor.selectedCurve,
    stateItems: state.automaton.channels[ channelName ].items,
    sortedItems: state.automaton.channels[ channelName ].sortedItems,
    guiSettings: state.automaton.guiSettings
  } ) );

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

  const itemsInRange = useMemo(
    () => {
      const i0 = binarySearch(
        sortedItems,
        ( item ) => dt2dx( ( item.time + item.length ) - range.t0, range, rect.width ) < -20.0,
      );
      const i1 = binarySearch(
        sortedItems,
        ( item ) => dt2dx( item.time - range.t1, range, rect.width ) < 20.0,
      );
      return sortedItems.slice( i0, i1 );
    },
    [ range, rect.width, sortedItems ]
  );

  const createConstant = useCallback(
    ( x: number ): void => {
      if ( !channel ) { return; }

      const t = x2t( x - rect.left, range, rect.width );

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
    [ range, rect, channelName, channel, dispatch ]
  );

  const createNewCurve = useCallback(
    ( x: number ): void => {
      if ( !automaton || !channel ) { return; }

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
    [ automaton, range, rect, channelName, channel, dispatch ]
  );

  const createItemAndGrab = useCallback(
    ( x: number ): void => {
      if ( !automaton || !channel ) { return; }

      const t0 = x2t( x - rect.left, range, rect.width );

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

          time = t0 + dx2dt( dx, range, rect.width );

          if ( !ignoreSnap ) {
            time = snapTime( time, range, rect.width, guiSettings );
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
    [ automaton,
      lastSelectedItem,
      selectedCurve,
      range,
      rect,
      guiSettings,
      channelName,
      channel,
      dispatch
    ]
  );

  const handleMouseDown = useCallback(
    ( event ) => mouseCombo( event, {
      [ MouseComboBit.LMB ]: ( event ) => {
        createItemAndGrab( event.clientX );
      },
      [ MouseComboBit.LMB + MouseComboBit.Alt ]: false, // give a way to seek!
    } ),
    [ createItemAndGrab ]
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
          }
        ]
      } );
    },
    [ dispatch, createConstant, createNewCurve ]
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
          dopeSheetMode
        />
      ) )
    ),
    [ channelName, itemsInRange, rect, timeValueRange ]
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
  intersectionRoot: HTMLElement | null;
} ): JSX.Element => {
  const { className, intersectionRoot } = props;

  const refRoot = useRef<HTMLDivElement>( null );
  const refProximity = useRef<HTMLDivElement>( null );

  const isIntersecting = useIntersection( refProximity, {
    root: intersectionRoot,
  } );

  return (
    <Root
      className={ className }
      ref={ refRoot }
    >
      <Proximity
        ref={ refProximity }
      />
      { isIntersecting ? <Content
        channel={ props.channel }
        range={ props.range }
        refRoot={ refRoot }
      /> : null }
    </Root>
  );
};

export { DopeSheetEntry };
