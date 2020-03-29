import React, { useEffect } from 'react';
import { Action } from '../states/store';
import { AutomatonWithGUI } from '../../AutomatonWithGUI';
import { ChannelWithGUI } from '../../ChannelWithGUI';
import { Dispatch } from 'redux';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';

// == styles =======================================================================================
const Root = styled.div`
  display: none;
`;

// == element ======================================================================================
export interface AutomatonStateListenerProps {
  automaton: AutomatonWithGUI;
}

export const AutomatonStateListener = ( props: AutomatonStateListenerProps ): JSX.Element => {
  const dispatch = useDispatch<Dispatch<Action>>();
  const automaton = props.automaton;

  function createChannel( name: string, channel: ChannelWithGUI ): void {
    dispatch( {
      type: 'Automaton/CreateChannel',
      channel: name
    } );

    dispatch( {
      type: 'Automaton/UpdateChannelValue',
      channel: name,
      value: channel.value
    } );

    dispatch( {
      type: 'Automaton/UpdateChannelStatus',
      channel: name,
      status: channel.status
    } );

    channel.nodes.forEach( ( node ) => {
      dispatch( {
        type: 'Automaton/UpdateChannelNode',
        channel: name,
        id: node.$id,
        node
      } );
    } );

    channel.fxs.forEach( ( fx ) => {
      dispatch( {
        type: 'Automaton/UpdateChannelFx',
        channel: name,
        id: fx.$id,
        fx
      } );
    } );

    channel.on( 'changeValue', () => {
      dispatch( {
        type: 'Automaton/UpdateChannelValue',
        channel: name,
        value: channel.value
      } );
    } );

    channel.on( 'updateStatus', () => {
      dispatch( {
        type: 'Automaton/UpdateChannelStatus',
        channel: name,
        status: channel.status
      } );
    } );

    channel.on( 'createNode', ( { id, node } ) => {
      dispatch( {
        type: 'Automaton/UpdateChannelNode',
        channel: name,
        id,
        node
      } );
    } );

    channel.on( 'updateNode', ( { id, node } ) => {
      dispatch( {
        type: 'Automaton/UpdateChannelNode',
        channel: name,
        id,
        node
      } );
    } );

    channel.on( 'removeNode', ( { id } ) => {
      dispatch( {
        type: 'CurveEditor/SelectItemsSub',
        nodes: [ id ]
      } );
      dispatch( {
        type: 'Automaton/RemoveChannelNode',
        channel: name,
        id
      } );
    } );

    channel.on( 'createFx', ( { id, fx } ) => {
      dispatch( {
        type: 'Automaton/UpdateChannelFx',
        channel: name,
        id,
        fx
      } );
    } );

    channel.on( 'updateFx', ( { id, fx } ) => {
      dispatch( {
        type: 'Automaton/UpdateChannelFx',
        channel: name,
        id,
        fx
      } );
    } );

    channel.on( 'removeFx', ( { id } ) => {
      dispatch( {
        type: 'CurveEditor/SelectItemsSub',
        fxs: [ id ]
      } );
      dispatch( {
        type: 'Automaton/RemoveChannelFx',
        channel: name,
        id
      } );
    } );
  }

  useEffect(
    () => {
      dispatch( {
        type: 'Automaton/SetInstance',
        automaton
      } );

      dispatch( {
        type: 'Automaton/UpdateTime',
        time: automaton.time
      } );

      dispatch( {
        type: 'Automaton/UpdateLength',
        length: automaton.length,
        resolution: automaton.resolution
      } );

      dispatch( {
        type: 'Automaton/UpdateIsPlaying',
        isPlaying: automaton.isPlaying
      } );

      Object.entries( automaton.fxDefinitions ).forEach( ( [ name, fxDefinition ] ) => {
        dispatch( {
          type: 'Automaton/AddFxDefinition',
          name,
          fxDefinition
        } );
      } );

      Object.entries( automaton.channels ).forEach( ( [ name, channel ] ) => {
        createChannel( name, channel );
      } );

      automaton.on( 'update', ( { time } ) => {
        dispatch( {
          type: 'Automaton/UpdateTime',
          time
        } );
      } );

      automaton.on( 'changeLength', ( { length, resolution } ) => {
        dispatch( {
          type: 'Automaton/UpdateLength',
          length,
          resolution
        } );
      } );

      automaton.on( 'play', () => {
        dispatch( {
          type: 'Automaton/UpdateIsPlaying',
          isPlaying: true
        } );
      } );

      automaton.on( 'pause', () => {
        dispatch( {
          type: 'Automaton/UpdateIsPlaying',
          isPlaying: false
        } );
      } );

      automaton.on( 'addFxDefinition', ( { name, fxDefinition } ) => {
        dispatch( {
          type: 'Automaton/AddFxDefinition',
          name,
          fxDefinition
        } );
      } );

      dispatch( {
        type: 'Automaton/UpdateGUISettings',
        settings: automaton.guiSettings
      } );

      automaton.on( 'updateGUISettings', ( { settings } ) => {
        dispatch( {
          type: 'Automaton/UpdateGUISettings',
          settings
        } );
      } );

      automaton.on( 'createChannel', ( event ) => {
        createChannel( event.name, event.channel );
      } );
    },
    [ automaton ]
  );

  return (
    <Root />
  );
};
