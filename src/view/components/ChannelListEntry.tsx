import { Action, State } from '../states/store';
import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChannelStatusLevel } from '../../ChannelWithGUI';
import { Colors } from '../constants/Colors';
import { Dispatch } from 'redux';
import { Icons } from '../icons/Icons';
import styled from 'styled-components';

// == microcomponent ===============================================================================
const Value = ( { className, name }: {
  className?: string;
  name: string;
} ): JSX.Element => {
  const { value } = useSelector( ( state: State ) => ( {
    value: state.automaton.channels[ name ].value
  } ) );

  return (
    <div className={ className }>{ value.toFixed( 3 ) }</div>
  );
};

// == styles =======================================================================================
const Name = styled.div`
  position: absolute;
  left: 0.2rem;
  top: 0;
  width: calc( 100 - 2rem );
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledValue = styled( Value )`
  position: absolute;
  right: 0.2rem;
  bottom: 0.1rem;
  font-size: 0.6rem;
  opacity: 0.7;
`;

const Icon = styled.img`
  position: absolute;
  right: 0.2rem;
  bottom: 0.1rem;
  height: calc( 100% - 0.2rem );
`;

const Root = styled.div<{ isSelected: boolean }>`
  position: relative;
  height: 1.25rem;
  background: ${ ( { isSelected } ) => ( isSelected ? Colors.back4 : Colors.back3 ) };
`;

// == component ====================================================================================
export interface ChannelListEntryProps {
  className?: string;
  name: string;
}

const ChannelListEntry = ( props: ChannelListEntryProps ): JSX.Element => {
  const { className, name } = props;
  const dispatch = useDispatch<Dispatch<Action>>();
  const { selectedChannel, status } = useSelector( ( state: State ) => ( {
    selectedChannel: state.timeline.selectedChannel,
    status: state.automaton.channels[ name ].status
  } ) );

  const handleClick = useCallback(
    () => {
      dispatch( {
        type: 'Timeline/SelectChannel',
        channel: selectedChannel === name ? null : name
      } );
    },
    [ selectedChannel ]
  );

  return (
    <Root
      className={ className }
      onClick={ handleClick }
      isSelected={ selectedChannel === name }
      data-stalker={ name }
    >
      <Name>{ name }</Name>
      {
        status === null
          ? <StyledValue name={ name } />
          : <Icon
            as={
              status.level === ChannelStatusLevel.ERROR
                ? Icons.Error
                : Icons.Warning
            }
            data-stalker={ status.message }
          />
      }
    </Root>
  );
};

export { ChannelListEntry };
