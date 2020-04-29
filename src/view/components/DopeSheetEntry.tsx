import { MouseComboBit, mouseCombo } from '../utils/mouseCombo';
import React, { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from '../states/store';
import { SerializedChannelItem } from '@fms-cat/automaton';
import { TimelineItem } from './TimelineItem';
import { WithID } from '../../types/WithID';
import { hasOverwrap } from '../../utils/hasOverwrap';
import { registerMouseEvent } from '../utils/registerMouseEvent';
import { showToasty } from '../states/Toasty';
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
    selectedCurve,
    stateItems
  } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
    range: state.timeline.range,
    lastSelectedItem: state.timeline.lastSelectedItem,
    selectedCurve: state.curveEditor.selectedCurve,
    stateItems: state.automaton.channels[ channelName ].items
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
      const curveId = automaton.getCurveIndex( curve );
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
            index: curveId
          },
          {
            type: 'channel/createItemFromData',
            channel: channelName,
            data: data
          }
        ],
      } );
    },
    [ automaton, range, rect, channelName, channel ]
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
    [ automaton, range, rect ]
  );

  const createItemAndGrab = useCallback(
    ( x0: number ): void => {
      if ( !automaton || !channel ) { return; }

      let x = x0;

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

      registerMouseEvent(
        ( event, movementSum ) => {
          x += movementSum.x;

          channel.moveItem( confirmedData.$id, x2t( x, range, rect.width ) );
        },
        () => {
          const t = x2t( x, range, rect.width );
          channel.moveItem( confirmedData.$id, t );
          confirmedData.time = t;

          dispatch( {
            type: 'History/Push',
            description: confirmedData.curve != null ? 'Add Curve' : 'Add Constant',
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
    [ automaton, lastSelectedItem, selectedCurve, range, rect, channelName, channel ]
  );

  const handleMouseDown = useCallback(
    mouseCombo( {
      [ MouseComboBit.LMB ]: ( event ) => {
        createItemAndGrab( event.clientX - rect.left );
      }
    } ),
    [ createItemAndGrab, rect ]
  );

  const handleContextMenu = useCallback(
    ( event: React.MouseEvent ): void => {
      event.preventDefault();
      event.stopPropagation();

      const x = event.clientX;
      const y = event.clientY;

      dispatch( {
        type: 'ContextMenu/Open',
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
            name: 'Create Label',
            description: 'Create a label.',
            callback: () => createLabel( x, y )
          }
        ]
      } );
    },
    [ rect, createConstant, createNewCurve, createLabel ]
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
