import { Colors } from '../constants/Colors';
import { Icons } from '../icons/Icons';
import { MouseComboBit, mouseCombo } from '../utils/mouseCombo';
import { Resolution } from '../utils/Resolution';
import { TimeValueRange, dt2dx, dx2dt, dy2dv, snapTime, snapValue, t2x, v2y } from '../utils/TimeValueRange';
import { genID } from '@fms-cat/automaton-with-gui/src/utils/genID';
import { jsonCopy } from '@fms-cat/automaton-with-gui/src/utils/jsonCopy';
import { objectMapHas } from '../utils/objectMap';
import { registerMouseEvent } from '../utils/registerMouseEvent';
import { useDispatch, useSelector } from '../states/store';
import { useDoubleClick } from '../utils/useDoubleClick';
import { useID } from '../utils/useID';
import { useMoveEntites } from '../utils/useMoveEntities';
import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import type { StateChannelItem } from '../../types/StateChannelItem';

// == styles =======================================================================================
const CurvePath = styled.polyline`
  fill: none;
  stroke: ${ Colors.fore };
  stroke-width: 2px;
  stroke-linecap: round;
  stroke-linejoin: round;
  overflow: hidden;
`;

const ResetIcon = styled( Icons.Power )`
  position: absolute;
  fill: ${ Colors.foresub };
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
  item: StateChannelItem;
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
    curves,
    guiSettings
  } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
    selectedItems: state.timeline.selected.items,
    curves: state.automaton.curves,
    guiSettings: state.automaton.guiSettings
  } ) );

  const { moveEntities } = useMoveEntites( size );

  const curve = curves[ item.curveId! ];
  const { path, length: curveLength } = curve;

  const x = useMemo( () => t2x( item.time, range, size.width ), [ item, range, size ] );
  const y0 = useMemo(
    () => dopeSheetMode ? size.height : v2y( item.value, range, size.height ),
    [ dopeSheetMode, item, range, size ]
  );
  const w = useMemo( () => dt2dx( item.length, range, size.width ), [ item, range, size ] );
  const y1 = useMemo(
    () => dopeSheetMode ? 0.0 : v2y( item.value + item.amp, range, size.height ),
    [ dopeSheetMode, item, range, size ]
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

      let isMoved = false;
      registerMouseEvent(
        () => {
          isMoved = true;
        },
        () => {
          if ( !isMoved ) {
            dispatch( {
              type: 'Timeline/SelectItems',
              items: [ {
                id: item.$id,
                channel: channelName
              } ]
            } );
          }
        },
      );
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

      let isMoved = false;
      registerMouseEvent(
        () => {
          isMoved = true;
        },
        () => {
          if ( !isMoved && isSelected ) {
            dispatch( {
              type: 'Timeline/SelectItemsSub',
              items: [ {
                id: item.$id,
                channel: channelName,
              } ],
            } );
          }
        },
      );
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

  const grabTop = useCallback(
    (): void => {
      if ( !channel ) { return; }

      const valuePrev = item.value + item.amp;
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

          channel.changeCurveAmp( item.$id, value - item.value );
        },
        () => {
          if ( !hasMoved ) { return; }

          channel.changeCurveAmp( item.$id, value - item.value );

          dispatch( {
            type: 'History/Push',
            description: 'Change Curve Amp',
            commands: [
              {
                type: 'channel/changeCurveAmp',
                channel: channelName,
                item: item.$id,
                amp: value - item.value,
                ampPrev: valuePrev - item.value
              }
            ],
          } );
        }
      );
    },
    [ channel, item, range, size, guiSettings, dispatch, channelName ]
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
                channel: channelName,
                item: item.$id,
                value,
                valuePrev
              },
              {
                type: 'channel/changeCurveAmp',
                channel: channelName,
                item: item.$id,
                amp: ceil - value,
                ampPrev: ceil - valuePrev
              }
            ],
          } );
        }
      );
    },
    [ channel, item, range, size, guiSettings, dispatch, channelName ]
  );

  const grabLeft = useCallback(
    ( stretch: boolean ): void => {
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

          channel.resizeItemByLeft( item.$id, timeEnd - time, stretch );
        },
        () => {
          if ( !hasMoved ) { return; }

          channel.resizeItemByLeft( item.$id, timeEnd - time, stretch );

          dispatch( {
            type: 'History/Push',
            description: 'Resize Curve',
            commands: [
              {
                type: 'channel/resizeItemByLeft',
                channel: channelName,
                item: item.$id,
                length: timeEnd - time,
                lengthPrev: timeEnd - timePrev,
                stretch
              }
            ],
          } );
        }
      );
    },
    [ channel, item, range, size, guiSettings, dispatch, channelName ]
  );

  const grabRight = useCallback(
    ( stretch: boolean ): void => {
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

          channel.resizeItem( item.$id, time - timeBegin, stretch );
        },
        () => {
          if ( !hasMoved ) { return; }

          channel.resizeItem( item.$id, time - timeBegin, stretch );

          dispatch( {
            type: 'History/Push',
            description: 'Resize Curve',
            commands: [
              {
                type: 'channel/resizeItem',
                channel: channelName,
                item: item.$id,
                length: time - timeBegin,
                lengthPrev: timePrev - timeBegin,
                stretch
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
        description: 'Remove Curve',
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
    ],
  );

  const handleClickLeft = useCallback(
    ( event ) => mouseCombo( event, {
      [ MouseComboBit.LMB ]: () => {
        grabLeft( false );
      },
      [ MouseComboBit.LMB + MouseComboBit.Shift ]: () => {
        grabLeft( true );
      },
      [ MouseComboBit.LMB + MouseComboBit.Alt ]: false, // give a way to seek!
    } ),
    [ grabLeft ]
  );

  const handleClickRight = useCallback(
    ( event ) => mouseCombo( event, {
      [ MouseComboBit.LMB ]: () => {
        grabRight( false );
      },
      [ MouseComboBit.LMB + MouseComboBit.Shift ]: () => {
        grabRight( true );
      },
      [ MouseComboBit.LMB + MouseComboBit.Alt ]: false, // give a way to seek!
    } ),
    [ grabRight ]
  );

  const handleClickTop = useCallback(
    ( event ) => mouseCombo( event, {
      [ MouseComboBit.LMB ]: () => {
        isFlipped ? grabBottom() : grabTop();
      },
      [ MouseComboBit.LMB + MouseComboBit.Alt ]: false, // give a way to seek!
    } ),
    [ isFlipped, grabBottom, grabTop ]
  );

  const handleClickBottom = useCallback(
    ( event ) => mouseCombo( event, {
      [ MouseComboBit.LMB ]: () => {
        isFlipped ? grabTop() : grabBottom();
      },
      [ MouseComboBit.LMB + MouseComboBit.Alt ]: false, // give a way to seek!
    } ),
    [ isFlipped, grabTop, grabBottom ]
  );

  const editCurve = useCallback(
    (): void => {
      dispatch( {
        type: 'CurveEditor/SelectCurve',
        curveId: item.curveId
      } );

      dispatch( {
        type: 'Workspace/ChangeMode',
        mode: 'curve'
      } );
    },
    [ dispatch, item.curveId ]
  );

  const makeCurveUnique = useCallback(
    (): void => {
      if ( !automaton || !channel || !item.curveId ) { return; }

      const src = automaton.getCurveById( item.curveId )!.serialize();
      const newCurveData = automaton.createCurve( src ).serializeWithID();

      const newItemData = jsonCopy( item );
      newItemData.$id = genID();
      newItemData.curveId = newCurveData.$id;

      channel.removeItem( item.$id );
      channel.createItemFromData( newItemData );

      dispatch( {
        type: 'CurveEditor/SelectCurve',
        curveId: newCurveData.$id
      } );

      dispatch( {
        type: 'Workspace/ChangeMode',
        mode: 'curve'
      } );

      dispatch( {
        type: 'History/Push',
        description: 'Make Curve Unique',
        commands: [
          {
            type: 'automaton/createCurve',
            data: newCurveData,
          },
          {
            type: 'channel/removeItem',
            channel: channelName,
            data: item,
          },
          {
            type: 'channel/createItemFromData',
            channel: channelName,
            data: newItemData,
          }
        ],
      } );
    },
    [ automaton, channel, channelName, dispatch, item ]
  );

  const handleContextMenu = useCallback(
    ( event: React.MouseEvent ): void => {
      event.preventDefault();

      dispatch( {
        type: 'ContextMenu/Push',
        position: { x: event.clientX, y: event.clientY },
        commands: [
          {
            name: 'Edit Curve',
            description: 'Edit the curve.',
            callback: () => editCurve()
          },
          {
            name: 'Make Curve Unique',
            description: 'Duplicate the curve.',
            callback: () => makeCurveUnique()
          },
          {
            name: 'Remove',
            description: 'Remove the curve.',
            callback: () => removeItem()
          }
        ]
      } );
    },
    [ dispatch, editCurve, makeCurveUnique, removeItem ]
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
      { item.reset &&
        <g
          style={ {
            transform: `translate( ${ w + 5 }px, ${ h - 10 }px )`
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

export { TimelineItemCurve };
