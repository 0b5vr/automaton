import React, { useRef } from 'react';
import { Colors } from '../constants/Colors';
import { RangeBar } from './RangeBar';
import { State } from '../states/store';
import { TimeValueGrid } from './TimeValueGrid';
import styled from 'styled-components';
import { useRect } from '../utils/useRect';
import { useSelector } from 'react-redux';

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
  background: ${ Colors.back1 };
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
interface DopeSheetUnderlayProps {
  className?: string;
}

const DopeSheetUnderlay = ( props: DopeSheetUnderlayProps ): JSX.Element => {
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
          <TimeValueGrid
            range={ range }
            size={ rect }
            hideValue
          />
        </SVGRoot>
        <StyledRangeBar
          range={ range }
          width={ rect.width }
          length={ length }
        />
      </Body>
    </Root>
  );
};

export { DopeSheetUnderlay };
