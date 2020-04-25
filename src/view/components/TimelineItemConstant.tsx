import { MouseComboBit, mouseCombo } from '../utils/mouseCombo';
import React, { useCallback, useMemo } from 'react';
import { TimeValueRange, dt2dx, dx2dt, snapTime, snapValue, t2x, v2y, x2t, y2v } from '../utils/TimeValueRange';
import { useDispatch, useSelector } from '../states/store';
import { Colors } from '../constants/Colors';
import { Resolution } from '../utils/Resolution';
import { SerializedChannelItem } from '@fms-cat/automaton';
import { WithID } from '../../types/WithID';
import { objectMapHas } from '../utils/objectMap';
import { registerMouseEvent } from '../utils/registerMouseEvent';
import styled from 'styled-components';
import { useDoubleClick } from '../utils/useDoubleClick';
import { useID } from '../utils/useID';

const HEIGHT = 12;

// == styles =======================================================================================
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
  item: Required<SerializedChannelItem> & WithID;
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
    selectedItems: state.timeline.selectedItems,
    guiSettings: state.automaton.guiSettings
  } ) );

  let x = useMemo( () => t2x( item.time, range, size.width ), [ item, range, size ] );
  let w = useMemo( () => dt2dx( item.length, range, size.width ), [ item, range, size ] );
  const y = useMemo(
    () => dopeSheetMode ? ( 0.5 * size.height ) : v2y( item.value, range, size.height ),
    [ item, range, size ]
  );
  const isSelected = objectMapHas( selectedItems, item.$id );

  if ( item.length === 0.0 ) {
    x = x - 0.5 * HEIGHT;
    w = HEIGHT;
  }

  const channel = channelName != null && automaton?.getChannel( channelName ) || null;

  const grabBody = useCallback(
    (): void => {
      if ( !channel ) { return; }

      const timePrev = item.time;
      const valuePrev = item.value;
      let x = t2x( timePrev, range, size.width );
      let y = v2y( valuePrev, range, size.height );
      let time = timePrev;
      let value = valuePrev;
      let hasMoved = false;

      registerMouseEvent(
        ( event, movementSum ) => {
          hasMoved = true;
          x += movementSum.x;
          y += movementSum.y;

          const holdTime = event.ctrlKey || event.metaKey;
          const holdValue = dopeSheetMode || event.shiftKey;
          const ignoreSnap = event.altKey;

          time = holdTime ? timePrev : x2t( x, range, size.width );
          value = holdValue ? valuePrev : y2v( y, range, size.height );

          if ( !ignoreSnap ) {
            if ( !holdTime ) { time = snapTime( time, range, size.width, guiSettings ); }
            if ( !holdValue ) { value = snapValue( value, range, size.height, guiSettings ); }
          }

          channel.moveItem( item.$id, time );
          channel.changeItemValue( item.$id, value );
        },
        () => {
          if ( !hasMoved ) { return; }

          channel.moveItem( item.$id, time );
          channel.changeItemValue( item.$id, value );

          dispatch( {
            type: 'History/Push',
            description: 'Move Constant',
            commands: [
              {
                type: 'channel/moveItem',
                channel: props.channel,
                item: item.$id,
                time,
                timePrev
              },
              {
                type: 'channel/changeItemValue',
                channel: props.channel,
                item: item.$id,
                value,
                valuePrev
              }
            ],
          } );
        }
      );
    },
    [ channel, item, range, size, dopeSheetMode, guiSettings ]
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
                channel: props.channel,
                item: item.$id,
                length: timeEnd - time,
                lengthPrev: timeEnd - timePrev
              }
            ],
          } );
        }
      );
    },
    [ channel, item, range, size, guiSettings ]
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
                channel: props.channel,
                item: item.$id,
                length: time - timeBegin,
                lengthPrev: timePrev - timeBegin
              }
            ],
          } );
        }
      );
    },
    [ channel, item, range, size, guiSettings ]
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
            channel: props.channel,
            data: item
          }
        ],
      } );
    },
    [ item, channel ]
  );

  const handleClickBody = useCallback(
    mouseCombo( {
      [ MouseComboBit.LMB ]: () => {
        if ( checkDoubleClick() ) {
          removeItem();
        } else {
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

          grabBody();
        }
      }
    } ),
    [ removeItem, grabBody ]
  );

  const handleClickLeft = useCallback(
    mouseCombo( {
      [ MouseComboBit.LMB ]: () => {
        grabLeft();
      }
    } ),
    [ grabLeft ]
  );

  const handleClickRight = useCallback(
    mouseCombo( {
      [ MouseComboBit.LMB ]: () => {
        grabRight();
      }
    } ),
    [ grabRight ]
  );

  const handleContextMenu = useCallback(
    ( event: React.MouseEvent ): void => {
      event.preventDefault();
      event.stopPropagation();

      dispatch( {
        type: 'ContextMenu/Open',
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
    [ removeItem ]
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
        ? <>
          <Text
            x={ 1.5 * HEIGHT }
            y={ 0.85 * HEIGHT }
            dominant-baseline="middle"
          >
            { item.value.toFixed( 3 ) }
          </Text>
        </>
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
    </Root>
  );
};

export { TimelineItemConstant };
