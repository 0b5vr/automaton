import { CurveEditorRange, v2y, x2t } from '../utils/CurveEditorUtils';
import { ParamWithGUI, ParamWithGUIEvent } from '../../ParamWithGUI';
import React, { useContext, useEffect, useState } from 'react';
import { Colors } from '../style-constants/Colors';
import { Context } from '../contexts/Context';
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
  size: { width: number; height: number }
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
  const context = useContext( Context.Store );
  const automaton = context.state.automaton.instance;
  const { selectedParam, range, size } = context.state.curveEditor;
  const [ points, setPoints ] = useState( '' );

  useEffect( // update points
    () => {
      if ( !automaton || !selectedParam ) { return; }
      const param = automaton.getParam( selectedParam )!;
      setPoints( calcPoints( param, range, size ) );
    },
    [ automaton, selectedParam, range, size ]
  );

  useEffect( // update points when precalc happened
    () => {
      if ( !automaton || !selectedParam ) { return; }
      const param = automaton.getParam( selectedParam )!;

      const handlePrecalc = (): void => setPoints( calcPoints( param, range, size ) );

      param.on( ParamWithGUIEvent.Precalc, handlePrecalc );
      return () => param.off( ParamWithGUIEvent.Precalc, handlePrecalc );
    },
    [ automaton, selectedParam, range, size ]
  );

  return (
    <Root className={ className }>
      <GraphLine points={ points } />
    </Root>
  );
};
