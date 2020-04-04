import { DopeSheetEntry } from './DopeSheetEntry';
import React from 'react';
import { State } from '../states/store';
import styled from 'styled-components';
import { useSelector } from 'react-redux';

// == styles =======================================================================================
const StyledDopeSheetEntry = styled( DopeSheetEntry )`
  margin: 2px 0;
`;

const Root = styled.div`
`;

// == props ========================================================================================
export interface DopeSheetProps {
  className?: string;
}

// == component ====================================================================================
const DopeSheet = ( { className }: DopeSheetProps ): JSX.Element => {
  const { channelNames } = useSelector( ( state: State ) => ( {
    channelNames: Array.from( state.automaton.channelNames ),
  } ) );

  return (
    <Root className={ className }>
      { channelNames.map( ( channel ) => (
        <StyledDopeSheetEntry
          key={ channel }
          channel={ channel }
        />
      ) ) }
    </Root>
  );
};

export { DopeSheet };
