import { Colors } from '../constants/Colors';
import { Icons } from '../icons/Icons';
import { MouseComboBit, mouseCombo } from '../utils/mouseCombo';
import { Resolution } from '../utils/Resolution';
import { TimeValueRange, dt2dx, dx2dt, snapTime, t2x, v2y } from '../utils/TimeValueRange';
import { objectMapHas } from '../utils/objectMap';
import { registerMouseEvent } from '../utils/registerMouseEvent';
import { registerMouseNoDragEvent } from '../utils/registerMouseNoDragEvent';
import { useDispatch, useSelector } from '../states/store';
import { useDoubleClick } from '../utils/useDoubleClick';
import { useID } from '../utils/useID';
import { useMoveEntites } from '../utils/useMoveEntities';
import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import type { StateChannelItem } from '../../types/StateChannelItem';

const HEIGHT = 12;

// == styles =======================================================================================
const ResetIcon = styled( Icons.Power )`
  position: absolute;
  fill: ${ Colors.foresub };
`;

const Side = styled.rect`
  opacity: 0.0;
  cursor: ew-resize;
  pointer-events: auto;
`;

const Text = styled.text`
  fill: ${ Colors.fore };
  font-weight: 400;
  font-size: ${ 0.8 * HEIGHT }px;
`;

const Body = styled.rect<{ isSelected: boolean; isTrigger: boolean }>`
  fill: ${ ( { isSelected } ) => ( isSelected ? Colors.accentdark : Colors.black ) };
  opacity: 0.5;
  rx: ${ ( { isTrigger } ) => ( isTrigger ? '8px' : '4px' ) };
  ry: ${ ( { isTrigger } ) => ( isTrigger ? '8px' : '4px' ) };
  cursor: pointer;
  pointer-events: auto;
`;

const Stroke = styled.rect<{ isTrigger: boolean }>`
  fill: none;
  stroke: ${ Colors.accent };
  stroke-width: 2px;
  rx: ${ ( { isTrigger } ) => ( isTrigger ? '8px' : '4px' ) };
  ry: ${ ( { isTrigger } ) => ( isTrigger ? '8px' : '4px' ) };
`;

const Root = styled.g`
  pointer-events: none;
`;

// == props ========================================================================================
export interface TimelineItemConstantProps {
  channel: string;
  item: StateChannelItem;
  range: TimeValueRange;
  size: Resolution;
  dopeSheetMode?: boolean;
}

// == component ====================================================================================
const TimelineItemConstant = ( props: TimelineItemConstantProps ): JSX.Element => {
  const { item, range, size, dopeSheetMode } = props;
  const channelName = props.channel;

  const dispatch = useDispatch();
  const checkDoubleClick = useDoubleClick();
  const textClipID = 'textClip' + useID();

  const {
    automaton,
    selectedItems,
    guiSettings
  } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
    selectedItems: state.timeline.selected.items,
    guiSettings: state.automaton.guiSettings
  } ) );

  const { moveEntities } = useMoveEntites( size );

  let x = useMemo( () => t2x( item.time, range, size.width ), [ item, range, size ] );
  let w = useMemo( () => dt2dx( item.length, range, size.width ), [ item, range, size ] );
  const y = useMemo(
    () => dopeSheetMode ? ( 0.5 * size.height ) : v2y( item.value, range, size.height ),
    [ dopeSheetMode, item, range, size ]
  );
  const isSelected = objectMapHas( selectedItems, item.$id );

  if ( item.length === 0.0 ) {
    x = x - 0.5 * HEIGHT;
    w = HEIGHT;
  }

  const channel = channelName != null && automaton?.getChannel( channelName ) || null;

  const grabBody = useCallback(
    (): void => {
      if ( !isSelected ) {
        dispatch( {
          type: 'Timeline/SelectItems',
          items: [ {
            id: item.$id,
            channel: channelName
          } ]
        } );

        dispatch( {
          type: 'Timeline/SelectChannel',
          channel: channelName
        } );
      }

      moveEntities( {
        moveValue: !dopeSheetMode,
        snapOriginTime: item.time,
        snapOriginValue: item.value,
      } );

      registerMouseNoDragEvent( () => {
        dispatch( {
          type: 'Timeline/SelectItems',
          items: [ {
            id: item.$id,
            channel: channelName
          } ]
        } );
      } );
    },
    [
      dispatch,
      item.$id,
      item.time,
      item.value,
      channelName,
      moveEntities,
      dopeSheetMode,
      isSelected,
    ]
  );

  const grabBodyCtrl = useCallback(
    (): void => {
      dispatch( {
        type: 'Timeline/SelectItemsAdd',
        items: [ {
          id: item.$id,
          channel: channelName,
        } ],
      } );

      moveEntities( {
        moveValue: !dopeSheetMode,
        snapOriginTime: item.time,
        snapOriginValue: item.value,
      } );

      registerMouseNoDragEvent( () => {
        if ( isSelected ) {
          dispatch( {
            type: 'Timeline/SelectItemsSub',
            items: [ {
              id: item.$id,
              channel: channelName,
            } ],
          } );
        }
      } );
    },
    [
      channelName,
      dispatch,
      dopeSheetMode,
      isSelected,
      item.$id,
      item.time,
      item.value,
      moveEntities,
    ]
  );

  const grabLeft = useCallback(
    (): void => {
      if ( !channel ) { return; }

      const timePrev = item.time;
      const timeEnd = item.time + item.length;
      let dx = 0.0;
      let time = timePrev;
      let hasMoved = false;

      registerMouseEvent(
        ( event, movementSum ) => {
          hasMoved = true;
          dx += movementSum.x;

          const ignoreSnap = event.altKey;

          time = timePrev + dx2dt( dx, range, size.width );

          if ( !ignoreSnap ) {
            time = snapTime( time, range, size.width, guiSettings );
          }

          channel.resizeItemByLeft( item.$id, timeEnd - time );
        },
        () => {
          if ( !hasMoved ) { return; }

          channel.resizeItemByLeft( item.$id, timeEnd - time );

          dispatch( {
            type: 'History/Push',
            description: 'Resize Constant',
            commands: [
              {
                type: 'channel/resizeItemByLeft',
                channel: channelName,
                item: item.$id,
                length: timeEnd - time,
                lengthPrev: timeEnd - timePrev,
                stretch: false
              }
            ],
          } );
        }
      );
    },
    [ channel, item, range, size, guiSettings, dispatch, channelName ]
  );

  const grabRight = useCallback(
    (): void => {
      if ( !channel ) { return; }

      const timePrev = item.time + item.length;
      const timeBegin = item.time;
      let dx = 0.0;
      let time = timePrev;
      let hasMoved = false;

      registerMouseEvent(
        ( event, movementSum ) => {
          hasMoved = true;
          dx += movementSum.x;

          const ignoreSnap = event.altKey;

          time = timePrev + dx2dt( dx, range, size.width );

          if ( !ignoreSnap ) {
            time = snapTime( time, range, size.width, guiSettings );
          }

          channel.resizeItem( item.$id, time - timeBegin );
        },
        () => {
          if ( !hasMoved ) { return; }

          channel.resizeItem( item.$id, time - timeBegin );

          dispatch( {
            type: 'History/Push',
            description: 'Resize Constant',
            commands: [
              {
                type: 'channel/resizeItem',
                channel: channelName,
                item: item.$id,
                length: time - timeBegin,
                lengthPrev: timePrev - timeBegin,
                stretch: false
              }
            ],
          } );
        }
      );
    },
    [ channel, item, range, size, guiSettings, dispatch, channelName ]
  );

  const removeItem = useCallback(
    (): void => {
      if ( !channel ) { return; }

      channel.removeItem( item.$id );

      dispatch( {
        type: 'History/Push',
        description: 'Remove Constant',
        commands: [
          {
            type: 'channel/removeItem',
            channel: channelName,
            data: item
          }
        ],
      } );
    },
    [ item, channel, dispatch, channelName ]
  );

  const handleClickBody = useCallback(
    ( event ) => mouseCombo( event, {
      [ MouseComboBit.LMB ]: () => {
        if ( checkDoubleClick() ) {
          removeItem();
        } else {
          grabBody();
        }
      },
      [ MouseComboBit.LMB + MouseComboBit.Ctrl ]: () => {
        grabBodyCtrl();
      },
      [ MouseComboBit.LMB + MouseComboBit.Shift ]: () => {
        if ( !channel ) { return; }
        const newItem = channel.repeatItem( item.$id );

        dispatch( {
          type: 'Timeline/SelectItems',
          items: [ {
            id: newItem.$id,
            channel: channelName
          } ]
        } );

        dispatch( {
          type: 'Timeline/SelectChannel',
          channel: channelName
        } );

        dispatch( {
          type: 'History/Push',
          description: 'Repeat Item',
          commands: [
            {
              type: 'channel/createItemFromData',
              channel: channelName,
              data: newItem
            }
          ]
        } );
      },
      [ MouseComboBit.LMB + MouseComboBit.Alt ]: false, // give a way to seek!
    } ),
    [
      checkDoubleClick,
      removeItem,
      grabBody,
      grabBodyCtrl,
      channel,
      item.$id,
      dispatch,
      channelName,
    ]
  );

  const handleClickLeft = useCallback(
    ( event ) => mouseCombo( event, {
      [ MouseComboBit.LMB ]: () => {
        grabLeft();
      },
      [ MouseComboBit.LMB + MouseComboBit.Alt ]: false, // give a way to seek!
    } ),
    [ grabLeft ]
  );

  const handleClickRight = useCallback(
    ( event ) => mouseCombo( event, {
      [ MouseComboBit.LMB ]: () => {
        grabRight();
      },
      [ MouseComboBit.LMB + MouseComboBit.Alt ]: false, // give a way to seek!
    } ),
    [ grabRight ]
  );

  const handleContextMenu = useCallback(
    ( event: React.MouseEvent ): void => {
      event.preventDefault();

      dispatch( {
        type: 'ContextMenu/Push',
        position: { x: event.clientX, y: event.clientY },
        commands: [
          {
            name: 'Remove',
            description: 'Remove the curve.',
            callback: () => removeItem()
          }
        ]
      } );
    },
    [ removeItem, dispatch ]
  );

  return (
    <Root
      style={ {
        transform: `translate( ${ x }px, ${ y - 0.5 * HEIGHT }px )`
      } }
    >
      <Body
        width={ w }
        height={ HEIGHT }
        isSelected={ isSelected }
        isTrigger={ item.length === 0 }
        onMouseDown={ handleClickBody }
        onContextMenu={ handleContextMenu }
      />
      { item.length === 0
        ? <Text
          x={ 1.5 * HEIGHT }
          y={ 0.85 * HEIGHT }
          dominant-baseline="middle"
        >
          { item.value.toFixed( 3 ) }
        </Text>
        : <>
          <clipPath id={ `${ textClipID }` }>
            <rect
              width={ w }
              height={ HEIGHT }
            />
          </clipPath>
          <g clipPath={ `url(#${ textClipID })` }>
            <Text
              x={ 0.15 * HEIGHT }
              y={ 0.85 * HEIGHT }
            >
              { item.value.toFixed( 3 ) }
            </Text>
          </g>
        </> }
      <Stroke
        width={ w }
        height={ HEIGHT }
        isTrigger={ item.length === 0 }
      />
      <Side
        style={ {
          transform: 'translate( -1px, 0 )'
        } }
        width="4"
        height={ HEIGHT }
        onMouseDown={ handleClickLeft }
      />
      <Side
        style={ {
          transform: `translate( ${ w - 3 }px, 0 )`
        } }
        width="4"
        height={ HEIGHT }
        onMouseDown={ handleClickRight }
      />
      { item.reset &&
        <g
          style={ {
            transform: `translate( ${ w + 5 }px, ${ 0.5 * HEIGHT - 5 }px )`
          } }
        >
          <ResetIcon
            width="10"
            height="10"
          />
        </g>
      }
    </Root>
  );
};

export { TimelineItemConstant };
