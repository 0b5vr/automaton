import { Colors } from '../constants/Colors';
import { StatusIcon } from './StatusIcon';
import { showToasty } from '../states/Toasty';
import { useDispatch, useSelector } from '../states/store';
import React, { useCallback } from 'react';
import styled from 'styled-components';

// == styles =======================================================================================
const SvgRoot = styled.svg`
  position: absolute;
  left: 0;
  top: 0;
`;

const GraphLine = styled.polyline`
  fill: none;
  stroke: ${ Colors.fore };
  stroke-width: 0.125rem;
  stroke-linecap: round;
  stroke-linejoin: round;
`;

const Root = styled.div<{ isSelected: boolean }>`
  position: relative;
  background: ${ ( { isSelected } ) => ( isSelected ? Colors.back4 : Colors.back3 ) };
  box-shadow: ${ ( { isSelected } ) => ( isSelected ? `0 0 0 1px ${ Colors.accent }` : 'none' ) };
`;

// == element ======================================================================================
export interface CurveListEntryProps {
  className?: string;
  curveId: string;
}

const CurveListEntry = ( props: CurveListEntryProps ): JSX.Element => {
  const { className, curveId } = props;
  const dispatch = useDispatch();
  const { automaton, selectedCurve, status } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
    selectedCurve: state.curveEditor.selectedCurve,
    status: state.automaton.curves[ curveId ].status
  } ) );
  const { path } = useSelector( ( state ) => ( {
    path: state.automaton.curves[ curveId ].path
  } ) );

  const handleClick = useCallback(
    () => {
      if ( selectedCurve === curveId ) {
        dispatch( {
          type: 'CurveEditor/SelectCurve',
          curveId: null
        } );
      } else {
        dispatch( {
          type: 'CurveEditor/SelectCurve',
          curveId
        } );
      }
    },
    [ selectedCurve, curveId, dispatch ]
  );

  const editCurve = useCallback(
    (): void => {
      dispatch( {
        type: 'CurveEditor/SelectCurve',
        curveId
      } );

      dispatch( {
        type: 'Workspace/ChangeMode',
        mode: 'curve'
      } );
    },
    [ curveId, dispatch ]
  );

  const duplicateCurve = useCallback(
    () => {
      if ( !automaton ) { return; }

      const src = automaton.getCurveById( curveId )!.serialize();

      const newData = automaton.createCurve( src );

      dispatch( {
        type: 'CurveEditor/SelectCurve',
        curveId: newData.$id
      } );

      dispatch( {
        type: 'History/Push',
        description: 'Duplicate Curve',
        commands: [
          {
            type: 'automaton/createCurve',
            data: newData
          }
        ]
      } );
    },
    [ automaton, curveId, dispatch ]
  );

  const removeCurve = useCallback(
    () => {
      if ( !automaton ) { return; }

      const data = automaton.getCurveById( curveId ).serializeWithID();

      try {
        automaton.removeCurve( curveId );
      } catch ( e ) {
        if ( e?.name === 'CurveUsedError' ) {
          showToasty( {
            dispatch,
            kind: 'error',
            message: e.message
          } );
          return;
        }
        throw e;
      }

      dispatch( {
        type: 'History/Push',
        description: 'Remove Curve',
        commands: [
          {
            type: 'automaton/removeCurve',
            data
          }
        ]
      } );
    },
    [ automaton, curveId, dispatch ]
  );

  const handleContextMenu = useCallback(
    ( event: React.MouseEvent ): void => {
      event.preventDefault();

      const x = event.clientX;
      const y = event.clientY;

      dispatch( {
        type: 'ContextMenu/Push',
        position: { x, y },
        commands: [
          {
            name: 'Edit Curve',
            description: 'Edit the curve.',
            callback: () => editCurve()
          },
          {
            name: 'Duplicate Curve',
            description: 'Duplicate the curve.',
            callback: () => duplicateCurve()
          },
          {
            name: 'Remove Curve',
            description: 'Remove the curve.',
            callback: () => removeCurve()
          }
        ]
      } );
    },
    [ dispatch, editCurve, duplicateCurve, removeCurve ]
  );

  return (
    <Root
      className={ className }
      onClick={ handleClick }
      onContextMenu={ handleContextMenu }
      isSelected={ selectedCurve === curveId }
    >
      <SvgRoot
        width="100%"
        height="100%"
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
      >
        <GraphLine
          style={ {
            transform: 'translate(0, 1px) scale(1, -1)'
          } }
          points={ path }
          vectorEffect="non-scaling-stroke"
        />
      </SvgRoot>
      <StatusIcon status={ status } />
    </Root>
  );
};

export { CurveListEntry };
