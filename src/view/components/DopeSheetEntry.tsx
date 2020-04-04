import React, { useRef } from 'react';
import { State } from '../states/store';
import { TimelineItem } from './TimelineItem';
import styled from 'styled-components';
import { useRect } from '../utils/useRect';
import { useSelector } from 'react-redux';

// == styles =======================================================================================
const Root = styled.div`
  position: relative;
  height: 1.25rem;
  overflow: hidden;
`;

// == element ======================================================================================
export interface DopeSheetEntryProps {
  className?: string;
  channel: string;
}

const DopeSheetEntry = ( props: DopeSheetEntryProps ): JSX.Element => {
  const { className, channel } = props;
  const { range } = useSelector( ( state: State ) => ( {
    range: state.timeline.range,
  } ) );
  const { stateItems } = useSelector( ( state: State ) => ( {
    stateItems: state.automaton.channels[ channel ].items
  } ) );
  const refRoot = useRef<HTMLDivElement>( null );
  const size = useRect( refRoot );

  return (
    <Root
      ref={ refRoot }
      className={ className }
    >
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
    </Root>
  );
};

export { DopeSheetEntry };
