import React, { useEffect, useMemo, useState } from 'react';
import { TimeValueRange, v2y, x2t } from '../utils/TimeValueRange';
import { Colors } from '../constants/Colors';
import { CurveWithGUI } from '../../CurveWithGUI';
import { Resolution } from '../utils/Resolution';
import styled from 'styled-components';
import { useSelector } from '../states/store';

// == styles =======================================================================================
const GraphLine = styled.polyline`
  fill: none;
  stroke: ${ Colors.fore };
  stroke-width: 0.125rem;
  stroke-linecap: round;
  stroke-linejoin: round;
`;

// == functions ====================================================================================
function calcPoints(
  curve: CurveWithGUI,
  range: TimeValueRange,
  size: Resolution
): string {
  let newPoints = '';
  for ( let x = 0; x <= size.width; x ++ ) {
    const t = x2t( x, range, size.width );
    if ( curve.length < t ) { break; }
    const v = curve.getValue( t );
    const y = v2y( isNaN( v ) ? 0.0 : v, range, size.height );
    newPoints += `${ x },${ y } `;
  }
  return newPoints;
}

// == component ====================================================================================
interface Props {
  curve: number;
  range: TimeValueRange;
  size: Resolution;
}

const CurveEditorGraph = ( props: Props ): JSX.Element => {
  const { curve, range, size } = props;
  const automaton = useSelector( ( state ) => state.automaton.instance );
  const channel = automaton?.getCurve( curve );

  const [ points, setPoints ] = useState( '' );

  useEffect( // update points when precalc happened
    () => {
      if ( !channel ) { return; }

      const handlePrecalc = (): void => setPoints( calcPoints( channel, range, size ) );
      handlePrecalc();

      channel.on( 'precalc', handlePrecalc );
      return () => channel.off( 'precalc', handlePrecalc );
    },
    [ channel, range, size ]
  );

  return <>
    { useMemo( () => (
      <GraphLine points={ points } />
    ), [ points ] ) }
  </>;
};

export { CurveEditorGraph };
