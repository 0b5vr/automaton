import { Colors } from '../constants/Colors';
import React from 'react';
import { State } from '../states/store';
import styled from 'styled-components';
import { useSelector } from 'react-redux';

// == styles =======================================================================================
const GraphLine = styled.polyline`
  fill: none;
  stroke: ${ Colors.fore };
  stroke-width: 0.125rem;
  stroke-linecap: round;
  stroke-linejoin: round;
`;

const Root = styled.g`
`;

// == element ======================================================================================
export interface CurveEditorGraphProps {
  className?: string;
}

const CurveEditorGraph = ( { className }: CurveEditorGraphProps ): JSX.Element => {
  const { selectedCurve } = useSelector( ( state: State ) => ( {
    selectedCurve: state.curveEditor.selectedCurve,
  } ) );
  const { path } = useSelector( ( state: State ) => ( {
    path: selectedCurve != null && state.automaton.curves[ selectedCurve ].path || null
  } ) );

  if ( !path ) { return <></>; }

  return (
    <Root className={ className }>
      <GraphLine points={ path } />
    </Root>
  );
};

export { CurveEditorGraph };
