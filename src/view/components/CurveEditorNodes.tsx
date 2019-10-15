import React, { useContext, useEffect } from 'react';
import { dt2dx, dv2dy, dx2dt, dy2dv, t2x, v2y, x2t, y2v } from '../utils/CurveEditorUtils';
import { Colors } from '../style-constants/Colors';
import { Context } from '../contexts/Context';
import { ControlsActionType } from '../contexts/Controls';
import { CurveEditorActionType } from '../contexts/CurveEditor';
import { HistoryActionType } from '../contexts/History';
import { ParamWithGUIEvent } from '../../ParamWithGUI';
import { registerMouseEvent } from '../utils/MouseUtils';
import styled from 'styled-components';

// == styles =======================================================================================
const NodeBody = styled.circle<{ isSelected: boolean }>`
  fill: ${ ( { isSelected } ) => ( isSelected ? Colors.accent : Colors.back1 ) };
  stroke: ${ Colors.accent };
  stroke-width: 0.125rem;
  cursor: pointer;
  pointer-events: auto;
`;

const HandleLine = styled.line`
  stroke: ${ Colors.accent };
  stroke-width: 0.0625rem;
`;

const HandleCircle = styled.circle`
  fill: ${ Colors.accent };
  cursor: pointer;
  pointer-events: auto;
`;

const Root = styled.g`
  pointer-events: none;
`;

// == element ======================================================================================
export interface CurveEditorNodesProps {
  className?: string;
}

export const CurveEditorNodes = ( props: CurveEditorNodesProps ): JSX.Element => {
  const context = useContext( Context.Store );
  const { range, size, selectedParam } = context.state.curveEditor;
  const automaton = context.state.automaton.instance;

  useEffect( // update nodes
    () => {
      if ( !automaton || !selectedParam ) { return; }
      const param = automaton.getParam( selectedParam )!;
      context.dispatch( {
        type: CurveEditorActionType.UpdateSerializedParam,
        param
      } );
    },
    [ automaton, selectedParam ]
  );

  useEffect( // update points when precalc happened
    () => {
      if ( !automaton || !selectedParam ) { return; }
      const param = automaton.getParam( selectedParam )!;

      const handlePrecalc = (): void => context.dispatch( {
        type: CurveEditorActionType.UpdateSerializedParam,
        param
      } );

      param.on( ParamWithGUIEvent.Precalc, handlePrecalc );
      return () => param.off( ParamWithGUIEvent.Precalc, handlePrecalc );
    },
    [ automaton, selectedParam ]
  );

  const grabNode = ( index: number ): void => {
    if ( !automaton || !selectedParam ) { return; }
    const param = automaton.getParam( selectedParam )!;
    const node = param.getNodeByIndex( index );
    const tPrev = node.time;
    const vPrev = node.value;
    let x = t2x( tPrev, range, size.width );
    let y = v2y( vPrev, range, size.height );
    let t = tPrev;
    let v = vPrev;
    let hasMoved = false;

    registerMouseEvent(
      ( event ) => {
        hasMoved = true;
        x += event.movementX;
        y += event.movementY;

        const holdTime = event.ctrlKey || event.metaKey;
        const holdValue = event.shiftKey;

        t = holdTime ? tPrev : x2t( x, range, size.width );
        v = holdValue ? vPrev : y2v( y, range, size.height );

        param.moveNode( node.$id, t, v );
      },
      () => {
        if ( !hasMoved ) { return; }

        const redo = (): void => param.moveNode( node.$id, t, v );

        context.dispatch( {
          type: HistoryActionType.Push,
          entry: {
            description: 'Move Node',
            redo,
            undo: () => param.moveNode( node.$id, tPrev, vPrev )
          }
        } );
        redo();
      }
    );
  };

  const removeNode = ( index: number ): void => {
    if ( !automaton || !selectedParam ) { return; }
    const param = automaton.getParam( selectedParam )!;
    const node = param.getNodeByIndex( index );

    const redo = (): void => param.removeNode( node.$id );

    context.dispatch( {
      type: HistoryActionType.Push,
      entry: {
        description: 'Remove Node',
        redo,
        undo: () => param.createNodeFromData( node )
      }
    } );
    redo();
  };

  const handleNodeClick = ( event: React.MouseEvent, index: number ): void => {
    event.preventDefault();
    event.stopPropagation();

    if ( event.buttons === 1 ) {
      const now = Date.now();
      const isDoubleClick = ( now - context.state.controls.lastClick ) < 250;
      context.dispatch( { type: ControlsActionType.SetLastClick, date: now } );

      if ( isDoubleClick ) {
        removeNode( index );
      } else {
        grabNode( index );
      }
    }
  };

  const grabHandle = ( index: number, dir: 'in' | 'out' ): void => {
    if ( !automaton || !selectedParam ) { return; }
    const param = automaton.getParam( selectedParam )!;
    const node = param.getNodeByIndex( index );
    const tPrev = node[ dir ]!.time;
    const vPrev = node[ dir ]!.value;
    const dirOpposite = dir === 'in' ? 'out' : 'in';
    const tOppositePrev = node[ dirOpposite ]!.time;
    const vOppositePrev = node[ dirOpposite ]!.value;
    const xPrev = dt2dx( tPrev, range, size.width );
    const yPrev = dv2dy( vPrev, range, size.height );
    const lPrev = Math.sqrt( xPrev * xPrev + yPrev * yPrev );
    const nxPrev = xPrev / lPrev;
    const nyPrev = yPrev / lPrev;
    let x = xPrev;
    let y = yPrev;
    let t = tPrev;
    let v = vPrev;
    let tOpposite = tOppositePrev;
    let vOpposite = vOppositePrev;
    let hasMoved = false;

    registerMouseEvent(
      ( event ) => {
        hasMoved = true;
        x += event.movementX;
        y += event.movementY;

        const holdDir = event.shiftKey;
        const moveBoth = event.ctrlKey || event.metaKey;

        let xDash = x;
        let yDash = y;

        if ( holdDir ) {
          const dot = x * nxPrev + y * nyPrev;
          xDash = dot * nxPrev;
          yDash = dot * nyPrev;
        }

        t = dx2dt( xDash, range, size.width );
        v = dy2dv( yDash, range, size.height );

        tOpposite = moveBoth ? -t : tOppositePrev;
        vOpposite = moveBoth ? -v : vOppositePrev;

        param.moveHandle( node.$id, dir, t, v );
        param.moveHandle( node.$id, dirOpposite, tOpposite, vOpposite );
      },
      () => {
        if ( !hasMoved ) { return; }

        const redo = (): void => {
          param.moveHandle( node.$id, dir, t, v );
          param.moveHandle( node.$id, dirOpposite, tOpposite, vOpposite );
        };

        context.dispatch( {
          type: HistoryActionType.Push,
          entry: {
            description: 'Move Handle',
            redo,
            undo: () => {
              param.moveHandle( node.$id, dir, tPrev, vPrev );
              param.moveHandle( node.$id, dirOpposite, tOppositePrev, vOppositePrev );
            }
          }
        } );
        redo();
      }
    );
  };

  const removeHandle = ( index: number, dir: 'in' | 'out' ): void => {
    if ( !automaton || !selectedParam ) { return; }
    const param = automaton.getParam( selectedParam )!;
    const node = param.getNodeByIndex( index );
    const tPrev = node[ dir ]!.time;
    const vPrev = node[ dir ]!.value;

    const redo = (): void => param.moveHandle( node.$id, dir, 0.0, 0.0 );

    context.dispatch( {
      type: HistoryActionType.Push,
      entry: {
        description: 'Remove Handle',
        redo,
        undo: () => param.moveHandle( node.$id, dir, tPrev, vPrev )
      }
    } );
    redo();
  };

  const handleHandleClick = ( event: React.MouseEvent, index: number, dir: 'in' | 'out' ): void => {
    event.preventDefault();
    event.stopPropagation();

    if ( event.buttons === 1 ) {
      const now = Date.now();
      const isDoubleClick = ( now - context.state.controls.lastClick ) < 250;
      context.dispatch( { type: ControlsActionType.SetLastClick, date: now } );

      if ( isDoubleClick ) {
        removeHandle( index, dir );
      } else {
        grabHandle( index, dir );
      }
    }
  };

  return (
    <Root className={ props.className }>
      {
        context.state.curveEditor.serializedParam &&
        context.state.curveEditor.serializedParam.nodes.map( ( node, i ) => (
          <g key={ i }
            transform={ `translate(${
              t2x( node.time, range, size.width )
            },${
              v2y( node.value, range, size.height )
            })` }
          >
            { node.in && <>
              <HandleLine
                x2={ dt2dx( node.in.time, range, size.width ) }
                y2={ dv2dy( node.in.value, range, size.height ) }
              />
              <HandleCircle
                r="4"
                transform={ `translate(${
                  dt2dx( node.in.time, range, size.width )
                },${
                  dv2dy( node.in.value, range, size.height )
                })` }
                onMouseDown={ ( event ) => handleHandleClick( event, i, 'in' ) }
              />
            </> }
            { node.out && <>
              <HandleLine
                x2={ dt2dx( node.out.time, range, size.width ) }
                y2={ dv2dy( node.out.value, range, size.height ) }
              />
              <HandleCircle
                r="4"
                transform={ `translate(${
                  dt2dx( node.out.time, range, size.width )
                },${
                  dv2dy( node.out.value, range, size.height )
                })` }
                onMouseDown={ ( event ) => handleHandleClick( event, i, 'out' ) }
              />
            </> }
            <NodeBody
              as="circle"
              r="5"
              isSelected={ false }
              onMouseDown={ ( event ) => handleNodeClick( event, i ) }
            />
          </g>
        ) )
      }
    </Root>
  );
};
