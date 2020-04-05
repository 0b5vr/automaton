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
  display: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: calc( 100% - 0.25em );
`;

const Root = styled.div`
`;

// == component ====================================================================================
interface DopeSheetOverlayProps {
  className?: string;
}

const DopeSheetOverlay = ( props: DopeSheetOverlayProps ): JSX.Element => {
  const { className } = props;
  const refSvgRoot = useRef<SVGSVGElement>( null );
  const rect = useRect( refSvgRoot );

  return (
    <Root className={ className }>
      <SVGRoot ref={ refSvgRoot }>
        <Line
          size={ rect }
        />
      </SVGRoot>
    </Root>
  );
};

export { DopeSheetOverlay };
