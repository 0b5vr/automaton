import { MouseComboBit, mouseCombo } from '../utils/mouseCombo';
import React, { useCallback } from 'react';
import { TimeValueRange, dt2dx, dv2dy, dx2dt, dy2dv, snapTime, snapValue, t2x, v2y, x2t, y2v } from '../utils/TimeValueRange';
import { useDispatch, useSelector } from '../states/store';
import { BezierNode } from '@fms-cat/automaton';
import { Colors } from '../constants/Colors';
import { Resolution } from '../utils/Resolution';
import { WithID } from '../../types/WithID';
import { arraySetHas } from '../utils/arraySet';
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
interface Props {
  curve: number;
  node: BezierNode & WithID;
  range: TimeValueRange;
  size: Resolution;
}

const CurveEditorNode = ( props: Props ): JSX.Element => {
  const { node, range, size } = props;
  const curveIndex = props.curve;
  const {
    guiSettings,
    automaton
  } = useSelector( ( state ) => ( {
    guiSettings: state.automaton.guiSettings,
    automaton: state.automaton.instance
  } ) );
  const dispatch = useDispatch();
  const checkDoubleClick = useDoubleClick();
  const curve = automaton?.getCurve( curveIndex ) || null;
  const selectedNodes = useSelector( ( state ) => state.curveEditor.selectedItems.nodes );

  const grabNode = useCallback(
    (): void => {
      if ( !curve ) { return; }

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

          curve.moveNodeTime( node.$id, t );
          curve.moveNodeValue( node.$id, v );
        },
        () => {
          if ( !hasMoved ) { return; }

          const undo = (): void => {
            curve.moveNodeTime( node.$id, tPrev );
            curve.moveNodeValue( node.$id, vPrev );
          };

          const redo = (): void => {
            curve.moveNodeTime( node.$id, t );
            curve.moveNodeValue( node.$id, v );
          };

          dispatch( {
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
    },
    [ node, curve, range, size, guiSettings ]
  );

  const removeNode = useCallback(
    (): void => {
      if ( !curve ) { return; }

      if ( curve.isFirstNode( node.$id ) ) { return; }

      const undo = (): void => {
        curve.createNodeFromData( node );
      };

      const redo = (): void => {
        curve.removeNode( node.$id );
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
    [ node, curve ]
  );

  const handleNodeClick = useCallback(
    mouseCombo( {
      [ MouseComboBit.LMB ]: () => {
        if ( checkDoubleClick() ) {
          removeNode();
        } else {
          dispatch( {
            type: 'CurveEditor/SelectItems',
            nodes: [ node.$id ]
          } );

          grabNode();
        }
      }
    } ),
    [ removeNode, grabNode ]
  );

  const grabHandle = useCallback(
    ( dir: 'in' | 'out' ): void => {
      if ( !curve ) { return; }

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

          curve.moveHandleTime( node.$id, dir, t );
          curve.moveHandleValue( node.$id, dir, v );
          curve.moveHandleTime( node.$id, dirOpposite, tOpposite );
          curve.moveHandleValue( node.$id, dirOpposite, vOpposite );
        },
        () => {
          if ( !hasMoved ) { return; }

          const undo = (): void => {
            curve.moveHandleTime( node.$id, dir, tPrev );
            curve.moveHandleValue( node.$id, dir, vPrev );
            curve.moveHandleTime( node.$id, dirOpposite, tOppositePrev );
            curve.moveHandleValue( node.$id, dirOpposite, vOppositePrev );
          };

          const redo = (): void => {
            curve.moveHandleTime( node.$id, dir, t );
            curve.moveHandleValue( node.$id, dir, v );
            curve.moveHandleTime( node.$id, dirOpposite, tOpposite );
            curve.moveHandleValue( node.$id, dirOpposite, vOpposite );
          };

          dispatch( {
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
    },
    [ node, curve, range, size ]
  );

  const removeHandle = useCallback(
    ( dir: 'in' | 'out' ): void => {
      if ( !curve ) { return; }

      const tPrev = node[ dir ]!.time;
      const vPrev = node[ dir ]!.value;

      const undo = (): void => {
        curve.moveHandleTime( node.$id, dir, tPrev );
        curve.moveHandleValue( node.$id, dir, vPrev );
      };

      const redo = (): void => {
        curve.moveHandleTime( node.$id, dir, 0.0 );
        curve.moveHandleValue( node.$id, dir, 0.0 );
      };

      dispatch( {
        type: 'History/Push',
        entry: {
          description: 'Remove Handle',
          redo,
          undo
        }
      } );
      redo();
    },
    [ node, curve ]
  );

  const handleHandleInClick = useCallback(
    mouseCombo( {
      [ MouseComboBit.LMB ]: () => {
        if ( checkDoubleClick() ) {
          removeHandle( 'in' );
        } else {
          grabHandle( 'in' );
        }
      }
    } ),
    [ removeHandle, grabHandle ]
  );

  const handleHandleOutClick = useCallback(
    mouseCombo( {
      [ MouseComboBit.LMB ]: () => {
        if ( checkDoubleClick() ) {
          removeHandle( 'out' );
        } else {
          grabHandle( 'out' );
        }
      }
    } ),
    [ removeHandle, grabHandle ]
  );

  return (
    <Root
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
          onMouseDown={ handleHandleInClick }
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
          onMouseDown={ handleHandleOutClick }
        />
      </> }
      <NodeBody
        as="circle"
        r="5"
        isSelected={ arraySetHas( selectedNodes, node.$id ) }
        onMouseDown={ handleNodeClick }
      />
    </Root>
  );
};

export { CurveEditorNode };
