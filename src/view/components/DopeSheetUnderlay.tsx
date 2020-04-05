import React, { useRef } from 'react';
import { Colors } from '../constants/Colors';
import { State } from '../states/store';
import { TimeValueGrid } from './TimeValueGrid';
import styled from 'styled-components';
import { useRect } from '../utils/useRect';
import { useSelector } from 'react-redux';

// == styles =======================================================================================
const SVGRoot = styled.svg`
  display: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: calc( 100% - 0.25em );
  background: ${ Colors.back1 };
`;

const Root = styled.div`
  background: ${ Colors.black };
`;

// == component ====================================================================================
interface DopeSheetUnderlayProps {
  className?: string;
}

const DopeSheetUnderlay = ( props: DopeSheetUnderlayProps ): JSX.Element => {
  const { className } = props;
  const refSvgRoot = useRef<SVGSVGElement>( null );
  const rect = useRect( refSvgRoot );
  const { range } = useSelector( ( state: State ) => ( {
    range: state.timeline.range,
  } ) );

  return (
    <Root className={ className }>
      <SVGRoot ref={ refSvgRoot }>
        <TimeValueGrid
          range={ range }
          size={ rect }
          hideValue
        />
      </SVGRoot>
    </Root>
  );
};

export { DopeSheetUnderlay };
