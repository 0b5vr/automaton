import { Action, State } from '../states/store';
import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Colors } from '../constants/Colors';
import { CurveStatusLevel } from '../../CurveWithGUI';
import { Dispatch } from 'redux';
import { Icons } from '../icons/Icons';
import { Metrics } from '../constants/Metrics';
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

const Icon = styled.img`
  position: absolute;
  right: 0.2rem;
  bottom: 0.1rem;
  height: calc( 100% - 0.2rem );
`;

const Root = styled.div<{ isSelected: boolean }>`
  position: relative;
  height: ${ Metrics.curveListEntryHeight }px;
  background: ${ ( { isSelected } ) => ( isSelected ? Colors.back4 : Colors.back3 ) };
`;

// == element ======================================================================================
export interface CurveListEntryProps {
  className?: string;
  index: number;
}

const CurveListEntry = ( props: CurveListEntryProps ): JSX.Element => {
  const { className, index } = props;
  const dispatch = useDispatch<Dispatch<Action>>();
  const { selectedCurve, status } = useSelector( ( state: State ) => ( {
    automaton: state.automaton.instance,
    selectedCurve: state.curveEditor.selectedCurve,
    status: state.automaton.curves[ index ].status
  } ) );
  const { path } = useSelector( ( state: State ) => ( {
    path: state.automaton.curves[ index ].path
  } ) );

  const handleClick = useCallback(
    () => {
      dispatch( {
        type: 'CurveEditor/SelectCurve',
        curve: index
      } );
    },
    []
  );

  return (
    <Root
      className={ className }
      onClick={ handleClick }
      isSelected={ selectedCurve === index }
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
      {
        status === null
          ? undefined
          : <Icon
            as={
              status.level === CurveStatusLevel.ERROR
                ? Icons.Error
                : Icons.Warning
            }
            data-stalker={ status.message }
          />
      }
    </Root>
  );
};

export { CurveListEntry };
