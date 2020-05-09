import { TimeValueRange, t2x } from '../utils/TimeValueRange';
import { Colors } from '../constants/Colors';
import React from 'react';
import { Resolution } from '../utils/Resolution';
import styled from 'styled-components';
import { useSelector } from '../states/store';

// == styles =======================================================================================
const Line = styled.line`
  stroke: ${ Colors.accent };
  stroke-width: 1px;
  pointer-events: none;
`;

const Text = styled.text`
  fill: ${ Colors.accent };
  font-size: 10px;
  pointer-events: none;
`;

const Region = styled.rect`
  fill: ${ Colors.accent };
  opacity: 0.1;
  pointer-events: none;
`;

// == element ======================================================================================
const TimeLoopRegion = ( props: {
  range: TimeValueRange;
  size: Resolution;
} ): JSX.Element | null => {
  const { range, size } = props;

  const { loopRegion } = useSelector( ( state ) => ( {
    loopRegion: state.automaton.loopRegion
  } ) );

  if ( !loopRegion ) { return null; }

  const xBegin = t2x( loopRegion.begin, range, size.width );
  const xEnd = t2x( loopRegion.end, range, size.width );

  return (
    <>
      <Region
        x={ xBegin }
        width={ xEnd - xBegin }
        height={ size.height }
      />
      <g transform={ `translate(${ xBegin },${ size.height })` }>
        <Line y2={ -size.height } />
        <Text x="2" y="-2">{ loopRegion.begin.toFixed( 3 ) }</Text>
      </g>
      <g transform={ `translate(${ xEnd },${ size.height })` }>
        <Line y2={ -size.height } />
        <Text x="2" y="-2">{ loopRegion.end.toFixed( 3 ) }</Text>
      </g>
    </>
  );
};

export { TimeLoopRegion };
