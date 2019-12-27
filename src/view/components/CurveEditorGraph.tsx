import { CurveEditorRange, CurveEditorSize, v2y, x2t } from '../utils/CurveEditorUtils';
import React, { useContext, useEffect, useState } from 'react';
import { Colors } from '../constants/Colors';
import { Contexts } from '../contexts/Context';
import { ParamWithGUI } from '../../ParamWithGUI';
import styled from 'styled-components';

// == styles =======================================================================================
const GraphLine = styled.polyline`
  fill: none;
  stroke: ${ Colors.fore };
  stroke-width: 0.125rem;
`;

const Root = styled.g`
`;

// == functions ====================================================================================
function calcPoints(
  param: ParamWithGUI,
  range: CurveEditorRange,
  size: CurveEditorSize
): string {
  let newPoints = '';
  for ( let x = 0; x < size.width; x ++ ) {
    const t = x2t( x, range, size.width );
    const v = param.getValue( t );
    const y = v2y( v, range, size.height );
    newPoints += `${ x },${ y } `;
  }
  return newPoints;
}

// == element ======================================================================================
export interface CurveEditorGraphProps {
  className?: string;
}

export const CurveEditorGraph = ( { className }: CurveEditorGraphProps ): JSX.Element => {
  const contexts = useContext( Contexts.Store );
  const { range, size, selectedParam } = contexts.state.curveEditor;
  const automaton = contexts.state.automaton.instance;
  const param = selectedParam && automaton?.getParam( selectedParam ) || null;

  const [ points, setPoints ] = useState( '' );

  useEffect( // update points when precalc happened
    () => {
      if ( !param ) { return; }

      const handlePrecalc = (): void => setPoints( calcPoints( param, range, size ) );
      handlePrecalc();

      param.on( 'precalc', handlePrecalc );
      return () => param.off( 'precalc', handlePrecalc );
    },
    [ param, range, size ]
  );

  return (
    <Root className={ className }>
      <GraphLine points={ points } />
    </Root>
  );
};
