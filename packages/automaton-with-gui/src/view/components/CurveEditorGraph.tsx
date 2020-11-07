import { Colors } from '../constants/Colors';
import { CurveWithGUI } from '../../CurveWithGUI';
import { Resolution } from '../utils/Resolution';
import { TimeValueRange, v2y, x2t } from '../utils/TimeValueRange';
import { useSelector } from '../states/store';
import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

// == styles =======================================================================================
const GraphLineWithoutFxs = styled.polyline`
  fill: none;
  stroke: ${ Colors.fore };
  opacity: 0.5;
  stroke-width: 0.5px;
  stroke-linecap: round;
  stroke-linejoin: round;
`;

const GraphLine = styled.polyline`
  fill: none;
  stroke: ${ Colors.fore };
  stroke-width: 2px;
  stroke-linecap: round;
  stroke-linejoin: round;
`;

// == functions ====================================================================================
function calcPoints(
  curve: CurveWithGUI,
  range: TimeValueRange,
  size: Resolution
): { newPoints: string; newPointsWithoutFxs: string } {
  let newPoints = '';
  let newPointsWithoutFxs = '';

  for ( let x = 0; x <= size.width; x ++ ) {
    const t = x2t( x, range, size.width );
    if ( curve.length < t ) { break; }

    {
      const v = curve.getValue( t );
      const y = v2y( isNaN( v ) ? 0.0 : v, range, size.height );
      newPoints += `${ x },${ y } `;
    }

    {
      const v = curve.getValueWithoutFxs( t );
      const y = v2y( isNaN( v ) ? 0.0 : v, range, size.height );
      newPointsWithoutFxs += `${ x },${ y } `;
    }
  }

  return { newPoints, newPointsWithoutFxs };
}

// == component ====================================================================================
const CurveEditorGraph = ( props: {
  curveId: string;
  range: TimeValueRange;
  size: Resolution;
} ): JSX.Element => {
  const { curveId, range, size } = props;
  const automaton = useSelector( ( state ) => state.automaton.instance );
  const curve = automaton?.getCurveById( curveId );

  const [ points, setPoints ] = useState( '' );
  const [ pointsWithoutFxs, setPointsWithoutFxs ] = useState( '' );

  useEffect( // update points when precalc happened
    () => {
      if ( !curve ) { return; }

      const handlePrecalc = (): void => {
        const { newPoints, newPointsWithoutFxs } = calcPoints( curve, range, size );
        setPoints( newPoints );
        setPointsWithoutFxs( newPointsWithoutFxs );
      };
      handlePrecalc();

      curve.on( 'precalc', handlePrecalc );
      return () => curve.off( 'precalc', handlePrecalc );
    },
    [ curve, range, size ]
  );

  return <>
    { useMemo( () => (
      <GraphLineWithoutFxs points={ pointsWithoutFxs } />
    ), [ pointsWithoutFxs ] ) }
    { useMemo( () => (
      <GraphLine points={ points } />
    ), [ points ] ) }
  </>;
};

export { CurveEditorGraph };
