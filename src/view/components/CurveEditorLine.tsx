import React, { useContext } from 'react';
import { t2x, v2y } from '../utils/CurveEditorUtils';
import { Colors } from '../constants/Colors';
import { Contexts } from '../contexts/Context';
import styled from 'styled-components';

// == styles =======================================================================================
const Line = styled.line`
  stroke: ${ Colors.accent };
  stroke-width: 0.125rem;
`;

const Text = styled.text`
  fill: ${ Colors.accent };
  font-size: 0.6rem;
`;

const Circle = styled.circle`
  fill: ${ Colors.accent };
`;

const Root = styled.g`
`;

// == element ======================================================================================
export interface CurveEditorLineProps {
  className?: string;
}

export const CurveEditorLine = ( { className }: CurveEditorLineProps ): JSX.Element => {
  const { state } = useContext( Contexts.Store );
  const { range, size, selectedParam } = state.curveEditor;
  const automaton = state.automaton.instance;
  const param = selectedParam && automaton?.getParam( selectedParam ) || null;

  const t = state.automaton.time;
  const v = param?.value || 0.0;
  const x = t2x( t, range, size.width );
  const y = v2y( v, range, size.height );

  return (
    <Root className={ className }>
      <g
        transform={ `translate(${ x },${ size.height })` }
      >
        <Line y2={ -size.height } />
        <Text x="2" y="-2">{ t.toFixed( 3 ) }</Text>
      </g>

      { param && <>
        <g
          transform={ `translate(0,${ y })` }
        >
          <Line x2={ size.width } />
          <Text x="2" y="-2">{ v.toFixed( 3 ) }</Text>
        </g>

        <Circle
          transform={ `translate(${ x },${ y })` }
          r="5"
        />
      </> }
    </Root>
  );
};
