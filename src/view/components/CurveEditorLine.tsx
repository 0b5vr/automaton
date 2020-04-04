import { t2x, v2y } from '../utils/TimeValueRange';
import { Colors } from '../constants/Colors';
import React from 'react';
import { Resolution } from '../utils/Resolution';
import { State } from '../states/store';
import styled from 'styled-components';
import { useSelector } from 'react-redux';

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
  size: Resolution;
}

const CurveEditorLine = ( props: CurveEditorLineProps ): JSX.Element => {
  const { className, size } = props;
  const {
    selectedCurve,
    range,
    automaton
  } = useSelector( ( state: State ) => ( {
    selectedCurve: state.curveEditor.selectedCurve,
    range: state.curveEditor.range,
    automaton: state.automaton.instance
  } ) );
  const {
    time,
    value
  } = useSelector( ( state: State ) => ( {
    time: selectedCurve != null && state.automaton.curves[ selectedCurve ].previewTime || null,
    value: selectedCurve != null && state.automaton.curves[ selectedCurve ].previewValue || null
  } ) );
  const curve = selectedCurve != null && automaton?.getCurve( selectedCurve ) || null;

  if ( time == null || value == null ) {
    return <></>;
  }

  console.error('Replace with TimeValueLines!!!!!!!!!!');

  const x = t2x( time, range, size.width );
  const y = v2y( value, range, size.height );

  return (
    <Root className={ className }>
      <g
        transform={ `translate(${ x },${ size.height })` }
      >
        <Line y2={ -size.height } />
        <Text x="2" y="-2">{ time.toFixed( 3 ) }</Text>
      </g>

      { curve && <>
        <g
          transform={ `translate(0,${ y })` }
        >
          <Line x2={ size.width } />
          <Text x="2" y="-2">{ value.toFixed( 3 ) }</Text>
        </g>

        <Circle
          transform={ `translate(${ x },${ y })` }
          r="5"
        />
      </> }
    </Root>
  );
};

export { CurveEditorLine };
