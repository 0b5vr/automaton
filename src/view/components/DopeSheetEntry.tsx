import React, { useCallback, useRef } from 'react';
import { SerializedChannelItem, SerializedChannelItemConstant } from '@fms-cat/automaton';
import { useDispatch, useSelector } from '../states/store';
import { x2t, y2v } from '../utils/TimeValueRange';
import { TimelineItem } from './TimelineItem';
import { WithID } from '../../types/WithID';
import { hasOverwrap } from '../../utils/hasOverwrap';
import { registerMouseEvent } from '../utils/registerMouseEvent';
import styled from 'styled-components';
import { useRect } from '../utils/useRect';

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

  const createItem = useCallback(
    ( x0: number, y0: number ): void => {
      if ( !automaton || !lastSelectedItem || !channel ) { return; }

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
          channel: channelName
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
    [ automaton, lastSelectedItem, range, rect, channelName, channel ]
  );

  const handleMouseDown = useCallback(
    ( event: React.MouseEvent ): void => {
      if ( event.buttons === 1 ) {
        event.preventDefault();
        event.stopPropagation();

        createItem(
          event.clientX - rect.left,
          event.clientY - rect.top
        );
      }
    },
    [ createItem, rect ]
  );

  return (
    <Root
      className={ className }
      ref={ refRoot }
      onMouseDown={ handleMouseDown }
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
