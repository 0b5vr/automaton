import React, { useCallback } from 'react';
import { useDispatch, useSelector } from '../states/store';
import { Colors } from '../constants/Colors';
import { Icons } from '../icons/Icons';
import { StatusLevel } from '../../types/Status';
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
  background: ${ ( { isSelected } ) => ( isSelected ? Colors.back4 : Colors.back3 ) };
  box-shadow: ${ ( { isSelected } ) => ( isSelected ? `0 0 0 1px ${ Colors.accent }` : 'none' ) };
`;

// == element ======================================================================================
export interface CurveListEntryProps {
  className?: string;
  index: number;
}

const CurveListEntry = ( props: CurveListEntryProps ): JSX.Element => {
  const { className, index } = props;
  const dispatch = useDispatch();
  const { selectedCurve, status } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
    selectedCurve: state.curveEditor.selectedCurve,
    status: state.automaton.curves[ index ].status
  } ) );
  const { path } = useSelector( ( state ) => ( {
    path: state.automaton.curves[ index ].path
  } ) );

  const handleClick = useCallback(
    () => {
      if ( selectedCurve === index ) {
        dispatch( {
          type: 'CurveEditor/SelectCurve',
          curve: null
        } );
      } else {
        dispatch( {
          type: 'CurveEditor/SelectCurve',
          curve: index
        } );
      }
    },
    [ selectedCurve ]
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
              status.level === StatusLevel.ERROR
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
