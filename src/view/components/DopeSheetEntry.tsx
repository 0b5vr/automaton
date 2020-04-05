import React from 'react';
import { TimelineItem } from './TimelineItem';
import styled from 'styled-components';
import { useSelector } from '../states/store';

// == styles =======================================================================================
const SVGRoot = styled.svg`
  width: 100%;
  height: 100%;
`;

const Root = styled.div`
  display: block;
  position: relative;
  width: 100%;
  height: 20px;
  overflow: hidden;
`;

// == component ====================================================================================
interface Props {
  className?: string;
  channel: string;
  width: number;
}

const DopeSheetEntry = ( props: Props ): JSX.Element => {
  const { className, channel, width } = props;
  const { range, stateItems } = useSelector( ( state ) => ( {
    range: state.timeline.range,
    stateItems: state.automaton.channels[ channel ].items
  } ) );
  const size = {
    width,
    height: 20 // kinda chaotic, but better than using useRect for each channels
  };

  return (
    <Root className={ className }>
      <SVGRoot>
        { Object.entries( stateItems ).map( ( [ id, item ] ) => (
          <TimelineItem
            channel={ channel }
            key={ id }
            item={ item }
            range={ range }
            size={ size }
            dopeSheetMode
          />
        ) ) }
      </SVGRoot>
    </Root>
  );
};

export { DopeSheetEntry };
