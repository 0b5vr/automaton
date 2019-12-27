import React, { useContext } from 'react';
import { dt2dx, dx2dt, t2x } from '../utils/CurveEditorUtils';
import { Colors } from '../constants/Colors';
import { Contexts } from '../contexts/Context';
import { PARAM_FX_ROW_MAX } from '../../ParamWithGUI';
import { registerMouseEvent } from '../utils/registerMouseEvent';
import styled from 'styled-components';

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

const FxBody = styled.rect<{ isSelected: boolean }>`
  fill: ${ ( { isSelected } ) => ( isSelected ? Colors.fx : Colors.back1 ) };
  stroke: ${ Colors.fx };
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

const FxText = styled.text<{ isSelected: boolean }>`
  fill: ${ Colors.fx };
  font-size: 0.7rem;
`;

const Root = styled.g`
  pointer-events: none;
`;

// == element ======================================================================================
export interface CurveEditorFxsProps {
  className?: string;
}

export const CurveEditorFxs = ( props: CurveEditorFxsProps ): JSX.Element => {
  const context = useContext( Contexts.Store );
  const { range, size, selectedParam } = context.state.curveEditor;
  const automaton = context.state.automaton.instance;
  const param = selectedParam && automaton?.getParam( selectedParam ) || null;
  const serializedParam = selectedParam && context.state.automaton.params[ selectedParam ] || null;

  const grabFxBody = ( index: number ): void => {
    if ( !param ) { return; }

    const fx = param.getFxByIndex( index );
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

        t = holdTime ? tPrev : ( tPrev + dx2dt( dx, range, size.width ) );
        r = holdRow
          ? rPrev
          : Math.min( Math.max( rPrev + Math.round( dy / FX_HEIGHT ), 0 ), PARAM_FX_ROW_MAX - 1 );

        param.moveFx( fx.$id, t );
        param.changeFxRow( fx.$id, r );
      },
      () => {
        if ( !hasMoved ) { return; }

        const redo = (): void => {
          param.moveFx( fx.$id, t );
          param.changeFxRow( fx.$id, r );
        };

        const undo = (): void => {
          param.moveFx( fx.$id, tPrev );
          param.changeFxRow( fx.$id, rPrev );
        };

        context.dispatch( {
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
  };

  const removeFx = ( index: number ): void => {
    if ( !param ) { return; }

    const fx = param.getFxByIndex( index );

    const redo = (): void => param.removeFx( fx.$id );

    const undo = (): string => param.createFxFromData( fx );

    context.dispatch( {
      type: 'History/Push',
      entry: {
        description: 'Remove Node',
        redo,
        undo
      }
    } );
    redo();
  };

  const handleFxBodyClick = ( event: React.MouseEvent, index: number ): void => {
    event.preventDefault();
    event.stopPropagation();

    if ( event.buttons === 1 ) {
      const now = Date.now();
      const isDoubleClick = ( now - context.state.controls.lastClick ) < 250;
      context.dispatch( { type: 'Controls/SetLastClick', date: now } );

      if ( isDoubleClick ) {
        removeFx( index );
      } else {
        grabFxBody( index );
      }
    }
  };

  const grabFxSide = ( index: number, side: 'left' | 'right' ): void => {
    if ( !param ) { return; }

    const fx = param.getFxByIndex( index );
    const lPrev = fx.length;
    let dx = 0.0;
    let l = lPrev;
    let hasMoved = false;

    registerMouseEvent(
      ( event, movementSum ) => {
        hasMoved = true;
        dx += movementSum.x;

        if ( side === 'left' ) {
          l = lPrev + dx2dt( -dx, range, size.width );
          param.resizeFxByLeft( fx.$id, l );
        } else {
          l = lPrev + dx2dt( dx, range, size.width );
          param.resizeFx( fx.$id, l );
        }
      },
      () => {
        if ( !hasMoved ) { return; }

        const redo = (): void => {
          if ( side === 'left' ) {
            param.resizeFxByLeft( fx.$id, l );
          } else {
            param.resizeFx( fx.$id, l );
          }
        };

        const undo = (): void => {
          if ( side === 'left' ) {
            param.resizeFxByLeft( fx.$id, lPrev );
          } else {
            param.resizeFx( fx.$id, lPrev );
          }
        };

        context.dispatch( {
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
  };

  const handleFxSideClick = (
    event: React.MouseEvent,
    index: number,
    side: 'left' | 'right'
  ): void => {
    event.preventDefault();
    event.stopPropagation();

    if ( event.buttons === 1 ) {
      grabFxSide( index, side );
    }
  };

  return (
    <Root className={ props.className }>
      <g>
        {
          serializedParam?.fxs.map( ( fx, i ) => {
            const x = t2x( fx.time, range, size.width );

            return (
              <g key={ i }
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
          serializedParam?.fxs.map( ( fx, i ) => {
            const x = t2x( fx.time, range, size.width );
            const w = dt2dx( fx.length, range, size.width );

            return (
              <g key={ i }
                style={ {
                  transform: `translate(0, calc(0.0625rem + ${ fx.row * FX_HEIGHT }px))`
                } }
              >
                <g transform={ `translate(${ x }, 0)` }>
                  <clipPath
                    id={ `fxclip${ i }` }
                  >
                    <rect
                      width={ w }
                      height={ FX_HEIGHT }
                    />
                  </clipPath>
                  <FxBody
                    width={ w }
                    height={ FX_HEIGHT }
                    isSelected={ false }
                    onMouseDown={ ( event ) => handleFxBodyClick( event, i ) }
                  />
                  <FxSide
                    width="0.25rem"
                    height={ FX_HEIGHT }
                    onMouseDown={ ( event ) => handleFxSideClick( event, i, 'left' ) }
                  />
                  <FxSide
                    transform={ `translate(${ w }, 0)` }
                    x="-0.25rem"
                    width="0.25rem"
                    height={ FX_HEIGHT }
                    onMouseDown={ ( event ) => handleFxSideClick( event, i, 'right' ) }
                  />
                  <g
                    clipPath={ `url(#fxclip${ i })` }
                  >
                    <g
                      transform={ `translate(${ Math.max( 0.0, x ) - x }, 0)` }
                    >
                      <FxText
                        x="0.125rem"
                        y="0.75rem"
                        isSelected={ false }
                      >
                        { automaton?.getFxDefinitionName( fx.def ) }
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
