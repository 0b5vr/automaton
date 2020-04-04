import { Action, State } from '../states/store';
import React, { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { x2t, y2v } from '../utils/TimeValueRange';
import { Colors } from '../constants/Colors';
import { CurveEditorFxs } from './CurveEditorFxs';
import { CurveEditorGraph } from './CurveEditorGraph';
import { CurveEditorLine } from './CurveEditorLine';
import { CurveEditorNodes } from './CurveEditorNodes';
import { Dispatch } from 'redux';
import { TimeValueGrid } from './TimeValueGrid';
import { registerMouseEvent } from '../utils/registerMouseEvent';
import styled from 'styled-components';
import { useDoubleClick } from '../utils/useDoubleClick';
import { useRect } from '../utils/useRect';

// == styles =======================================================================================
const SVGRoot = styled.svg`
  display: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: calc( 100% - 0.25em );
  background: ${ Colors.back1 };
  pointer-events: auto;
`;

const Root = styled.div`
`;

// == element ======================================================================================
export interface CurveEditorProps {
  className?: string;
}

const CurveEditor = ( { className }: CurveEditorProps ): JSX.Element => {
  const dispatch = useDispatch<Dispatch<Action>>();
  const checkDoubleClick = useDoubleClick();
  const {
    selectedCurve,
    range,
    automaton,
    length
  } = useSelector( ( state: State ) => ( {
    selectedCurve: state.curveEditor.selectedCurve,
    range: state.curveEditor.range,
    automaton: state.automaton.instance,
    length: state.automaton.length
  } ) );

  const curve = selectedCurve != null && automaton?.getCurve( selectedCurve ) || null;

  const refSvgRoot = useRef<SVGSVGElement>( null );
  const size = useRect( refSvgRoot );

  const move = ( dx: number, dy: number ): void => {
    dispatch( {
      type: 'CurveEditor/MoveRange',
      size,
      dx,
      dy,
      tmax: length // 🔥
    } );
  };

  const zoom = ( cx: number, cy: number, dx: number, dy: number ): void => {
    dispatch( {
      type: 'CurveEditor/ZoomRange',
      size,
      cx,
      cy,
      dx,
      dy,
      tmax: length // 🔥
    } );
  };

  const createNode = ( x0: number, y0: number ): void => {
    if ( !curve ) { return; }

    let x = x0;
    let y = y0;

    const data = curve.createNode(
      x2t( x, range, size.width ),
      y2v( y, range, size.height )
    );
    dispatch( {
      type: 'CurveEditor/SelectItems',
      nodes: [ data.$id ]
    } );

    registerMouseEvent(
      ( event, movementSum ) => {
        x += movementSum.x;
        y += movementSum.y;

        curve.moveNodeTime( data.$id, x2t( x, range, size.width ) );
        curve.moveNodeValue( data.$id, y2v( y, range, size.height ) );
      },
      () => {
        const t = x2t( x, range, size.width );
        const v = y2v( y, range, size.height );
        curve.moveNodeTime( data.$id, t );
        curve.moveNodeValue( data.$id, v );

        data.time = t;
        data.value = v;

        const undo = (): void => {
          curve.removeNode( data.$id );
        };

        const redo = (): void => {
          curve.createNodeFromData( data );
        };

        dispatch( {
          type: 'History/Push',
          entry: {
            description: 'Add Node',
            redo,
            undo
          }
        } );
      }
    );
  };

  const handleMouseDown = ( event: React.MouseEvent ): void => {
    event.preventDefault();

    if ( event.buttons === 1 ) {
      if ( checkDoubleClick() ) {
        createNode( event.nativeEvent.offsetX, event.nativeEvent.offsetY );
      }
    } else if ( event.buttons === 4 ) {
      registerMouseEvent(
        ( event, movementSum ) => move( movementSum.x, movementSum.y )
      );
    }
  };

  const handleContextMenu = ( event: React.MouseEvent ): void => {
    if ( !curve ) { return; }

    event.preventDefault();
    event.stopPropagation();

    const x = event.nativeEvent.offsetX;
    const y = event.nativeEvent.offsetY;

    dispatch( {
      type: 'ContextMenu/Open',
      position: { x: event.clientX, y: event.clientY },
      commands: [
        {
          name: 'Add Node',
          description: 'Add a new bezier curve node.',
          command: () => {
            const t = x2t( x, range, size.width );
            const v = y2v( y, range, size.height );
            const data = curve.createNode( t, v );
            dispatch( {
              type: 'CurveEditor/SelectItems',
              nodes: [ data.$id ]
            } );

            const undo = (): void => {
              curve.removeNode( data.$id );
            };

            const redo = (): void => {
              curve.createNodeFromData( data );
            };

            dispatch( {
              type: 'History/Push',
              entry: {
                description: 'Add Node',
                redo,
                undo
              }
            } );
          }
        },
        {
          name: 'Add Fx',
          description: 'Add a new fx section.',
          command: () => {
            dispatch( {
              type: 'FxSpawner/Open',
              callback: ( name: string ) => {
                const t = x2t( x, range, size.width );
                const data = curve.createFx( t, 1.0, name );
                if ( data ) {
                  dispatch( {
                    type: 'CurveEditor/SelectItems',
                    fxs: [ data.$id ]
                  } );

                  const undo = (): void => {
                    curve.removeFx( data.$id );
                  };

                  const redo = (): void => {
                    curve.createFxFromData( data );
                  };

                  dispatch( {
                    type: 'History/Push',
                    entry: {
                      description: 'Add Fx',
                      redo,
                      undo
                    }
                  } );
                }
              }
            } );
          }
        }
      ]
    } );
  };

  const handleWheel = useCallback(
    ( event: WheelEvent ): void => {
      event.preventDefault();

      if ( event.shiftKey ) {
        zoom( event.offsetX, event.offsetY, event.deltaY, 0.0 );
      } else if ( event.ctrlKey ) {
        zoom( event.offsetX, event.offsetY, 0.0, event.deltaY );
      } else {
        move( -event.deltaX, -event.deltaY );
      }
    },
    [ zoom, move ]
  );

  useEffect( // 🔥 fuck
    () => {
      const svgRoot = refSvgRoot.current;
      if ( !svgRoot ) { return; }

      svgRoot.addEventListener( 'wheel', handleWheel, { passive: false } );
      return () => (
        svgRoot.removeEventListener( 'wheel', handleWheel )
      );
    },
    [ handleWheel ]
  );

  return (
    <Root className={ className }>
      <TimeValueGrid
        range={ range }
        size={ size }
      />
      <SVGRoot
        ref={ refSvgRoot }
        onMouseDown={ handleMouseDown }
        onContextMenu={ handleContextMenu }
      >
        <CurveEditorFxs size={ size } />
        <CurveEditorGraph />
        <CurveEditorLine size={ size } />
        <CurveEditorNodes size={ size } />
      </SVGRoot>
    </Root>
  );
};

export { CurveEditor };
