import { Colors } from '../constants/Colors';
import React from 'react';
import { TimeRange } from '../utils/TimeValueRange';
import styled from 'styled-components';

// == styles =======================================================================================
const Bar = styled.div`
  position: absolute;
  top: 0;
  height: 100%;
  border-radius: 1px;
  background: ${ Colors.accent };
`;

const Root = styled.div`
  background: ${ Colors.black };
`;

// == component ====================================================================================
interface Props {
  className?: string;
  range: TimeRange;
  length: number;
  width: number;
}

const RangeBar = ( props: Props ): JSX.Element => {
  const { className, range, length, width } = props;

  const x = range.t0 / length * width;
  const w = ( range.t1 - range.t0 ) / length * width;

  return (
    <Root
      className={ className }
      style={ {
        width: `${ width }px`
      } }
    >
      <Bar
        style={ {
          left: `${ x }px`,
          width: `${ w }px`
        } }
      />
    </Root>
  );
};

export { RangeBar };
