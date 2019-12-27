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
        type: 'Automaton/UpdateTime'
      } );

      contexts.dispatch( {
        type: 'Automaton/UpdateLength'
      } );

      contexts.dispatch( {
        type: 'Automaton/UpdateIsPlaying'
      } );

      automaton.getParamNames().forEach( ( name ) => {
        createParam( name, automaton.getParam( name )! );
      } );

      automaton.on( 'update', () => {
        contexts.dispatch( { type: 'Automaton/UpdateTime' } );
      } );

      automaton.on( 'changeLength', () => {
        contexts.dispatch( { type: 'Automaton/UpdateLength' } );
      } );

      automaton.on( 'play', () => {
        contexts.dispatch( { type: 'Automaton/UpdateIsPlaying' } );
      } );

      automaton.on( 'pause', () => {
        contexts.dispatch( { type: 'Automaton/UpdateIsPlaying' } );
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
