import { Action, State } from '../states/store';
import React, { Dispatch, useCallback } from 'react';
import { dt2dx, dx2dt, snapTime, t2x } from '../utils/TimeValueRange';
import { useDispatch, useSelector } from 'react-redux';
import { CHANNEL_FX_ROW_MAX } from '../../ChannelWithGUI';
import { Colors } from '../constants/Colors';
import { FxSection } from '@fms-cat/automaton';
import { Resolution } from '../utils/Resolution';
import { WithID } from '../../types/WithID';
import { clamp } from '../../utils/clamp';
import { registerMouseEvent } from '../utils/registerMouseEvent';
import styled from 'styled-components';
import { useDoubleClick } from '../utils/useDoubleClick';

// == constants ====================================================================================
export const FX_HEIGHT = 16.0;

// == styles =======================================================================================
const FxBgFill = styled.rect`
  fill: ${ Colors.fx };
  opacity: 0.1;
`;

const FxBgLine = styled.line`
  stroke: ${ Colors.fx };
  stroke-width: 0.0625rem;
  stroke-dasharray: 0.25rem;
`;

const FxBody = styled.rect<{ isSelected: boolean; isBypassed: boolean | undefined }>`
  fill: ${ ( { isSelected, isBypassed } ) => (
    isSelected
      ? isBypassed
        ? Colors.gray
        : Colors.fx
      : Colors.back1
  ) };
  stroke: ${ ( { isBypassed } ) => (
    isBypassed
      ? Colors.gray
      : Colors.fx
  ) };
  stroke-width: 0.125rem;
  cursor: pointer;
  pointer-events: auto;
  rx: 0.25rem;
  ry: 0.25rem;
`;

const FxSide = styled.rect`
  fill: rgba( 0, 0, 0, 0 );
  stroke: rgba( 0, 0, 0, 0 );
  stroke-width: 0.125rem;
  cursor: ew-resize;
  pointer-events: auto;
  rx: 0.25rem;
  ry: 0.25rem;
`;

const FxText = styled.text<{ isSelected: boolean; isBypassed: boolean | undefined }>`
  fill: ${ ( { isSelected, isBypassed } ) => (
    isSelected ?
      Colors.back1
      : isBypassed
        ? Colors.gray
        : Colors.fx
  ) };
  font-size: 0.7rem;
`;

const Root = styled.g`
  pointer-events: none;
`;

// == element ======================================================================================
export interface CurveEditorFxsProps {
  className?: string;
  size: Resolution;
}

const CurveEditorFxs = ( props: CurveEditorFxsProps ): JSX.Element => {
  const { className, size } = props;
  const dispatch = useDispatch<Dispatch<Action>>();
  const checkDoubleClick = useDoubleClick();
  const {
    selectedCurve,
    range,
    guiSettings,
    automaton,
    fxDefinitions
  } = useSelector( ( s: State ) => ( {
    selectedCurve: s.curveEditor.selectedCurve,
    range: s.curveEditor.range,
    guiSettings: s.automaton.guiSettings,
    automaton: s.automaton.instance,
    fxDefinitions: s.automaton.fxDefinitions
  } ) );
  const stateFxs = useSelector( ( s: State ) => (
    selectedCurve != null && s.automaton.curves[ selectedCurve ].fxs
  ) );
  const curve = selectedCurve != null && automaton?.getCurve( selectedCurve ) || null;
  const selectedFxs = useSelector( ( state: State ) => state.curveEditor.selectedItems.fxs );

  const grabFxBody = useCallback(
    ( fx: FxSection & WithID ): void => {
      if ( !curve ) { return; }

      const tPrev = fx.time;
      const rPrev = fx.row;
      let dx = 0.0;
      let dy = 0.0;
      let t = tPrev;
      let r = rPrev;
      let hasMoved = false;

      registerMouseEvent(
        ( event, movementSum ) => {
          hasMoved = true;
          dx += movementSum.x;
          dy += movementSum.y;

          const holdTime = event.ctrlKey || event.metaKey;
          const holdRow = event.shiftKey;
          const ignoreSnap = event.altKey;

          t = holdTime ? tPrev : ( tPrev + dx2dt( dx, range, size.width ) );
          r = holdRow
            ? rPrev
            : clamp( rPrev + Math.round( dy / FX_HEIGHT ), 0, CHANNEL_FX_ROW_MAX - 1 );

          if ( !ignoreSnap ) {
            if ( !holdTime ) { t = snapTime( t, range, size.width, guiSettings ); }
          }

          curve.moveFx( fx.$id, t );
          curve.changeFxRow( fx.$id, r );
        },
        () => {
          if ( !hasMoved ) { return; }

          const redo = (): void => {
            curve.moveFx( fx.$id, t );
            curve.changeFxRow( fx.$id, r );
          };

          const undo = (): void => {
            curve.moveFx( fx.$id, tPrev );
            curve.changeFxRow( fx.$id, rPrev );
          };

          dispatch( {
            type: 'History/Push',
            entry: {
              description: 'Move Fx',
              redo,
              undo
            }
          } );
          redo();
        }
      );
    },
    [ curve, range, size, guiSettings ]
  );

  const removeFx = useCallback(
    ( fx: FxSection & WithID ): void => {
      if ( !curve ) { return; }

      const redo = (): void => {
        curve.removeFx( fx.$id );
      };

      const undo = (): void => {
        curve.createFxFromData( fx );
      };

      dispatch( {
        type: 'History/Push',
        entry: {
          description: 'Remove Node',
          redo,
          undo
        }
      } );
      redo();
    },
    [ curve ]
  );

  const handleFxBodyClick = useCallback(
    ( event: React.MouseEvent, fx: FxSection & WithID ): void => {
      event.preventDefault();
      event.stopPropagation();

      if ( event.buttons === 1 ) {
        if ( checkDoubleClick() ) {
          removeFx( fx );
        } else {
          dispatch( {
            type: 'CurveEditor/SelectItems',
            fxs: [ fx.$id ]
          } );

          grabFxBody( fx );
        }
      }
    },
    [ removeFx, grabFxBody ]
  );

  const grabFxSide = useCallback(
    ( fx: FxSection & WithID, side: 'left' | 'right' ): void => {
      if ( !curve ) { return; }

      const tPrev = side === 'left' ? fx.time : ( fx.time + fx.length );
      const otherEnd = side === 'left' ? ( fx.time + fx.length ) : fx.time;
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

          if ( side === 'left' ) {
            curve.resizeFxByLeft( fx.$id, otherEnd - t );
          } else {
            curve.resizeFx( fx.$id, t - otherEnd );
          }
        },
        () => {
          if ( !hasMoved ) { return; }

          const redo = (): void => {
            if ( side === 'left' ) {
              curve.resizeFxByLeft( fx.$id, otherEnd - t );
            } else {
              curve.resizeFx( fx.$id, t - otherEnd );
            }
          };

          const undo = (): void => {
            if ( side === 'left' ) {
              curve.resizeFxByLeft( fx.$id, otherEnd - tPrev );
            } else {
              curve.resizeFx( fx.$id, tPrev - otherEnd );
            }
          };

          dispatch( {
            type: 'History/Push',
            entry: {
              description: 'Resize Fx',
              redo,
              undo
            }
          } );
          redo();
        }
      );
    },
    [ curve, range, size, guiSettings ]
  );

  const handleFxSideClick = useCallback(
    (
      event: React.MouseEvent,
      fx: FxSection & WithID,
      side: 'left' | 'right'
    ): void => {
      event.preventDefault();
      event.stopPropagation();

      if ( event.buttons === 1 ) {
        grabFxSide( fx, side );
      }
    },
    [ grabFxSide ]
  );

  return (
    <Root className={ className }>
      <g>
        {
          stateFxs && Object.values( stateFxs ).map( ( fx ) => {
            if ( fx.bypass ) { return null; }

            const x = t2x( fx.time, range, size.width );

            return (
              <g key={ fx.$id }
                transform={ `translate(${ x }, 0)` }
              >
                <FxBgFill
                  width={ dt2dx( fx.length, range, size.width ) }
                  height={ size.height }
                />
                <FxBgLine
                  x1="0"
                  y1="0.25rem"
                  x2="0"
                  y2={ size.height }
                />
                <FxBgLine
                  transform={ `translate(${ dt2dx( fx.length, range, size.width ) }, 0)` }
                  x1="0"
                  y1="0.25rem"
                  x2="0"
                  y2={ size.height }
                />
              </g>
            );
          } )
        }
      </g>
      <g>
        {
          stateFxs && Object.values( stateFxs ).map( ( fx ) => {
            const x = t2x( fx.time, range, size.width );
            const w = dt2dx( fx.length, range, size.width );

            return (
              <g key={ fx.$id }
                style={ {
                  transform: `translate(0, calc(0.0625rem + ${ fx.row * FX_HEIGHT }px))`
                } }
              >
                <g transform={ `translate(${ x }, 0)` }>
                  <clipPath
                    id={ `fxclip${ fx.$id }` }
                  >
                    <rect
                      width={ w }
                      height={ FX_HEIGHT }
                    />
                  </clipPath>
                  <FxBody
                    width={ w }
                    height={ FX_HEIGHT }
                    isSelected={
                      selectedFxs.indexOf( fx.$id ) !== -1
                    }
                    isBypassed={ fx.bypass }
                    onMouseDown={ ( event ) => handleFxBodyClick( event, fx ) }
                  />
                  <FxSide
                    width="0.25rem"
                    height={ FX_HEIGHT }
                    onMouseDown={ ( event ) => handleFxSideClick( event, fx, 'left' ) }
                  />
                  <FxSide
                    transform={ `translate(${ w }, 0)` }
                    x="-0.25rem"
                    width="0.25rem"
                    height={ FX_HEIGHT }
                    onMouseDown={ ( event ) => handleFxSideClick( event, fx, 'right' ) }
                  />
                  <g
                    clipPath={ `url(#fxclip${ fx.$id })` }
                  >
                    <g
                      transform={ `translate(${ Math.max( 0.0, x ) - x }, 0)` }
                    >
                      <FxText
                        x="0.125rem"
                        y="0.75rem"
                        isSelected={
                          selectedFxs.indexOf( fx.$id ) !== -1
                        }
                        isBypassed={ fx.bypass }
                      >
                        { fxDefinitions[ fx.def ].name }
                      </FxText>
                    </g>
                  </g>
                </g>
              </g>
            );
          } )
        }
      </g>
    </Root>
  );
};

export { CurveEditorFxs };
