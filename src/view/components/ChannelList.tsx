import React, { useMemo } from 'react';
import { ChannelListEntry } from './ChannelListEntry';
import styled from 'styled-components';
import { useSelector } from '../states/store';

// == styles =======================================================================================
const StyledChannelListEntry = styled( ChannelListEntry )`
  width: 100%;
  margin: 0.125rem 0;
  cursor: pointer;
`;

const Root = styled.div`
`;

// == element ======================================================================================
export interface ChannelListProps {
  className?: string;
}

const ChannelList = ( { className }: ChannelListProps ): JSX.Element => {
  const { channelNames } = useSelector( ( state ) => ( {
    channelNames: state.automaton.channelNames
  } ) );

  const sortedChannelNames = useMemo(
    () => Array.from( channelNames ).sort(),
    [ channelNames ]
  );

  return (
    <Root className={ className }>
      { sortedChannelNames.map( ( channel ) => (
        <StyledChannelListEntry
          key={ channel }
          name={ channel }
        />
      ) ) }
    </Root>
  );
};

export { ChannelList };
