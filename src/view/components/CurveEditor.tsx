import { Action, State } from '../states/store';
import React, { useCallback, useEffect, useRef } from 'react';
import { TimeValueRange, x2t, y2v } from '../utils/TimeValueRange';
import { useDispatch, useSelector } from 'react-redux';
import { Colors } from '../constants/Colors';
import { CurveEditorFxs } from './CurveEditorFxs';
import { CurveEditorGraph } from './CurveEditorGraph';
import { CurveEditorNodes } from './CurveEditorNodes';
import { Dispatch } from 'redux';
import { Resolution } from '../utils/Resolution';
import { TimeValueGrid } from './TimeValueGrid';
import { TimeValueLines } from './TimeValueLines';
import { registerMouseEvent } from '../utils/registerMouseEvent';
import styled from 'styled-components';
import { useDoubleClick } from '../utils/useDoubleClick';
import { useRect } from '../utils/useRect';

// == microcomponent ===============================================================================
const Lines = ( { className, range, size }: {
  className?: string;
  range: TimeValueRange;
  size: Resolution;
} ): JSX.Element => {
  const selectedCurve = useSelector( ( state: State ) => state.curveEditor.selectedCurve );
  const { time, value } = useSelector( ( state: State ) => ( {
    time: selectedCurve && state.automaton.curves[ selectedCurve ].previewTime,
    value: selectedCurve && state.automaton.curves[ selectedCurve ].previewValue
  } ) );

  return <TimeValueLines
    className={ className }
    range={ range }
    size={ size }
    time={ time ?? undefined }
    value={ value ?? undefined }
  />;
};

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

const StyledLines = styled( Lines )`
  position: absolute;
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
  const rect = useRect( refSvgRoot );

  const move = useCallback(
    ( dx: number, dy: number ): void => {
      dispatch( {
        type: 'CurveEditor/MoveRange',
        size: rect,
        dx,
        dy,
        tmax: length // 🔥
      } );
    },
    [ rect, length ]
  );

  const zoom = useCallback(
    ( cx: number, cy: number, dx: number, dy: number ): void => {
      dispatch( {
        type: 'CurveEditor/ZoomRange',
        size: rect,
        cx,
        cy,
        dx,
        dy,
        tmax: length // 🔥
      } );
    },
    [ rect, length ]
  );

  const createNodeAndGrab = useCallback(
    ( x0: number, y0: number ): void => {
      if ( !curve ) { return; }

      let x = x0;
      let y = y0;

      const data = curve.createNode(
        x2t( x, range, rect.width ),
        y2v( y, range, rect.height )
      );
      dispatch( {
        type: 'CurveEditor/SelectItems',
        nodes: [ data.$id ]
      } );

      registerMouseEvent(
        ( event, movementSum ) => {
          x += movementSum.x;
          y += movementSum.y;

          curve.moveNodeTime( data.$id, x2t( x, range, rect.width ) );
          curve.moveNodeValue( data.$id, y2v( y, range, rect.height ) );
        },
        () => {
          const t = x2t( x, range, rect.width );
          const v = y2v( y, range, rect.height );
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
    },
    [ range, rect, curve ]
  );

  const handleMouseDown = useCallback(
    ( event: React.MouseEvent ): void => {
      event.preventDefault();

      if ( event.buttons === 1 ) {
        if ( checkDoubleClick() ) {
          createNodeAndGrab( event.clientX - rect.left, event.clientY - rect.top );
        }
      } else if ( event.buttons === 4 ) {
        registerMouseEvent(
          ( event, movementSum ) => move( movementSum.x, movementSum.y )
        );
      }
    },
    [ createNodeAndGrab, rect, move ]
  );

  const createNode = useCallback(
    ( x: number, y: number ) => {
      if ( !curve ) { return; }

      const t = x2t( x, range, rect.width );
      const v = y2v( y, range, rect.height );
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
    },
    [ range, rect, curve ]
  );

  const createFx = useCallback(
    ( x: number ) => {
      if ( !curve ) { return; }

      dispatch( {
        type: 'FxSpawner/Open',
        callback: ( name: string ) => {
          const t = x2t( x, range, rect.width );
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
    },
    [ range, rect, curve ]
  );

  const handleContextMenu = useCallback(
    ( event: React.MouseEvent ): void => {
      event.preventDefault();
      event.stopPropagation();

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      dispatch( {
        type: 'ContextMenu/Open',
        position: { x: event.clientX, y: event.clientY },
        commands: [
          {
            name: 'Add Node',
            description: 'Add a new bezier curve node.',
            command: () => createNode( x, y )
          },
          {
            name: 'Add Fx',
            description: 'Add a new fx section.',
            command: () => createFx( x )
          }
        ]
      } );
    },
    [ rect, createNode, createFx ]
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
      <TimeValueGrid
        range={ range }
        size={ rect }
      />
      <SVGRoot
        ref={ refSvgRoot }
        onMouseDown={ handleMouseDown }
        onContextMenu={ handleContextMenu }
      >
        <CurveEditorFxs size={ rect } />
        <CurveEditorGraph />
        <CurveEditorNodes size={ rect } />
      </SVGRoot>
      <StyledLines
        range={ range }
        size={ rect }
      />
    </Root>
  );
};

export { CurveEditor };
