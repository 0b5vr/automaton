import React, { useRef } from 'react';
import { Colors } from '../constants/Colors';
import { State } from '../states/store';
import { TimeValueGrid } from './TimeValueGrid';
import styled from 'styled-components';
import { useRect } from '../utils/useRect';
import { useSelector } from 'react-redux';

// == styles =======================================================================================
const Root = styled.div`
  background: ${ Colors.back1 };
`;

// == component ====================================================================================
interface DopeSheetUnderlayProps {
  className?: string;
}

const DopeSheetUnderlay = ( props: DopeSheetUnderlayProps ): JSX.Element => {
  const { className } = props;
  const refRoot = useRef<HTMLDivElement>( null );
  const { width, height } = useRect( refRoot );
  const { range } = useSelector( ( state: State ) => ( {
    range: state.timeline.range,
  } ) );

  return (
    <Root
      className={ className }
      ref={ refRoot }
    >
      <TimeValueGrid
        range={ range }
        size={ { width, height } }
        hideValue
      />
    </Root>
  );
};

export { DopeSheetUnderlay };
