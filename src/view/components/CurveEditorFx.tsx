import { CURVE_FX_ROW_MAX } from '../../CurveWithGUI';
import { Colors } from '../constants/Colors';
import { FxSection } from '@fms-cat/automaton';
import { MouseComboBit, mouseCombo } from '../utils/mouseCombo';
import { Resolution } from '../utils/Resolution';
import { TimeValueRange, dt2dx, dx2dt, snapTime, t2x } from '../utils/TimeValueRange';
import { WithBypass } from '../../types/WithBypass';
import { WithID } from '../../types/WithID';
import { arraySetHas } from '../utils/arraySet';
import { clamp } from '../../utils/clamp';
import { registerMouseEvent } from '../utils/registerMouseEvent';
import { useDispatch, useSelector } from '../states/store';
import { useDoubleClick } from '../utils/useDoubleClick';
import React, { useCallback } from 'react';
import styled from 'styled-components';

// == constants ====================================================================================
export const FX_HEIGHT = 16.0;

// == styles =======================================================================================
const FxBody = styled.rect<{ isSelected: boolean; isBypassed: boolean | undefined; isMissing: boolean | undefined }>`
  fill: ${ ( { isSelected, isBypassed, isMissing } ) => (
    isSelected
      ? isMissing
        ? Colors.error
        : isBypassed
          ? Colors.gray
          : Colors.fx
      : Colors.back1
  ) };
  stroke: ${ ( { isBypassed, isMissing } ) => (
    isMissing
      ? Colors.error
      : isBypassed
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

const FxText = styled.text<{ isSelected: boolean; isBypassed: boolean | undefined; isMissing: boolean | undefined }>`
  fill: ${ ( { isSelected, isBypassed, isMissing } ) => (
    isSelected ?
      Colors.back1
      : isMissing
        ? Colors.error
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
const CurveEditorFx = ( props: {
  curveId: string;
  fx: FxSection & WithBypass & WithID;
  range: TimeValueRange;
  size: Resolution;
} ): JSX.Element => {
  const { curveId, fx, range, size } = props;
  const {
    guiSettings,
    automaton,
    fxDefinitions
  } = useSelector( ( state ) => ( {
    guiSettings: state.automaton.guiSettings,
    automaton: state.automaton.instance,
    fxDefinitions: state.automaton.fxDefinitions
  } ) );
  const dispatch = useDispatch();
  const checkDoubleClick = useDoubleClick();
  const curve = automaton?.getCurveById( curveId ) || null;
  const selectedFxs = useSelector( ( state ) => state.curveEditor.selected.fxs );
  const definition = fxDefinitions[ fx.def ];

  const grabFxBody = useCallback(
    (): void => {
      if ( !curve ) { return; }

      const timePrev = fx.time;
      const rowPrev = fx.row;
      let dx = 0.0;
      let dy = 0.0;
      let time = timePrev;
      let row = rowPrev;
      let hasMoved = false;

      registerMouseEvent(
        ( event, movementSum ) => {
          hasMoved = true;
          dx += movementSum.x;
          dy += movementSum.y;

          const holdTime = event.ctrlKey || event.metaKey;
          const holdRow = event.shiftKey;
          const ignoreSnap = event.altKey;

          time = holdTime ? timePrev : ( timePrev + dx2dt( dx, range, size.width ) );
          row = holdRow
            ? rowPrev
            : clamp( rowPrev + Math.round( dy / FX_HEIGHT ), 0, CURVE_FX_ROW_MAX - 1 );

          if ( !ignoreSnap ) {
            if ( !holdTime ) { time = snapTime( time, range, size.width, guiSettings ); }
          }

          curve.moveFx( fx.$id, time );
          curve.changeFxRow( fx.$id, row );
        },
        () => {
          if ( !hasMoved ) { return; }

          curve.moveFx( fx.$id, time );
          curve.changeFxRow( fx.$id, row );

          const {
            time: actualTime,
            row: actualRow
          } = curve.getFx( fx.$id );

          dispatch( {
            type: 'History/Push',
            description: 'Move Fx',
            commands: [
              {
                type: 'curve/forceMoveFx',
                curveId,
                fx: fx.$id,
                time: actualTime,
                timePrev,
                row: actualRow,
                rowPrev
              }
            ],
          } );
        }
      );
    },
    [ fx, curve, curveId, range, size, guiSettings, dispatch ]
  );

  const removeFx = useCallback(
    (): void => {
      if ( !curve ) { return; }

      curve.removeFx( fx.$id );

      dispatch( {
        type: 'History/Push',
        description: 'Remove Fx',
        commands: [
          {
            type: 'curve/removeFx',
            curveId,
            data: fx
          }
        ],
      } );
    },
    [ fx, curve, dispatch, curveId ]
  );

  const handleFxBodyClick = useCallback(
    ( event ) => mouseCombo( event, {
      [ MouseComboBit.LMB ]: () => {
        if ( checkDoubleClick() ) {
          removeFx();
        } else {
          dispatch( {
            type: 'CurveEditor/SelectItems',
            fxs: [ fx.$id ]
          } );

          grabFxBody();
        }
      }
    } ),
    [ checkDoubleClick, removeFx, dispatch, fx.$id, grabFxBody ]
  );

  const grabFxSide = useCallback(
    ( side: 'left' | 'right' ): void => {
      if ( !curve ) { return; }

      const timePrev = side === 'left' ? fx.time : ( fx.time + fx.length );
      const otherEnd = side === 'left' ? ( fx.time + fx.length ) : fx.time;
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

          if ( side === 'left' ) {
            curve.resizeFxByLeft( fx.$id, otherEnd - time );
          } else {
            curve.resizeFx( fx.$id, time - otherEnd );
          }
        },
        () => {
          if ( !hasMoved ) { return; }

          if ( side === 'left' ) {
            curve.resizeFxByLeft( fx.$id, otherEnd - time );

            dispatch( {
              type: 'History/Push',
              description: 'Resize Fx',
              commands: [
                {
                  type: 'curve/resizeFxByLeft',
                  curveId,
                  fx: fx.$id,
                  length: otherEnd - time,
                  lengthPrev: otherEnd - timePrev
                }
              ],
            } );
          } else {
            curve.resizeFx( fx.$id, time - otherEnd );

            dispatch( {
              type: 'History/Push',
              description: 'Resize Fx',
              commands: [
                {
                  type: 'curve/resizeFx',
                  curveId,
                  fx: fx.$id,
                  length: time - otherEnd,
                  lengthPrev: timePrev - otherEnd
                }
              ],
            } );
          }
        }
      );
    },
    [ fx, curve, curveId, range, size, guiSettings, dispatch ]
  );

  const handleFxLeftClick = useCallback(
    ( event ) => mouseCombo( event, {
      [ MouseComboBit.LMB ]: () => {
        grabFxSide( 'left' );
      }
    } ),
    [ grabFxSide ]
  );

  const handleFxRightClick = useCallback(
    ( event ) => mouseCombo( event, {
      [ MouseComboBit.LMB ]: () => {
        grabFxSide( 'right' );
      }
    } ),
    [ grabFxSide ]
  );

  const x = t2x( fx.time, range, size.width );
  const w = dt2dx( fx.length, range, size.width );

  return (
    <Root key={ fx.$id }
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
          isSelected={ arraySetHas( selectedFxs, fx.$id ) }
          isBypassed={ fx.bypass }
          isMissing={ definition == null }
          onMouseDown={ handleFxBodyClick }
        />
        <FxSide
          width="0.25rem"
          height={ FX_HEIGHT }
          onMouseDown={ handleFxLeftClick }
        />
        <FxSide
          transform={ `translate(${ w }, 0)` }
          x="-0.25rem"
          width="0.25rem"
          height={ FX_HEIGHT }
          onMouseDown={ handleFxRightClick }
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
              isSelected={ arraySetHas( selectedFxs, fx.$id ) }
              isBypassed={ fx.bypass }
              isMissing={ definition == null }
            >
              { definition ? definition.name : `${ fx.def } (Missing)` }
            </FxText>
          </g>
        </g>
      </g>
    </Root>
  );
};

export { CurveEditorFx };
