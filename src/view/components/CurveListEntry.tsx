import React, { useCallback } from 'react';
import { useDispatch, useSelector } from '../states/store';
import { Colors } from '../constants/Colors';
import { StatusIcon } from './StatusIcon';
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
  const { selectedCurve, status } = useSelector( ( state ) => ( {
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
    [ selectedCurve ]
  );

  return (
    <Root
      className={ className }
      onClick={ handleClick }
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
