import React, { useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from '../states/store';
import { Colors } from '../constants/Colors';
import { StatusIcon } from './StatusIcon';
import { duplicateName } from '../utils/duplicateName';
import styled from 'styled-components';
import { useRect } from '../utils/useRect';

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
  left: 2px;
  bottom: 2px;
  font-size: 14px;
  line-height: 1.0;
  transform-origin: bottom left;
`;

const StyledValue = styled( Value )`
  position: absolute;
  right: 2px;
  bottom: 2px;
  font-size: 9px;
  line-height: 1.0;
  opacity: 0.7;
`;

const Root = styled.div<{ isSelected: boolean }>`
  position: relative;
  height: 18px;
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

  const refRoot = useRef<HTMLDivElement>( null );
  const rectRoot = useRect( refRoot );
  const refText = useRef<HTMLDivElement>( null );
  const rectText = useRect( refText );

  const scale = useMemo(
    () => {
      if ( rectRoot.width !== 0 && rectText.width !== 0 ) {
        return Math.min( 1.0, ( rectRoot.width - 32 ) / rectText.width );
      } else {
        return 1.0;
      }
    },
    [ rectRoot, rectText ]
  );

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
            name: 'Edit Channel',
            description: 'Edit the channel.',
            callback: () => editChannel()
          },
          {
            name: 'Rename Channel',
            description: 'Rename the channel.',
            callback: () => renameChannel( x, y )
          },
          {
            name: 'Duplicate Channel',
            description: 'Duplicate the channel.',
            callback: () => duplicateChannel()
          },
          {
            name: 'Remove Channel',
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
      ref={ refRoot }
      className={ className }
      onClick={ handleClick }
      onContextMenu={ handleContextMenu }
      isSelected={ selectedChannel === name }
      data-stalker={ name }
    >
      <Name
        ref={ refText }
        style={ {
          transform: `scaleX(${ scale })`
        } }
      >
        { name }
      </Name>
      {
        status != null
          ? <StatusIcon status={ status } />
          : <StyledValue name={ name } />
      }
    </Root>
  );
};

export { ChannelListEntry };
