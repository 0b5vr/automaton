import React, { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from '../states/store';
import { SerializedChannelItem } from '@fms-cat/automaton';
import { TimelineItem } from './TimelineItem';
import { WithID } from '../../types/WithID';
import { hasOverwrap } from '../../utils/hasOverwrap';
import { registerMouseEvent } from '../utils/registerMouseEvent';
import styled from 'styled-components';
import { useRect } from '../utils/useRect';
import { x2t } from '../utils/TimeValueRange';

// == styles =======================================================================================
const SVGRoot = styled.svg`
  width: 100%;
  height: 100%;
`;

const Root = styled.div`
  display: block;
  position: relative;
  width: 100%;
  height: 20px;
  overflow: hidden;
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
    stateItems
  } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
    range: state.timeline.range,
    lastSelectedItem: state.timeline.lastSelectedItem,
    stateItems: state.automaton.channels[ channelName ].items
  } ) );
  const channel = automaton?.getChannel( channelName );
  const refRoot = useRef<HTMLDivElement>( null );
  const rect = useRect( refRoot );

  const createConstant = useCallback(
    ( x: number ): void => {
      if ( !channel ) { return; }

      const t = x2t( x, range, rect.width );

      const thereAreNoOtherItemsHere = channel.items.every( ( item ) => (
        !hasOverwrap( item.time, item.length, t, 0.0 )
      ) );

      if ( !thereAreNoOtherItemsHere ) { return; }

      const data = channel.createItemConstant( t );

      dispatch( {
        type: 'Timeline/SelectItems',
        items: [ {
          id: data.$id,
          channel: channelName
        } ]
      } );

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
    },
    [ range, rect, channelName, channel ]
  );

  const createNewCurve = useCallback(
    ( x: number ): void => {
      if ( !automaton || !channel ) { return; }

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
          channel: channelName
        } ]
      } );

      const undo = (): void => {
        channel.removeItem( data.$id );
      };

      const redo = (): void => {
        channel.createItemFromData( data );
      };

      dispatch( {
        type: 'History/Push',
        entry: {
          description: 'Add Curve',
          redo,
          undo
        }
      } );
    },
    [ automaton, range, rect, channelName, channel ]
  );

  const createItemAndGrab = useCallback(
    ( x0: number ): void => {
      if ( !automaton || !lastSelectedItem || !channel ) { return; }

      let x = x0;

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
      }

      dispatch( {
        type: 'Timeline/SelectItems',
        items: [ {
          id: data.$id,
          channel: channelName
        } ]
      } );

      registerMouseEvent(
        ( event, movementSum ) => {
          x += movementSum.x;

          channel.moveItem( data.$id, x2t( x, range, rect.width ) );
        },
        () => {
          const t = x2t( x, range, rect.width );
          channel.moveItem( data.$id, t );
          data.time = t;

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
    [ automaton, lastSelectedItem, range, rect, channelName, channel ]
  );

  const handleMouseDown = useCallback(
    ( event: React.MouseEvent ): void => {
      if ( event.buttons === 1 ) {
        if ( event.altKey ) { return; } // to perform seek

        event.preventDefault();
        event.stopPropagation();

        createItemAndGrab( event.clientX - rect.left );
      }
    },
    [ createItemAndGrab, rect ]
  );

  const handleContextMenu = useCallback(
    ( event: React.MouseEvent ): void => {
      event.preventDefault();
      event.stopPropagation();

      const x = event.clientX - rect.left;

      dispatch( {
        type: 'ContextMenu/Open',
        position: { x: event.clientX, y: event.clientY },
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
    [ rect, createConstant, createNewCurve ]
  );

  return (
    <Root
      className={ className }
      ref={ refRoot }
      onMouseDown={ handleMouseDown }
      onContextMenu={ handleContextMenu }
    >
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
