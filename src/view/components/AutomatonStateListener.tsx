import React, { useContext, useEffect } from 'react';
import { AutomatonWithGUI } from '../../AutomatonWithGUI';
import { Contexts } from '../contexts/Context';
import { ParamWithGUI } from '../../ParamWithGUI';
import styled from 'styled-components';

// == styles =======================================================================================
const Root = styled.div`
  display: none;
`;

// == element ======================================================================================
export interface AutomatonStateListenerProps {
  automaton: AutomatonWithGUI;
}

export const AutomatonStateListener = ( props: AutomatonStateListenerProps ): JSX.Element => {
  const contexts = useContext( Contexts.Store );
  const automaton = props.automaton;

  function createParam( name: string, param: ParamWithGUI ): void {
    contexts.dispatch( {
      type: 'Automaton/CreateParam',
      param: name
    } );

    param.nodes.forEach( ( node ) => {
      contexts.dispatch( {
        type: 'Automaton/UpdateParamNode',
        param: name,
        id: node.$id,
        node
      } );
    } );

    param.fxs.forEach( ( fx ) => {
      contexts.dispatch( {
        type: 'Automaton/UpdateParamFx',
        param: name,
        id: fx.$id,
        fx
      } );
    } );

    param.on( 'createNode', ( { id, node } ) => {
      contexts.dispatch( {
        type: 'Automaton/UpdateParamNode',
        param: name,
        id,
        node
      } );
    } );

    param.on( 'updateNode', ( { id, node } ) => {
      contexts.dispatch( {
        type: 'Automaton/UpdateParamNode',
        param: name,
        id,
        node
      } );
    } );

    param.on( 'removeNode', ( { id } ) => {
      contexts.dispatch( {
        type: 'CurveEditor/SelectItemsSub',
        nodes: [ id ]
      } );
      contexts.dispatch( {
        type: 'Automaton/RemoveParamNode',
        param: name,
        id
      } );
    } );

    param.on( 'createFx', ( { id, fx } ) => {
      contexts.dispatch( {
        type: 'Automaton/UpdateParamFx',
        param: name,
        id,
        fx
      } );
    } );

    param.on( 'updateFx', ( { id, fx } ) => {
      contexts.dispatch( {
        type: 'Automaton/UpdateParamFx',
        param: name,
        id,
        fx
      } );
    } );

    param.on( 'removeFx', ( { id } ) => {
      contexts.dispatch( {
        type: 'CurveEditor/SelectItemsSub',
        fxs: [ id ]
      } );
      contexts.dispatch( {
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
      contexts.dispatch( {
        type: 'Automaton/SetInstance',
        automaton
      } );

      contexts.dispatch( {
        type: 'Automaton/UpdateTime',
        time: automaton.time
      } );

      contexts.dispatch( {
        type: 'Automaton/UpdateLength',
        length: automaton.length
      } );

      contexts.dispatch( {
        type: 'Automaton/UpdateIsPlaying',
        isPlaying: automaton.isPlaying
      } );

      Object.entries( automaton.fxDefinitions ).forEach( ( [ name, fxDefinition ] ) => {
        contexts.dispatch( {
          type: 'Automaton/AddFxDefinition',
          name,
          fxDefinition
        } );
      } );

      Object.entries( automaton.params ).forEach( ( [ name, param ] ) => {
        createParam( name, param );
      } );

      automaton.on( 'update', ( { time } ) => {
        contexts.dispatch( {
          type: 'Automaton/UpdateTime',
          time
        } );
      } );

      automaton.on( 'changeLength', ( { length } ) => {
        contexts.dispatch( {
          type: 'Automaton/UpdateLength',
          length
        } );
      } );

      automaton.on( 'play', () => {
        contexts.dispatch( {
          type: 'Automaton/UpdateIsPlaying',
          isPlaying: true
        } );
      } );

      automaton.on( 'pause', () => {
        contexts.dispatch( {
          type: 'Automaton/UpdateIsPlaying',
          isPlaying: false
        } );
      } );

      automaton.on( 'addFxDefinition', ( { name, fxDefinition } ) => {
        contexts.dispatch( {
          type: 'Automaton/AddFxDefinition',
          name,
          fxDefinition
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
