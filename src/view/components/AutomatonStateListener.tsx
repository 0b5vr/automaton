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
  const context = useContext( Contexts.Store );
  const automaton = props.automaton;

  function createParam( name: string, param: ParamWithGUI ): void {
    context.dispatch( {
      type: 'Automaton/UpdateParam',
      name: name,
      serializedParam: param.serialize()
    } );

    param.on( 'precalc', () => {
      context.dispatch( {
        type: 'Automaton/UpdateParam',
        name: name,
        serializedParam: param.serialize()
      } );
    } );
  }

  useEffect(
    () => {
      context.dispatch( {
        type: 'Automaton/SetInstance',
        automaton
      } );

      context.dispatch( {
        type: 'Automaton/UpdateTime'
      } );

      context.dispatch( {
        type: 'Automaton/UpdateLength'
      } );

      context.dispatch( {
        type: 'Automaton/UpdateIsPlaying'
      } );

      automaton.getParamNames().forEach( ( name ) => {
        createParam( name, automaton.getParam( name )! );
      } );

      automaton.on( 'update', () => {
        context.dispatch( { type: 'Automaton/UpdateTime' } );
      } );

      automaton.on( 'changeLength', () => {
        context.dispatch( { type: 'Automaton/UpdateLength' } );
      } );

      automaton.on( 'play', () => {
        context.dispatch( { type: 'Automaton/UpdateIsPlaying' } );
      } );

      automaton.on( 'pause', () => {
        context.dispatch( { type: 'Automaton/UpdateIsPlaying' } );
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
