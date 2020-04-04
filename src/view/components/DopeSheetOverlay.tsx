import React, { useRef } from 'react';
import { Resolution } from '../utils/Resolution';
import { State } from '../states/store';
import { TimeValueLines } from './TimeValueLines';
import styled from 'styled-components';
import { useRect } from '../utils/useRect';
import { useSelector } from 'react-redux';

// == microcomponent ===============================================================================
const Line = ( { className, size }: {
  className?: string;
  size: Resolution;
} ): JSX.Element => {
  const { range, time } = useSelector( ( state: State ) => ( {
    range: state.timeline.range,
    time: state.automaton.time
  } ) );

  return (
    <TimeValueLines
      className={ className }
      range={ range }
      size={ size }
      time={ time }
    />
  );
};

// == styles =======================================================================================
const Root = styled.div`
`;

// == component ====================================================================================
interface DopeSheetOverlayProps {
  className?: string;
}

const DopeSheetOverlay = ( props: DopeSheetOverlayProps ): JSX.Element => {
  const { className } = props;
  const refRoot = useRef<HTMLDivElement>( null );
  const { width, height } = useRect( refRoot );

  return (
    <Root
      className={ className }
      ref={ refRoot }
    >
      <Line
        size={ { width, height } }
      />
    </Root>
  );
};

export { DopeSheetOverlay };
