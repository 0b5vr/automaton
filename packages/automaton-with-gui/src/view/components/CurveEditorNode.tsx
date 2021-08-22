import { BezierNode } from '@0b5vr/automaton';
import { Colors } from '../constants/Colors';
import { MouseComboBit, mouseCombo } from '../utils/mouseCombo';
import { Resolution } from '../utils/Resolution';
import { TimeValueRange, dt2dx, dv2dy, dx2dt, dy2dv, snapTime, snapValue, t2x, v2y, x2t, y2v } from '../utils/TimeValueRange';
import { WithID } from '../../types/WithID';
import { arraySetHas } from '../utils/arraySet';
import { registerMouseEvent } from '../utils/registerMouseEvent';
import { useDispatch, useSelector } from '../states/store';
import { useDoubleClick } from '../utils/useDoubleClick';
import React, { useCallback } from 'react';
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
const CurveEditorNode = ( props: {
  curveId: string;
  node: BezierNode & WithID;
  range: TimeValueRange;
  size: Resolution;
} ): JSX.Element => {
  const { node, range, size, curveId } = props;
  const {
    guiSettings,
    automaton
  } = useSelector( ( state ) => ( {
    guiSettings: state.automaton.guiSettings,
    automaton: state.automaton.instance
  } ) );
  const dispatch = useDispatch();
  const checkDoubleClick = useDoubleClick();
  const curve = automaton?.getCurveById( curveId ) || null;
  const selectedNodes = useSelector( ( state ) => state.curveEditor.selected.nodes );

  const grabNode = useCallback(
    (): void => {
      if ( !curve ) { return; }

      const timePrev = node.time;
      const valuePrev = node.value;
      let x = t2x( timePrev, range, size.width );
      let y = v2y( valuePrev, range, size.height );
      let time = timePrev;
      let value = valuePrev;
      let hasMoved = false;

      registerMouseEvent(
        ( event, movementSum ) => {
          hasMoved = true;
          x += movementSum.x;
          y += movementSum.y;

          const holdTime = event.ctrlKey || event.metaKey;
          const holdValue = event.shiftKey;
          const ignoreSnap = event.altKey;

          time = holdTime ? timePrev : x2t( x, range, size.width );
          value = holdValue ? valuePrev : y2v( y, range, size.height );

          if ( !ignoreSnap ) {
            if ( !holdTime ) { time = snapTime( time, range, size.width, guiSettings ); }
            if ( !holdValue ) { value = snapValue( value, range, size.height, guiSettings ); }
          }

          curve.moveNodeTime( node.$id, time );
          curve.moveNodeValue( node.$id, value );
        },
        () => {
          if ( !hasMoved ) { return; }

          curve.moveNodeTime( node.$id, time );
          curve.moveNodeValue( node.$id, value );

          dispatch( {
            type: 'History/Push',
            description: 'Move Node',
            commands: [
              {
                type: 'curve/moveNodeTime',
                curveId,
                node: node.$id,
                time,
                timePrev
              },
              {
                type: 'curve/moveNodeValue',
                curveId,
                node: node.$id,
                value,
                valuePrev
              }
            ]
          } );
        }
      );
    },
    [ node, curve, curveId, range, size, guiSettings, dispatch ]
  );

  const removeNode = useCallback(
    (): void => {
      if ( !curve ) { return; }

      if ( curve.isFirstNode( node.$id ) ) { return; }

      curve.removeNode( node.$id );

      dispatch( {
        type: 'History/Push',
        description: 'Remove Node',
        commands: [
          {
            type: 'curve/removeNode',
            curveId,
            data: node
          }
        ],
      } );
    },
    [ node, curve, dispatch, curveId ]
  );

  const handleNodeClick = useCallback(
    ( event ) => mouseCombo( event, {
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
    [ checkDoubleClick, removeNode, dispatch, node.$id, grabNode ]
  );

  const grabHandle = useCallback(
    ( dir: 'in' | 'out' ): void => {
      if ( !curve ) { return; }

      const tPrev = node[ dir === 'in' ? 'inTime' : 'outTime' ];
      const vPrev = node[ dir === 'in' ? 'inValue' : 'outValue' ];
      const dirOp = dir === 'in' ? 'out' : 'in';
      const tOpPrev = node[ dir === 'in' ? 'outTime' : 'inTime' ];
      const vOpPrev = node[ dir === 'in' ? 'outValue' : 'inValue' ];
      const xPrev = dt2dx( tPrev, range, size.width );
      const yPrev = dv2dy( vPrev, range, size.height );
      const slPrev = Math.sqrt( xPrev * xPrev + yPrev * yPrev );
      const nxPrev = xPrev / slPrev;
      const nyPrev = yPrev / slPrev;
      const xOpPrev = dt2dx( tOpPrev, range, size.width );
      const yOpPrev = dv2dy( vOpPrev, range, size.height );
      const slOpPrev = Math.sqrt( xOpPrev * xOpPrev + yOpPrev * yOpPrev );
      let x = xPrev;
      let y = yPrev;
      let time = tPrev;
      let value = vPrev;
      let tOp = tOpPrev;
      let vOp = vOpPrev;
      let hasMoved = false;

      registerMouseEvent(
        ( event, movementSum ) => {
          hasMoved = true;
          x += movementSum.x;
          y += movementSum.y;

          const holdDir = event.shiftKey;
          const moveBoth = event.ctrlKey || event.metaKey;
          const independent = event.altKey;

          let xDash = x;
          let yDash = y;

          if ( holdDir ) {
            const dot = x * nxPrev + y * nyPrev;
            xDash = dot * nxPrev;
            yDash = dot * nyPrev;
          }

          time = dx2dt( xDash, range, size.width );
          value = dy2dv( yDash, range, size.height );

          if ( independent ) {
            tOp = tOpPrev;
            vOp = vOpPrev;
          } else if ( moveBoth ) {
            tOp = -time;
            vOp = -value;
          } else {
            const sl = Math.sqrt( xDash * xDash + yDash * yDash );
            const nxDash = xDash / sl;
            const nyDash = yDash / sl;
            tOp = -dx2dt( slOpPrev * nxDash, range, size.width );
            vOp = -dy2dv( slOpPrev * nyDash, range, size.height );
          }

          curve.moveHandleTime( node.$id, dir, time );
          curve.moveHandleValue( node.$id, dir, value );
          curve.moveHandleTime( node.$id, dirOp, tOp );
          curve.moveHandleValue( node.$id, dirOp, vOp );
        },
        () => {
          if ( !hasMoved ) { return; }

          curve.moveHandleTime( node.$id, dir, time );
          curve.moveHandleValue( node.$id, dir, value );
          curve.moveHandleTime( node.$id, dirOp, tOp );
          curve.moveHandleValue( node.$id, dirOp, vOp );

          dispatch( {
            type: 'History/Push',
            description: 'Move Handle',
            commands: [
              {
                type: 'curve/moveHandleTime',
                curveId,
                node: node.$id,
                dir,
                time,
                timePrev: tPrev
              },
              {
                type: 'curve/moveHandleTime',
                curveId,
                node: node.$id,
                dir: dirOp,
                time: tOp,
                timePrev: tOpPrev
              },
              {
                type: 'curve/moveHandleValue',
                curveId,
                node: node.$id,
                dir,
                value,
                valuePrev: vPrev
              },
              {
                type: 'curve/moveHandleValue',
                curveId,
                node: node.$id,
                dir: dirOp,
                value: vOp,
                valuePrev: vOpPrev
              }
            ],
          } );
        }
      );
    },
    [ node, curve, curveId, range, size, dispatch ]
  );

  const removeHandle = useCallback(
    ( dir: 'in' | 'out' ): void => {
      if ( !curve ) { return; }

      const timePrev = node[ dir === 'in' ? 'inTime' : 'outTime' ];
      const valuePrev = node[ dir === 'in' ? 'inValue' : 'outValue' ];

      curve.moveHandleTime( node.$id, dir, 0.0 );
      curve.moveHandleValue( node.$id, dir, 0.0 );

      dispatch( {
        type: 'History/Push',
        description: 'Remove Handle',
        commands: [
          {
            type: 'curve/moveHandleTime',
            curveId,
            node: node.$id,
            dir,
            time: 0.0,
            timePrev
          },
          {
            type: 'curve/moveHandleValue',
            curveId,
            node: node.$id,
            dir,
            value: 0.0,
            valuePrev
          }
        ],
      } );
    },
    [ node, curve, dispatch, curveId ]
  );

  const handleHandleInClick = useCallback(
    ( event ) => mouseCombo( event, {
      [ MouseComboBit.LMB ]: () => {
        if ( checkDoubleClick() ) {
          removeHandle( 'in' );
        } else {
          grabHandle( 'in' );
        }
      }
    } ),
    [ checkDoubleClick, removeHandle, grabHandle ]
  );

  const handleHandleOutClick = useCallback(
    ( event ) => mouseCombo( event, {
      [ MouseComboBit.LMB ]: () => {
        if ( checkDoubleClick() ) {
          removeHandle( 'out' );
        } else {
          grabHandle( 'out' );
        }
      }
    } ),
    [ checkDoubleClick, removeHandle, grabHandle ]
  );

  return (
    <Root
      transform={ `translate(${
        t2x( node.time, range, size.width )
      },${
        v2y( node.value, range, size.height )
      })` }
    >
      <HandleLine
        x2={ dt2dx( node.inTime, range, size.width ) }
        y2={ dv2dy( node.inValue, range, size.height ) }
      />
      <HandleCircle
        r="4"
        transform={ `translate(${
          dt2dx( node.inTime, range, size.width )
        },${
          dv2dy( node.inValue, range, size.height )
        })` }
        onMouseDown={ handleHandleInClick }
      />
      <HandleLine
        x2={ dt2dx( node.outTime, range, size.width ) }
        y2={ dv2dy( node.outValue, range, size.height ) }
      />
      <HandleCircle
        r="4"
        transform={ `translate(${
          dt2dx( node.outTime, range, size.width )
        },${
          dv2dy( node.outValue, range, size.height )
        })` }
        onMouseDown={ handleHandleOutClick }
      />
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
