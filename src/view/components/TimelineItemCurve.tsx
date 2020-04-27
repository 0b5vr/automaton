import { MouseComboBit, mouseCombo } from '../utils/mouseCombo';
import React, { useCallback, useMemo } from 'react';
import { TimeValueRange, dt2dx, dx2dt, dy2dv, snapTime, snapValue, t2x, v2y, x2t, y2v } from '../utils/TimeValueRange';
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

// == styles =======================================================================================
const CurvePath = styled.polyline`
  fill: none;
  stroke: ${ Colors.fore };
  stroke-width: 2px;
  stroke-linecap: round;
  stroke-linejoin: round;
  overflow: hidden;
`;

const Side = styled.rect`
  opacity: 0.0;
  cursor: ew-resize;
  pointer-events: auto;
`;

const VerticalSide = styled.rect`
  opacity: 0.0;
  cursor: ns-resize;
  pointer-events: auto;
`;

const Body = styled.rect<{ isSelected: boolean }>`
  fill: ${ ( { isSelected } ) => ( isSelected ? Colors.accentdark : Colors.black ) };
  opacity: 0.5;
  rx: 4px;
  ry: 4px;
  cursor: pointer;
  pointer-events: auto;
`;

const Stroke = styled.rect`
  fill: none;
  stroke: ${ Colors.accent };
  stroke-width: 2px;
  rx: 4px;
  ry: 4px;
`;

const Root = styled.g`
  pointer-events: none;
`;

// == props ========================================================================================
export interface TimelineItemCurveProps {
  channel: string;
  item: Required<SerializedChannelItem> & WithID;
  range: TimeValueRange;
  size: Resolution;
  dopeSheetMode?: boolean;
}

// == component ====================================================================================
const TimelineItemCurve = ( props: TimelineItemCurveProps ): JSX.Element => {
  const { item, range, size, dopeSheetMode } = props;
  const channelName = props.channel;

  const dispatch = useDispatch();
  const checkDoubleClick = useDoubleClick();
  const curveClipID = 'curveClip' + useID();

  const {
    automaton,
    selectedItems,
    path,
    curveLength,
    guiSettings
  } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
    selectedItems: state.timeline.selectedItems,
    path: state.automaton.curves[ item.curve! ].path,
    curveLength: state.automaton.curves[ item.curve! ].length,
    guiSettings: state.automaton.guiSettings
  } ) );

  const x = useMemo( () => t2x( item.time, range, size.width ), [ item, range, size ] );
  const y0 = useMemo(
    () => dopeSheetMode ? size.height : v2y( item.value, range, size.height ),
    [ item, range, size ]
  );
  const w = useMemo( () => dt2dx( item.length, range, size.width ), [ item, range, size ] );
  const y1 = useMemo(
    () => dopeSheetMode ? 0.0 : v2y( item.value + item.amp, range, size.height ),
    [ item, range, size ]
  );

  const y = Math.min( y0, y1 );
  const h = Math.abs( y0 - y1 );
  const isFlipped = y0 < y1;

  const curveX = useMemo(
    () => dt2dx( -item.offset / item.speed, range, size.width ),
    [ item.offset, item.speed, range, size ]
  );
  const curveWidth = useMemo(
    () => dt2dx( curveLength / item.speed, range, size.width ),
    [ item.speed, curveLength, range, size ]
  );
  const isSelected = objectMapHas( selectedItems, item.$id );

  const channel = automaton?.getChannel( channelName );

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
            description: 'Move Curve',
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
    [ channel, item, range, size, guiSettings ]
  );

  const grabTop = useCallback(
    (): void => {
      if ( !channel ) { return; }

      const ampPrev = item.amp;
      let dy = 0.0;
      let amp = ampPrev;
      let hasMoved = false;

      registerMouseEvent(
        ( event, movementSum ) => {
          hasMoved = true;
          dy += movementSum.y;

          const ignoreSnap = event.altKey;

          amp = ampPrev + dy2dv( dy, range, size.height );

          if ( !ignoreSnap ) {
            amp = snapValue( amp, range, size.height, guiSettings );
          }

          channel.changeCurveAmp( item.$id, amp );
        },
        () => {
          if ( !hasMoved ) { return; }

          channel.changeCurveAmp( item.$id, amp );

          dispatch( {
            type: 'History/Push',
            description: 'Change Curve Amp',
            commands: [
              {
                type: 'channel/changeCurveAmp',
                channel: props.channel,
                item: item.$id,
                amp,
                ampPrev
              }
            ],
          } );
        }
      );
    },
    [ channel, item, range, size, guiSettings ]
  );

  const grabBottom = useCallback(
    (): void => {
      if ( !channel ) { return; }

      const valuePrev = item.value;
      const ceil = valuePrev + item.amp;
      let dy = 0.0;
      let value = valuePrev;
      let hasMoved = false;

      registerMouseEvent(
        ( event, movementSum ) => {
          hasMoved = true;
          dy += movementSum.y;

          const ignoreSnap = event.altKey;

          value = valuePrev + dy2dv( dy, range, size.height );

          if ( !ignoreSnap ) {
            value = snapValue( value, range, size.height, guiSettings );
          }

          channel.changeItemValue( item.$id, value );
          channel.changeCurveAmp( item.$id, ceil - value );
        },
        () => {
          if ( !hasMoved ) { return; }

          channel.changeItemValue( item.$id, value );
          channel.changeCurveAmp( item.$id, ceil - value );

          dispatch( {
            type: 'History/Push',
            description: 'Change Curve Amp',
            commands: [
              {
                type: 'channel/changeItemValue',
                channel: props.channel,
                item: item.$id,
                value,
                valuePrev
              },
              {
                type: 'channel/changeCurveAmp',
                channel: props.channel,
                item: item.$id,
                amp: ceil - value,
                ampPrev: ceil - valuePrev
              }
            ],
          } );
        }
      );
    },
    [ channel, item, range, size, guiSettings ]
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
            description: 'Resize Curve',
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
            description: 'Resize Curve',
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
        description: 'Remove Curve',
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
      }
    } ),
    [ removeItem, grabBody, channel, channelName ]
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

  const handleClickTop = useCallback(
    mouseCombo( {
      [ MouseComboBit.LMB ]: () => {
        isFlipped ? grabBottom() : grabTop();
      }
    } ),
    [ grabTop, grabBottom ]
  );

  const handleClickBottom = useCallback(
    mouseCombo( {
      [ MouseComboBit.LMB ]: () => {
        isFlipped ? grabTop() : grabBottom();
      }
    } ),
    [ grabTop, grabBottom ]
  );

  const editCurve = useCallback(
    (): void => {
      dispatch( {
        type: 'CurveEditor/SelectCurve',
        curve: item.curve
      } );

      dispatch( {
        type: 'Workspace/ChangeMode',
        mode: 'curve'
      } );
    },
    [ item.curve ]
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
            name: 'Edit',
            description: 'Edit the curve.',
            callback: () => editCurve()
          },
          {
            name: 'Remove',
            description: 'Remove the curve.',
            callback: () => removeItem()
          }
        ]
      } );
    },
    [ editCurve, removeItem ]
  );

  return (
    <Root
      style={ {
        transform: `translate( ${ x }px, ${ y }px )`
      } }
    >
      <clipPath
        id={ `${ curveClipID }` }
      >
        <rect
          style={ {
            transform: `translate( 0, ${ -y }px )`
          } }
          width={ w }
          height={ size.height }
        />
      </clipPath>
      <Body
        width={ w }
        height={ h }
        isSelected={ isSelected }
        onMouseDown={ handleClickBody }
        onContextMenu={ handleContextMenu }
      />
      <g
        clipPath={ `url(#${ curveClipID })` }
      >
        <CurvePath
          style={ {
            transform: (
              isFlipped
                ? `translate( ${ curveX }px, 0 ) scale( ${ curveWidth }, ${ h } )`
                : `translate( ${ curveX }px, ${ h }px ) scale( ${ curveWidth }, ${ -h } )`
            )
          } }
          points={ path }
          vectorEffect="non-scaling-stroke"
        />
      </g>
      <Stroke
        width={ w }
        height={ h }
      />
      { !dopeSheetMode && <>
        <VerticalSide
          style={ {
            transform: 'translate( 0, -1px )'
          } }
          width={ w }
          height="4"
          onMouseDown={ handleClickTop }
        />
        <VerticalSide
          style={ {
            transform: `translate( 0, ${ h - 3 }px )`
          } }
          width={ w }
          height="4"
          onMouseDown={ handleClickBottom }
        />
      </> }
      <Side
        style={ {
          transform: 'translate( -1px, 0 )'
        } }
        width="4"
        height={ h }
        onMouseDown={ handleClickLeft }
      />
      <Side
        style={ {
          transform: `translate( ${ w - 3 }px, 0 )`
        } }
        width="4"
        height={ h }
        onMouseDown={ handleClickRight }
      />
    </Root>
  );
};

export { TimelineItemCurve };
