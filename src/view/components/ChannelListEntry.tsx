import React, { useCallback } from 'react';
import { useDispatch, useSelector } from '../states/store';
import { Colors } from '../constants/Colors';
import { StatusIcon } from './StatusIcon';
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
  width: calc( 100% - 2rem );
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

const Root = styled.div<{ isSelected: boolean }>`
  position: relative;
  background: ${ ( { isSelected } ) => ( isSelected ? Colors.back4 : Colors.back3 ) };
  box-shadow: ${ ( { isSelected } ) => ( isSelected ? `0 0 0 1px ${ Colors.accent }` : 'none' ) };
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

      dispatch( {
        type: 'Timeline/UnselectItemsOfOtherChannels'
      } );
    },
    [ selectedChannel ]
  );

  const editChannel = useCallback(
    (): void => {
      dispatch( {
        type: 'Timeline/SelectChannel',
        channel: name
      } );

      dispatch( {
        type: 'Workspace/ChangeMode',
        mode: 'channel'
      } );
    },
    [ name ]
  );

  const renameChannel = useCallback(
    ( x: number, y: number ) => {
      if ( !automaton ) { return; }

      dispatch( {
        type: 'TextPrompt/Open',
        position: { x, y },
        defaultText: name,
        placeholder: 'New name for the channel',
        checkValid: ( newName ) => {
          if ( newName === '' ) { return 'Rename Channel: Name cannot be empty.'; }
          if ( newName === name ) { return null; }
          if ( automaton.getChannel( newName ) != null ) { return 'Rename Channel: A channel for the given name already exists.'; }
          return null;
        },
        callback: ( newName ) => {
          if ( newName === name ) { return; }

          const data = automaton.getChannel( name )!.serialize();

          automaton.removeChannel( name );
          automaton.createChannel( newName, data );

          dispatch( {
            type: 'History/Push',
            description: `Rename Channel: ${ name } -> ${ newName }`,
            commands: [
              {
                type: 'automaton/renameChannel',
                name,
                newName,
                data
              }
            ]
          } );
        }
      } );
    },
    [ automaton, name ]
  );

  const duplicateChannel = useCallback(
    () => {
      if ( !automaton ) { return; }

      const dupName = duplicateName( name, new Set( Object.keys( automaton.channels ) ) );
      const data = automaton.getChannel( name )!.serialize();

      automaton.createChannel( dupName, data );

      dispatch( {
        type: 'History/Push',
        description: `Duplicate Channel: ${ dupName }`,
        commands: [
          {
            type: 'automaton/createChannel',
            channel: dupName,
            data
          }
        ]
      } );
    },
    [ automaton, name ]
  );

  const removeChannel = useCallback(
    () => {
      if ( !automaton ) { return; }

      const data = automaton.getChannel( name )!.serialize();

      automaton.removeChannel( name );

      dispatch( {
        type: 'History/Push',
        description: `Remove Channel: ${ name }`,
        commands: [
          {
            type: 'automaton/removeChannel',
            channel: name,
            data
          }
        ]
      } );
    },
    [ automaton, name ]
  );

  const handleContextMenu = useCallback(
    ( event: React.MouseEvent ): void => {
      event.preventDefault();

      const x = event.clientX;
      const y = event.clientY;

      dispatch( {
        type: 'ContextMenu/Push',
        position: { x, y },
        commands: [
          {
            name: 'Edit',
            description: 'Edit the channel.',
            callback: () => editChannel()
          },
          {
            name: 'Rename',
            description: 'Rename the channel.',
            callback: () => renameChannel( x, y )
          },
          {
            name: 'Duplicate',
            description: 'Duplicate the channel.',
            callback: () => duplicateChannel()
          },
          {
            name: 'Remove',
            description: 'Remove the channel.',
            callback: () => removeChannel()
          }
        ]
      } );
    },
    [ renameChannel, duplicateChannel, removeChannel ]
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
        status != null
          ? <StatusIcon status={ status } />
          : <StyledValue name={ name } />
      }
    </Root>
  );
};

export { ChannelListEntry };
