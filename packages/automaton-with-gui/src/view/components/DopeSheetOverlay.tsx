import { Labels } from './Labels';
import { RangeBar } from './RangeBar';
import { Resolution } from '../utils/Resolution';
import { TimeLoopRegion } from './TimeLoopRegion';
import { TimeRange } from '../utils/TimeValueRange';
import { TimeValueLines } from './TimeValueLines';
import { useRect } from '../utils/useRect';
import { useSelector } from '../states/store';
import React, { useMemo, useRef } from 'react';
import styled from 'styled-components';

// == microcomponent ===============================================================================
const Line = ( { range, size }: {
  range: TimeRange;
  size: Resolution;
} ): JSX.Element => {
  const { time } = useSelector( ( state ) => ( {
    time: state.automaton.time
  } ) );

  const timeValueRange = useMemo(
    () => ( {
      t0: range.t0,
      t1: range.t1,
      v0: 0.0,
      v1: 1.0,
    } ),
    [ range.t0, range.t1 ]
  );

  return (
    <TimeValueLines
      range={ timeValueRange }
      size={ size }
      time={ time }
      isAbsolute
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
  const { range, automatonLength } = useSelector( ( state ) => ( {
    range: state.timeline.range,
    automatonLength: state.automaton.length
  } ) );

  const timeRange = useMemo(
    () => ( {
      t0: range.t0,
      t1: range.t1,
    } ),
    [ range.t0, range.t1 ]
  );

  return (
    <Root className={ className }>
      <Body ref={ refBody }>
        <SVGRoot>
          <Labels
            range={ timeRange }
            size={ rect }
          />
          <TimeLoopRegion
            range={ timeRange }
            size={ rect }
          />
          <Line
            range={ timeRange }
            size={ rect }
          />
        </SVGRoot>
      </Body>
      <StyledRangeBar
        range={ timeRange }
        width={ rect.width }
        length={ automatonLength }
      />
    </Root>
  );
};

export { DopeSheetOverlay };
