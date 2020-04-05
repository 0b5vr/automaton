import React, { useCallback } from 'react';
import { useDispatch, useSelector } from '../states/store';
import { ChannelStatusLevel } from '../../ChannelWithGUI';
import { Colors } from '../constants/Colors';
import { Icons } from '../icons/Icons';
import { duplicateName } from '../utils/duplicateName';
import styled from 'styled-components';

// == microcomponent ===============================================================================
const Value = ( { className, name }: {
  className?: string;
  name: string;
} ): JSX.Element => {
  const { value } = useSelector( ( state ) => ( {
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
  const dispatch = useDispatch();
  const { automaton, selectedChannel, status } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
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

  const duplicateChannel = useCallback(
    () => {
      if ( !automaton ) { return; }

      const dupName = duplicateName( name, new Set( Object.keys( automaton.channels ) ) );
      const data = automaton.getChannel( name )!.serialize();

      const undo = (): void => {
        automaton.removeChannel( dupName );
      };

      const redo = (): void => {
        automaton.createChannel( dupName, data );
      };

      dispatch( {
        type: 'History/Push',
        entry: {
          description: `Duplicate Channel: ${ dupName }`,
          redo,
          undo
        }
      } );
      redo();
    },
    [ automaton, name ]
  );

  const removeChannel = useCallback(
    () => {
      if ( !automaton ) { return; }

      const data = automaton.getChannel( name )!.serialize();

      const undo = (): void => {
        automaton.createChannel( name, data );
      };

      const redo = (): void => {
        automaton.removeChannel( name );
      };

      dispatch( {
        type: 'History/Push',
        entry: {
          description: `Remove Channel: ${ name }`,
          redo,
          undo
        }
      } );
      redo();
    },
    [ automaton, name ]
  );

  const handleContextMenu = useCallback(
    ( event: React.MouseEvent ): void => {
      event.preventDefault();
      event.stopPropagation();

      dispatch( {
        type: 'ContextMenu/Open',
        position: { x: event.clientX, y: event.clientY },
        commands: [
          {
            name: 'Duplicate',
            description: 'Duplicate the channel.',
            command: () => duplicateChannel()
          },
          {
            name: 'Remove',
            description: 'Remove the channel.',
            command: () => removeChannel()
          }
        ]
      } );
    },
    [ duplicateChannel, removeChannel ]
  );

  return (
    <Root
      className={ className }
      onClick={ handleClick }
      onContextMenu={ handleContextMenu }
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
