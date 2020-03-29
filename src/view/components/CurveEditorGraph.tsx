import { CurveEditorRange, CurveEditorSize, v2y, x2t } from '../utils/CurveEditorUtils';
import React, { useEffect, useMemo, useState } from 'react';
import { ChannelWithGUI } from '../../ChannelWithGUI';
import { Colors } from '../constants/Colors';
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

// == functions ====================================================================================
function calcPoints(
  channel: ChannelWithGUI,
  range: CurveEditorRange,
  size: CurveEditorSize
): string {
  let newPoints = '';
  for ( let x = 0; x < size.width; x ++ ) {
    const t = x2t( x, range, size.width );
    const v = channel.getValue( t );
    const y = v2y( isNaN( v ) ? 0.0 : v, range, size.height );
    newPoints += `${ x },${ y } `;
  }
  return newPoints;
}

// == element ======================================================================================
export interface CurveEditorGraphProps {
  className?: string;
}

export const CurveEditorGraph = ( { className }: CurveEditorGraphProps ): JSX.Element => {
  const selectedChannel = useSelector( ( state: State ) => state.curveEditor.selectedChannel );
  const range = useSelector( ( state: State ) => state.curveEditor.range );
  const size = useSelector( ( state: State ) => state.curveEditor.size );
  const automaton = useSelector( ( state: State ) => state.automaton.instance );
  const channel = selectedChannel && automaton?.getChannel( selectedChannel ) || null;

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

  return (
    <Root className={ className }>
      { useMemo( () => (
        <GraphLine points={ points } />
      ), [ points ] ) }
    </Root>
  );
};
