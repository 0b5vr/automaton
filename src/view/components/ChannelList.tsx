import { ChannelListEntry } from './ChannelListEntry';
import React from 'react';
import { State } from '../states/store';
import styled from 'styled-components';
import { useSelector } from 'react-redux';

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
  const { channelNames } = useSelector( ( state: State ) => ( {
    channelNames: Array.from( state.automaton.channelNames ).sort()
  } ) );

  return (
    <Root className={ className }>
      { channelNames.map( ( channel ) => (
        <StyledChannelListEntry
          key={ channel }
          name={ channel }
        />
      ) ) }
    </Root>
  );
};

export { ChannelList };
