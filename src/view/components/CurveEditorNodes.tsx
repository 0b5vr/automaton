import React, { useContext } from 'react';
import { dt2dx, dv2dy, dx2dt, dy2dv, snapTime, snapValue, t2x, v2y, x2t, y2v } from '../utils/CurveEditorUtils';
import { BezierNode } from '@fms-cat/automaton';
import { Colors } from '../constants/Colors';
import { Contexts } from '../contexts/Context';
import { WithID } from '../../types/WithID';
import { registerMouseEvent } from '../utils/registerMouseEvent';
import styled from 'styled-components';
import { useDoubleClick } from '../utils/useDoubleClick';

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
  const contexts = useContext( Contexts.Store );
  const checkDoubleClick = useDoubleClick();
  const { range, size, selectedParam } = contexts.state.curveEditor;
  const { guiSettings } = contexts.state.automaton;
  const automaton = contexts.state.automaton.instance;
  const param = selectedParam && automaton?.getParam( selectedParam ) || null;
  const nodes = selectedParam && contexts.state.automaton.params[ selectedParam ].nodes || null;

  const grabNode = ( node: BezierNode & WithID ): void => {
    if ( !param ) { return; }

    const tPrev = node.time;
    const vPrev = node.value;
    let x = t2x( tPrev, range, size.width );
    let y = v2y( vPrev, range, size.height );
    let t = tPrev;
    let v = vPrev;
    let hasMoved = false;

    registerMouseEvent(
      ( event, movementSum ) => {
        hasMoved = true;
        x += movementSum.x;
        y += movementSum.y;

        const holdTime = event.ctrlKey || event.metaKey;
        const holdValue = event.shiftKey;
        const ignoreSnap = event.altKey;

        t = holdTime ? tPrev : x2t( x, range, size.width );
        v = holdValue ? vPrev : y2v( y, range, size.height );

        if ( !ignoreSnap ) {
          if ( !holdTime ) { t = snapTime( t, range, size.width, guiSettings ); }
          if ( !holdValue ) { v = snapValue( v, range, size.height, guiSettings ); }
        }

        param.moveNodeTime( node.$id, t );
        param.moveNodeValue( node.$id, v );
      },
      () => {
        if ( !hasMoved ) { return; }

        const undo = (): void => {
          param.moveNodeTime( node.$id, tPrev );
          param.moveNodeValue( node.$id, vPrev );
        };

        const redo = (): void => {
          param.moveNodeTime( node.$id, t );
          param.moveNodeValue( node.$id, v );
        };

        contexts.dispatch( {
          type: 'History/Push',
          entry: {
            description: 'Move Node',
            redo,
            undo
          }
        } );
        redo();
      }
    );
  };

  const removeNode = ( node: BezierNode & WithID ): void => {
    if ( !param ) { return; }

    if ( param.isFirstOrLastNode( node.$id ) ) { return; }

    const undo = (): void => {
      param.createNodeFromData( node );
    };

    const redo = (): void => {
      param.removeNode( node.$id );
    };

    contexts.dispatch( {
      type: 'History/Push',
      entry: {
        description: 'Remove Node',
        redo,
        undo
      }
    } );
    redo();
  };

  const handleNodeClick = ( event: React.MouseEvent, node: BezierNode & WithID ): void => {
    event.preventDefault();
    event.stopPropagation();

    if ( event.buttons === 1 ) {
      if ( checkDoubleClick() ) {
        removeNode( node );
      } else {
        contexts.dispatch( {
          type: 'CurveEditor/SelectItems',
          nodes: [ node.$id ]
        } );

        grabNode( node );
      }
    }
  };

  const grabHandle = ( node: BezierNode & WithID, dir: 'in' | 'out' ): void => {
    if ( !param ) { return; }

    const tPrev = node[ dir ]?.time || 0.0;
    const vPrev = node[ dir ]?.value || 0.0;
    const dirOpposite = dir === 'in' ? 'out' : 'in';
    const tOppositePrev = node[ dirOpposite ]?.time || 0.0;
    const vOppositePrev = node[ dirOpposite ]?.value || 0.0;
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
      ( event, movementSum ) => {
        hasMoved = true;
        x += movementSum.x;
        y += movementSum.y;

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

        param.moveHandleTime( node.$id, dir, t );
        param.moveHandleValue( node.$id, dir, v );
        param.moveHandleTime( node.$id, dirOpposite, tOpposite );
        param.moveHandleValue( node.$id, dirOpposite, vOpposite );
      },
      () => {
        if ( !hasMoved ) { return; }

        const undo = (): void => {
          param.moveHandleTime( node.$id, dir, tPrev );
          param.moveHandleValue( node.$id, dir, vPrev );
          param.moveHandleTime( node.$id, dirOpposite, tOppositePrev );
          param.moveHandleValue( node.$id, dirOpposite, vOppositePrev );
        };

        const redo = (): void => {
          param.moveHandleTime( node.$id, dir, t );
          param.moveHandleValue( node.$id, dir, v );
          param.moveHandleTime( node.$id, dirOpposite, tOpposite );
          param.moveHandleValue( node.$id, dirOpposite, vOpposite );
        };

        contexts.dispatch( {
          type: 'History/Push',
          entry: {
            description: 'Move Handle',
            redo,
            undo
          }
        } );
        redo();
      }
    );
  };

  const removeHandle = ( node: BezierNode & WithID, dir: 'in' | 'out' ): void => {
    if ( !param ) { return; }

    const tPrev = node[ dir ]!.time;
    const vPrev = node[ dir ]!.value;

    const undo = (): void => {
      param.moveHandleTime( node.$id, dir, tPrev );
      param.moveHandleValue( node.$id, dir, vPrev );
    };

    const redo = (): void => {
      param.moveHandleTime( node.$id, dir, 0.0 );
      param.moveHandleValue( node.$id, dir, 0.0 );
    };

    contexts.dispatch( {
      type: 'History/Push',
      entry: {
        description: 'Remove Handle',
        redo,
        undo
      }
    } );
    redo();
  };

  const handleHandleClick = (
    event: React.MouseEvent,
    node: BezierNode & WithID,
    dir: 'in' | 'out'
  ): void => {
    event.preventDefault();
    event.stopPropagation();

    if ( event.buttons === 1 ) {
      if ( checkDoubleClick() ) {
        removeHandle( node, dir );
      } else {
        grabHandle( node, dir );
      }
    }
  };

  return (
    <Root className={ props.className }>
      {
        nodes && Object.values( nodes ).map( ( node ) => (
          <g key={ node.$id }
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
                onMouseDown={ ( event ) => handleHandleClick( event, node, 'in' ) }
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
                onMouseDown={ ( event ) => handleHandleClick( event, node, 'out' ) }
              />
            </> }
            <NodeBody
              as="circle"
              r="5"
              isSelected={
                contexts.state.curveEditor.selectedItems.nodes.indexOf( node.$id ) !== -1
              }
              onMouseDown={ ( event ) => handleNodeClick( event, node ) }
            />
          </g>
        ) )
      }
    </Root>
  );
};
