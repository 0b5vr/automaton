import { MouseComboBit, mouseCombo } from '../utils/mouseCombo';
import React, { useCallback, useRef } from 'react';
import { dx2dt, snapTime, x2t } from '../utils/TimeValueRange';
import { useDispatch, useSelector } from '../states/store';
import { Colors } from '../constants/Colors';
import type { StateChannelItem } from '../../types/StateChannelItem';
import { TimelineItem } from './TimelineItem';
import { hasOverwrap } from '../../utils/hasOverwrap';
import { registerMouseEvent } from '../utils/registerMouseEvent';
import { showToasty } from '../states/Toasty';
import styled from 'styled-components';
import { useRect } from '../utils/useRect';

// == styles =======================================================================================
const SVGRoot = styled.svg`
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
  pointer-events: none;
`;

const Root = styled.div`
  display: block;
  position: relative;
  width: 100%;
  height: 20px;
  overflow: hidden;

  &:hover ${ Underlay } {
    background: ${ Colors.fore };
  }
`;

// == component ====================================================================================
interface Props {
  className?: string;
  channel: string;
}

const DopeSheetEntry = ( props: Props ): JSX.Element => {
  const { className } = props;
  const channelName = props.channel;
  const dispatch = useDispatch();
  const {
    automaton,
    range,
    lastSelectedItem,
    selectedCurve,
    stateItems,
    guiSettings
  } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
    range: state.timeline.range,
    lastSelectedItem: state.timeline.lastSelectedItem,
    selectedCurve: state.curveEditor.selectedCurve,
    stateItems: state.automaton.channels[ channelName ].items,
    guiSettings: state.automaton.guiSettings
  } ) );
  const channel = automaton?.getChannel( channelName );
  const refRoot = useRef<HTMLDivElement>( null );
  const rect = useRect( refRoot );

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
    [ range, rect, channelName, channel ]
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
    [ automaton, range, rect, channelName, channel ]
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
    [ automaton, lastSelectedItem, selectedCurve, range, rect, guiSettings, channelName, channel ]
  );

  const handleMouseDown = useCallback(
    mouseCombo( {
      [ MouseComboBit.LMB ]: ( event ) => {
        createItemAndGrab( event.clientX );
      }
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
    [ createConstant, createNewCurve ]
  );

  return (
    <Root
      className={ className }
      ref={ refRoot }
      onMouseDown={ handleMouseDown }
      onContextMenu={ handleContextMenu }
    >
      <Underlay />
      <SVGRoot>
        { Object.entries( stateItems ).map( ( [ id, item ] ) => (
          <TimelineItem
            channel={ channelName }
            key={ id }
            item={ item }
            range={ range }
            size={ rect }
            dopeSheetMode
          />
        ) ) }
      </SVGRoot>
    </Root>
  );
};

export { DopeSheetEntry };
