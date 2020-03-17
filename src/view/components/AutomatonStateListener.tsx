import React, { useEffect } from 'react';
import { AutomatonWithGUI } from '../../AutomatonWithGUI';
import { ParamWithGUI } from '../../ParamWithGUI';
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
  const dispatch = useDispatch();
  const automaton = props.automaton;

  function createParam( name: string, param: ParamWithGUI ): void {
    dispatch( {
      type: 'Automaton/CreateParam',
      param: name
    } );

    param.nodes.forEach( ( node ) => {
      dispatch( {
        type: 'Automaton/UpdateParamNode',
        param: name,
        id: node.$id,
        node
      } );
    } );

    param.fxs.forEach( ( fx ) => {
      dispatch( {
        type: 'Automaton/UpdateParamFx',
        param: name,
        id: fx.$id,
        fx
      } );
    } );

    param.on( 'createNode', ( { id, node } ) => {
      dispatch( {
        type: 'Automaton/UpdateParamNode',
        param: name,
        id,
        node
      } );
    } );

    param.on( 'updateNode', ( { id, node } ) => {
      dispatch( {
        type: 'Automaton/UpdateParamNode',
        param: name,
        id,
        node
      } );
    } );

    param.on( 'removeNode', ( { id } ) => {
      dispatch( {
        type: 'CurveEditor/SelectItemsSub',
        nodes: [ id ]
      } );
      dispatch( {
        type: 'Automaton/RemoveParamNode',
        param: name,
        id
      } );
    } );

    param.on( 'createFx', ( { id, fx } ) => {
      dispatch( {
        type: 'Automaton/UpdateParamFx',
        param: name,
        id,
        fx
      } );
    } );

    param.on( 'updateFx', ( { id, fx } ) => {
      dispatch( {
        type: 'Automaton/UpdateParamFx',
        param: name,
        id,
        fx
      } );
    } );

    param.on( 'removeFx', ( { id } ) => {
      dispatch( {
        type: 'CurveEditor/SelectItemsSub',
        fxs: [ id ]
      } );
      dispatch( {
        type: 'Automaton/RemoveParamFx',
        param: name,
        id
      } );
    } );

    // param.on( 'precalc', () => {
    //   context.dispatch( {
    //     type: 'Automaton/UpdateParam',
    //     name: name,
    //     serializedParam: param.serialize()
    //   } );
    // } );
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

      Object.entries( automaton.params ).forEach( ( [ name, param ] ) => {
        createParam( name, param );
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

      automaton.on( 'createParam', ( event ) => {
        createParam( event.name, event.param );
      } );
    },
    [ automaton ]
  );

  return (
    <Root />
  );
};
