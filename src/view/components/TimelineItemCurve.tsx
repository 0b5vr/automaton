import React, { useCallback, useMemo } from 'react';
import { TimeValueRange, dt2dx, dx2dt, snapTime, t2x, v2y, x2t } from '../utils/TimeValueRange';
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
    () => dopeSheetMode ? size.height : v2y( 0.0, range, size.height ),
    [ range, size ]
  );
  const w = useMemo( () => dt2dx( item.length, range, size.width ), [ item, range, size ] );
  const y1 = useMemo(
    () => dopeSheetMode ? 0.0 : v2y( 1.0, range, size.height ),
    [ range, size ]
  );

  const y = Math.min( y0, y1 );
  const h = Math.abs( y0 - y1 );
  const isFlipped = y0 < y1;

  const curveX = useMemo(
    () => dt2dx( -item.offset / item.speed, range, size.width ),
    [ item.offset, item.speed, curveLength, range, size ]
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

      const tPrev = item.time;
      // const vPrev = item.value;
      let x = t2x( tPrev, range, size.width );
      // let y = v2y( vPrev, range, size.height );
      let t = tPrev;
      // let v = vPrev;
      let hasMoved = false;

      registerMouseEvent(
        ( event, movementSum ) => {
          hasMoved = true;
          x += movementSum.x;
          // y += movementSum.y;

          const holdTime = event.ctrlKey || event.metaKey;
          // const holdValue = event.shiftKey;
          const ignoreSnap = event.altKey;

          t = holdTime ? tPrev : x2t( x, range, size.width );
          // v = holdValue ? vPrev : y2v( y, range, size.height );

          if ( !ignoreSnap ) {
            if ( !holdTime ) { t = snapTime( t, range, size.width, guiSettings ); }
            // if ( !holdValue ) { v = snapValue( v, range, size.height, guiSettings ); }
          }

          channel.moveItem( item.$id, t );
          // channel.moveNodeValue( node.$id, v );
        },
        () => {
          if ( !hasMoved ) { return; }

          const undo = (): void => {
            channel.moveItem( item.$id, tPrev );
            // channel.moveNodeValue( node.$id, vPrev );
          };

          const redo = (): void => {
            channel.moveItem( item.$id, t );
            // channel.moveNodeValue( node.$id, v );
          };

          dispatch( {
            type: 'History/Push',
            entry: {
              description: 'Move Curve',
              redo,
              undo
            }
          } );
          redo();
        }
      );
    },
    [ channel, item, range, size, guiSettings ]
  );

  const grabLeft = useCallback(
    (): void => {
      if ( !channel ) { return; }

      const tPrev = item.time;
      const tEnd = item.time + item.length;
      let dx = 0.0;
      let t = tPrev;
      let hasMoved = false;

      registerMouseEvent(
        ( event, movementSum ) => {
          hasMoved = true;
          dx += movementSum.x;

          const ignoreSnap = event.altKey;

          t = tPrev + dx2dt( dx, range, size.width );

          if ( !ignoreSnap ) {
            t = snapTime( t, range, size.width, guiSettings );
          }

          channel.resizeItemByLeft( item.$id, tEnd - t );
        },
        () => {
          if ( !hasMoved ) { return; }

          const redo = (): void => {
            channel.resizeItemByLeft( item.$id, tEnd - t );
          };

          const undo = (): void => {
            channel.resizeItemByLeft( item.$id, tEnd - tPrev );
          };

          dispatch( {
            type: 'History/Push',
            entry: {
              description: 'Resize Curve',
              redo,
              undo
            }
          } );
          redo();
        }
      );
    },
    [ channel, item, range, size, guiSettings ]
  );

  const grabRight = useCallback(
    (): void => {
      if ( !channel ) { return; }

      const tPrev = item.time + item.length;
      const tBegin = item.time;
      let dx = 0.0;
      let t = tPrev;
      let hasMoved = false;

      registerMouseEvent(
        ( event, movementSum ) => {
          hasMoved = true;
          dx += movementSum.x;

          const ignoreSnap = event.altKey;

          t = tPrev + dx2dt( dx, range, size.width );

          if ( !ignoreSnap ) {
            t = snapTime( t, range, size.width, guiSettings );
          }

          channel.resizeItem( item.$id, t - tBegin );
        },
        () => {
          if ( !hasMoved ) { return; }

          const redo = (): void => {
            channel.resizeItem( item.$id, t - tBegin );
          };

          const undo = (): void => {
            channel.resizeItem( item.$id, tPrev - tBegin );
          };

          dispatch( {
            type: 'History/Push',
            entry: {
              description: 'Resize Curve',
              redo,
              undo
            }
          } );
          redo();
        }
      );
    },
    [ channel, item, range, size, guiSettings ]
  );

  const removeItem = useCallback(
    (): void => {
      if ( !channel ) { return; }

      const undo = (): void => {
        channel.createItemFromData( item );
      };

      const redo = (): void => {
        channel.removeItem( item.$id );
      };

      dispatch( {
        type: 'History/Push',
        entry: {
          description: 'Remove Curve',
          redo,
          undo
        }
      } );
      redo();
    },
    [ item, channel ]
  );

  const handleClickBody = useCallback(
    ( event: React.MouseEvent ): void => {
      if ( event.buttons === 1 ) {
        event.preventDefault();
        event.stopPropagation();

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

          grabBody();
        }
      }
    },
    [ removeItem, grabBody ]
  );

  const handleClickLeft = useCallback(
    ( event: React.MouseEvent ): void => {
      if ( event.buttons === 1 ) {
        event.preventDefault();
        event.stopPropagation();

        grabLeft();
      }
    },
    [ grabLeft ]
  );

  const handleClickRight = useCallback(
    ( event: React.MouseEvent ): void => {
      if ( event.buttons === 1 ) {
        event.preventDefault();
        event.stopPropagation();

        grabRight();
      }
    },
    [ grabRight ]
  );

  const editCurve = useCallback(
    (): void => {
      dispatch( {
        type: 'CurveEditor/SelectCurve',
        curve: item.curve
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
