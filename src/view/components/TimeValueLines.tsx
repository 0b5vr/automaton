import { TimeValueRange, t2x, v2y } from '../utils/TimeValueRange';
import { Colors } from '../constants/Colors';
import React from 'react';
import { Resolution } from '../utils/Resolution';
import styled from 'styled-components';

// == styles =======================================================================================
const Line = styled.line`
  stroke: ${ Colors.accent };
  stroke-width: 2px;
`;

const Text = styled.text`
  fill: ${ Colors.accent };
  font-size: 10px;
`;

const Circle = styled.circle`
  fill: ${ Colors.accent };
`;

// == element ======================================================================================
export interface TimeValueLinesProps {
  time?: number;
  value?: number;
  range: TimeValueRange;
  size: Resolution;
}

const TimeValueLines = ( props: TimeValueLinesProps ): JSX.Element => {
  const { time, value, range, size } = props;

  const x = time != null && t2x( time, range, size.width ) || 0.0;
  const y = value != null && v2y( value, range, size.height ) || 0.0;

  return (
    <>
      { time != null && (
        <g transform={ `translate(${ x },${ size.height })` }>
          <Line y2={ -size.height } />
          <Text x="2" y="-2">{ time.toFixed( 3 ) }</Text>
        </g>
      ) }

      { value != null && (
        <g transform={ `translate(0,${ y })` }>
          <Line x2={ size.width } />
          <Text x="2" y="-2">{ value.toFixed( 3 ) }</Text>
        </g>
      ) }

      { time != null && value != null && (
        <Circle
          transform={ `translate(${ x },${ y })` }
          r="5"
        />
      ) }
    </>
  );
};

export { TimeValueLines };
