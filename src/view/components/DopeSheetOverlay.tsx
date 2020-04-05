import React, { useRef } from 'react';
import { Resolution } from '../utils/Resolution';
import { State } from '../states/store';
import { TimeValueLines } from './TimeValueLines';
import styled from 'styled-components';
import { useRect } from '../utils/useRect';
import { useSelector } from 'react-redux';

// == microcomponent ===============================================================================
const Line = ( { size }: {
  size: Resolution;
} ): JSX.Element => {
  const { range, time } = useSelector( ( state: State ) => ( {
    range: state.timeline.range,
    time: state.automaton.time
  } ) );

  return (
    <TimeValueLines
      range={ range }
      size={ size }
      time={ time }
    />
  );
};

// == styles =======================================================================================
const SVGRoot = styled.svg`
  width: 100%;
  height: 100%;
`;

const Body = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: calc( 100% - 4px );
`;

const Root = styled.div`
`;

// == component ====================================================================================
interface DopeSheetOverlayProps {
  className?: string;
}

const DopeSheetOverlay = ( props: DopeSheetOverlayProps ): JSX.Element => {
  const { className } = props;
  const refBody = useRef<HTMLDivElement>( null );
  const rect = useRect( refBody );

  return (
    <Root className={ className }>
      <Body ref={ refBody }>
        <SVGRoot>
          <Line
            size={ rect }
          />
        </SVGRoot>
      </Body>
    </Root>
  );
};

export { DopeSheetOverlay };
