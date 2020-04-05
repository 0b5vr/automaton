import React, { useRef } from 'react';
import { RangeBar } from './RangeBar';
import { Resolution } from '../utils/Resolution';
import { State } from '../states/store';
import { TimeValueLines } from './TimeValueLines';
import { TimeValueRange } from '../utils/TimeValueRange';
import styled from 'styled-components';
import { useRect } from '../utils/useRect';
import { useSelector } from 'react-redux';

// == microcomponent ===============================================================================
const Line = ( { range, size }: {
  range: TimeValueRange;
  size: Resolution;
} ): JSX.Element => {
  const { time } = useSelector( ( state: State ) => ( {
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

const StyledRangeBar = styled( RangeBar )`
  position: absolute;
  left: 0;
  bottom: 0;
  height: 4px;
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
  const { range, length } = useSelector( ( state: State ) => ( {
    range: state.timeline.range,
    length: state.automaton.length
  } ) );

  return (
    <Root className={ className }>
      <Body ref={ refBody }>
        <SVGRoot>
          <Line
            range={ range }
            size={ rect }
          />
        </SVGRoot>
      </Body>
      <StyledRangeBar
        range={ range }
        width={ rect.width }
        length={ length }
      />
    </Root>
  );
};

export { DopeSheetOverlay };
