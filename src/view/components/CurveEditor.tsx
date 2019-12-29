import React, { useCallback, useContext, useEffect, useRef } from 'react';
import { x2t, y2v } from '../utils/CurveEditorUtils';
import { Colors } from '../constants/Colors';
import { Contexts } from '../contexts/Context';
import { CurveEditorFxs } from './CurveEditorFxs';
import { CurveEditorGraph } from './CurveEditorGraph';
import { CurveEditorGrid } from './CurveEditorGrid';
import { CurveEditorLine } from './CurveEditorLine';
import { CurveEditorNodes } from './CurveEditorNodes';
import { registerMouseEvent } from '../utils/registerMouseEvent';
import styled from 'styled-components';
import { useDoubleClick } from '../utils/useDoubleClick';

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

export const CurveEditor = ( { className }: CurveEditorProps ): JSX.Element => {
  const contexts = useContext( Contexts.Store );
  const checkDoubleClick = useDoubleClick();
  const { range, size, selectedParam } = contexts.state.curveEditor;
  const automaton = contexts.state.automaton.instance;
  const param = selectedParam && automaton?.getParam( selectedParam ) || null;

  const refSvgRoot = useRef<SVGSVGElement>( null );
  const refLength = useRef<number>();
  refLength.current = contexts.state.automaton.length;

  useEffect( // listen its resize
    () => {
      function heck(): void {
        if ( !refSvgRoot.current ) { return; }

        contexts.dispatch( {
          type: 'CurveEditor/SetSize',
          size: {
            width: refSvgRoot.current.clientWidth,
            height: refSvgRoot.current.clientHeight,
          }
        } );
      }

      heck();
      window.addEventListener( 'resize', () => heck() );
    },
    []
  );

  const move = ( dx: number, dy: number ): void => {
    contexts.dispatch( {
      type: 'CurveEditor/MoveRange',
      dx,
      dy,
      tmax: refLength.current! // 🔥
    } );
  };

  const zoom = ( cx: number, cy: number, dx: number, dy: number ): void => {
    contexts.dispatch( {
      type: 'CurveEditor/ZoomRange',
      cx,
      cy,
      dx,
      dy,
      tmax: refLength.current! // 🔥
    } );
  };

  const createNode = ( x0: number, y0: number ): void => {
    if ( !param ) { return; }

    let x = x0;
    let y = y0;

    const data = param.createNode(
      x2t( x, range, size.width ),
      y2v( y, range, size.height )
    );
    contexts.dispatch( {
      type: 'CurveEditor/SelectItems',
      nodes: [ data.$id ]
    } );

    registerMouseEvent(
      ( event, movementSum ) => {
        x += movementSum.x;
        y += movementSum.y;

        param.moveNodeTime( data.$id, x2t( x, range, size.width ) );
        param.moveNodeValue( data.$id, y2v( y, range, size.height ) );
      },
      () => {
        const t = x2t( x, range, size.width );
        const v = y2v( y, range, size.height );
        param.moveNodeTime( data.$id, t );
        param.moveNodeValue( data.$id, v );

        data.time = t;
        data.value = v;

        const undo = (): void => {
          param.removeNode( data.$id );
        };

        const redo = (): void => {
          param.createNodeFromData( data );
        };

        contexts.dispatch( {
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
    if ( !param ) { return; }

    event.preventDefault();
    event.stopPropagation();

    const x = event.nativeEvent.offsetX;
    const y = event.nativeEvent.offsetY;

    contexts.dispatch( {
      type: 'ContextMenu/Open',
      position: { x: event.clientX, y: event.clientY },
      commands: [
        {
          name: 'Add Node',
          description: 'Add a new bezier curve node.',
          command: () => {
            const t = x2t( x, range, size.width );
            const v = y2v( y, range, size.height );
            const data = param.createNode( t, v );
            contexts.dispatch( {
              type: 'CurveEditor/SelectItems',
              nodes: [ data.$id ]
            } );

            const undo = (): void => {
              param.removeNode( data.$id );
            };

            const redo = (): void => {
              param.createNodeFromData( data );
            };

            contexts.dispatch( {
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
            contexts.dispatch( {
              type: 'FxSpawner/Open',
              callback: ( name ) => {
                const t = x2t( x, range, size.width );
                const data = param.createFx( t, 1.0, name );
                if ( data ) {
                  contexts.dispatch( {
                    type: 'CurveEditor/SelectItems',
                    fxs: [ data.$id ]
                  } );

                  const undo = (): void => {
                    param.removeFx( data.$id );
                  };

                  const redo = (): void => {
                    param.createFxFromData( data );
                  };

                  contexts.dispatch( {
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
      <SVGRoot
        ref={ refSvgRoot }
        onMouseDown={ handleMouseDown }
        onContextMenu={ handleContextMenu }
      >
        <CurveEditorGrid />
        <CurveEditorFxs />
        <CurveEditorGraph />
        <CurveEditorLine />
        <CurveEditorNodes />
      </SVGRoot>
    </Root>
  );
};
