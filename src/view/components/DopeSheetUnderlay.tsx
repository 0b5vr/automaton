import React, { useRef } from 'react';
import { Colors } from '../constants/Colors';
import { TimeValueGrid } from './TimeValueGrid';
import styled from 'styled-components';
import { useRect } from '../utils/useRect';
import { useSelector } from '../states/store';

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
  const { range } = useSelector( ( state ) => ( {
    range: state.timeline.range
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
      </Body>
    </Root>
  );
};

export { DopeSheetUnderlay };
