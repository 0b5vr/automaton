import { useDispatch, useSelector } from 'react-redux';
import { ChannelStatusLevel } from '../../ChannelWithGUI';
import { Colors } from '../constants/Colors';
import { Icons } from '../icons/Icons';
import React from 'react';
import { State } from '../states/store';
import styled from 'styled-components';

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

const Value = styled.div`
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

// == element ======================================================================================
export interface ChannelListEntryProps {
  className?: string;
  name: string;
}

export const ChannelListEntry = ( props: ChannelListEntryProps ): JSX.Element => {
  const { className, name } = props;
  const dispatch = useDispatch();
  const { selectedChannel, value, status } = useSelector( ( state: State ) => ( {
    selectedChannel: state.curveEditor.selectedChannel,
    value: state.automaton.channels[ name ].value,
    status: state.automaton.channels[ name ].status
  } ) );

  function handleClick(): void {
    dispatch( {
      type: 'CurveEditor/SelectChannel',
      channel: name
    } );
  }

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
          ? <Value>{ value.toFixed( 3 ) }</Value>
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
