import { Colors } from '../constants/Colors';
import { Resolution } from '../utils/Resolution';
import { TimeValueRange, t2x, v2y } from '../utils/TimeValueRange';
import { useSelector } from '../states/store';
import { useTimeUnit } from '../utils/useTimeUnit';
import React from 'react';
import styled from 'styled-components';

// == microcomponents ==============================================================================
const Beat = ( props: {
  time: number,
  isAbsolute?: boolean,
} ): JSX.Element | null => {
  const { time } = props;
  const { timeToBeat } = useTimeUnit();
  const isAbsolute = props.isAbsolute ?? false;
  const { snapBeatActive } = useSelector( ( state ) => ( {
    snapBeatActive: state.automaton.guiSettings.snapBeatActive,
  } ) );

  const beat = timeToBeat( time, isAbsolute );
  return snapBeatActive ? <>{ beat.toFixed( 3 ) }</> : null;
};

// == styles =======================================================================================
const Line = styled.line`
  stroke: ${ Colors.accent };
  stroke-width: 2px;
  pointer-events: none;
`;

const Text = styled.text`
  fill: ${ Colors.accent };
  font-size: 10px;
  pointer-events: none;
`;

const Circle = styled.circle`
  fill: ${ Colors.accent };
  pointer-events: none;
`;

// == element ======================================================================================
export interface TimeValueLinesProps {
  time?: number;
  value?: number;

  /**
   * Whether it should consider beatOffset or not
   */
  isAbsolute?: boolean;

  range: TimeValueRange;
  size: Resolution;
}

const TimeValueLines = ( props: TimeValueLinesProps ): JSX.Element => {
  const { time, value, isAbsolute, range, size } = props;

  const x = time != null && t2x( time, range, size.width ) || 0.0;
  const y = value != null && v2y( value, range, size.height ) || 0.0;

  return (
    <>
      { time != null && (
        <g transform={ `translate(${ x },${ size.height })` }>
          <Line y2={ -size.height } />
          <Text x="2" y="-2">{ time.toFixed( 3 ) }</Text>
          <Text x="2" y="-12"><Beat time={ time } isAbsolute={ isAbsolute } /></Text>
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
