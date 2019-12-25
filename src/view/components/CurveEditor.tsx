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
  const context = useContext( Contexts.Store );
  const { range, size, selectedParam } = context.state.curveEditor;
  const automaton = context.state.automaton.instance;

  const refSvgRoot = useRef<SVGSVGElement>( null );
  const refLength = useRef<number>();
  refLength.current = context.state.automaton.length;

  useEffect( // listen its resize
    () => {
      function heck(): void {
        if ( !refSvgRoot.current ) { return; }

        context.dispatch( {
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

  const move = useCallback(
    ( dx: number, dy: number ): void => {
      context.dispatch( {
        type: 'CurveEditor/MoveRange',
        dx,
        dy,
        tmax: refLength.current! // 🔥
      } );
    },
    []
  );

  const zoom = useCallback(
    ( cx: number, cy: number, dx: number, dy: number ): void => {
      context.dispatch( {
        type: 'CurveEditor/ZoomRange',
        cx,
        cy,
        dx,
        dy,
        tmax: refLength.current! // 🔥
      } );
    },
    []
  );

  const createNode = useCallback(
    ( x0: number, y0: number ): void => {
      if ( !automaton || !selectedParam ) { return; }
      const param = automaton.getParam( selectedParam )!;

      let x = x0;
      let y = y0;

      const data = param.createNode(
        x2t( x, range, size.width ),
        y2v( y, range, size.height )
      );

      registerMouseEvent(
        ( event, movementSum ) => {
          x += movementSum.x;
          y += movementSum.y;

          param.moveNode(
            data.$id,
            x2t( x, range, size.width ),
            y2v( y, range, size.height )
          );
        },
        () => {
          const t = x2t( x, range, size.width );
          const v = y2v( y, range, size.height );
          param.moveNode( data.$id, t, v );

          data.time = t;
          data.value = v;

          context.dispatch( {
            type: 'History/Push',
            entry: {
              description: 'Add Node',
              redo: () => param.createNodeFromData( data ),
              undo: () => param.removeNode( data.$id )
            }
          } );
        }
      );
    },
    [ automaton, selectedParam, context, range, size ]
  );

  const handleMouseDown = useCallback(
    ( event: React.MouseEvent ): void => {
      event.preventDefault();

      const now = Date.now();
      const isDoubleClick = ( now - context.state.controls.lastClick ) < 250;
      context.dispatch( { type: 'Controls/SetLastClick', date: now } );

      if ( event.buttons === 1 ) {
        if ( isDoubleClick ) {
          createNode( event.nativeEvent.offsetX, event.nativeEvent.offsetY );
        }
      } else if ( event.buttons === 4 ) {
        registerMouseEvent(
          ( event, movementSum ) => move( movementSum.x, movementSum.y )
        );
      }
    },
    [ createNode, move ]
  );

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
      <SVGRoot ref={ refSvgRoot } onMouseDown={ handleMouseDown }>
        <CurveEditorGrid />
        <CurveEditorFxs />
        <CurveEditorGraph />
        <CurveEditorLine />
        <CurveEditorNodes />
      </SVGRoot>
    </Root>
  );
};
