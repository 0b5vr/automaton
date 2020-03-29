import React, { useMemo } from 'react';
import { ChannelListEntry } from './ChannelListEntry';
import { Colors } from '../constants/Colors';
import { Scrollable } from './Scrollable';
import { State } from '../states/store';
import styled from 'styled-components';
import { useSelector } from 'react-redux';

// == styles =======================================================================================
const StyledChannelListEntry = styled( ChannelListEntry )`
  width: calc( 100% - 0.25rem );
  margin: 0.125rem;
  cursor: pointer;
`;

const Root = styled( Scrollable )`
  background: ${ Colors.back2 };
`;

// == element ======================================================================================
export interface ChannelListProps {
  className?: string;
}

export const ChannelList = ( { className }: ChannelListProps ): JSX.Element => {
  const { channels } = useSelector( ( state: State ) => ( {
    channels: state.automaton.channels
  } ) );

  const arrayOfChannels = useMemo(
    () => Object.keys( channels ),
    [ channels ]
  );

  return (
    <Root className={ className } barPosition='left'>
      { arrayOfChannels.map( ( channel ) => (
        <StyledChannelListEntry
          key={ channel }
          name={ channel }
        />
      ) ) }
    </Root>
  );
};
