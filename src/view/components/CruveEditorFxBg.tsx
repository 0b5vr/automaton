import { TimeValueRange, dt2dx, t2x } from '../utils/TimeValueRange';
import { Colors } from '../constants/Colors';
import { FxSection } from '@fms-cat/automaton';
import React from 'react';
import { Resolution } from '../utils/Resolution';
import { WithBypass } from '../../types/WithBypass';
import { WithID } from '../../types/WithID';
import styled from 'styled-components';

// == styles =======================================================================================
const Fill = styled.rect`
  fill: ${ Colors.fx };
  opacity: 0.1;
`;

const Line = styled.line`
  stroke: ${ Colors.fx };
  stroke-width: 0.0625rem;
  stroke-dasharray: 0.25rem;
`;

const Root = styled.g`
  pointer-events: none;
`;

// == element ======================================================================================
const CurveEditorFxBg = ( props: {
  fx: FxSection & WithBypass & WithID;
  range: TimeValueRange;
  size: Resolution;
} ): JSX.Element | null => {
  const { fx, range, size } = props;

  const x = t2x( fx.time, range, size.width );

  if ( fx.bypass ) { return null; }

  return (
    <Root key={ fx.$id }
      transform={ `translate(${ x }, 0)` }
    >
      <Fill
        width={ dt2dx( fx.length, range, size.width ) }
        height={ size.height }
      />
      <Line
        x1="0"
        y1="0.25rem"
        x2="0"
        y2={ size.height }
      />
      <Line
        transform={ `translate(${ dt2dx( fx.length, range, size.width ) }, 0)` }
        x1="0"
        y1="0.25rem"
        x2="0"
        y2={ size.height }
      />
    </Root>
  );
};

export { CurveEditorFxBg };
