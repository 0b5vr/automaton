import React, { useMemo, useRef } from 'react';
import { TimeValueRange, t2x } from '../utils/TimeValueRange';
import { Colors } from '../constants/Colors';
import { Resolution } from '../utils/Resolution';
import styled from 'styled-components';

// == styles =======================================================================================
const Rect = styled.rect`
  fill: ${ Colors.foresub };
  pointer-events: auto;
`;

const Line = styled.line`
  stroke: ${ Colors.foresub };
  stroke-width: 1px;
  pointer-events: none;
`;

const Text = styled.text`
  fill: ${ Colors.back1 };
  font-size: 10px;
  pointer-events: auto;
`;

// == component ====================================================================================
const Label = ( { name, time, range, size }: {
  name: string;
  time: number;
  range: TimeValueRange;
  size: Resolution;
} ): JSX.Element => {
  const x = t2x( time, range, size.width );
  const refText = useRef<SVGTextElement>( null );
  const width = useMemo(
    () => {
      const text = refText.current;
      if ( !text ) { return 0.0; }
      return text.getBBox().width;
    },
    [ refText.current ]
  );

  return <>
    <g transform={ `translate(${ x },${ size.height })` }>
      <Line y2={ -size.height } />
      <Rect width={ width + 4 } height="12" y="-12" />
      <Text ref={ refText } x="2" y="-2">{ name }</Text>
    </g>
  </>;
};

export { Label };
