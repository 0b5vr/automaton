import { AutomatonWithGUI, AutomatonWithGUIEvent } from '../../AutomatonWithGUI';
import React, { useContext, useEffect } from 'react';
import { AutomatonActionType } from '../contexts/Automaton';
import { Context } from '../contexts/Context';
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
  const context = useContext( Context.Store );
  const automaton = props.automaton;

  useEffect(
    () => {
      context.dispatch( {
        type: AutomatonActionType.SetInstance,
        automaton
      } );

      context.dispatch( { type: AutomatonActionType.UpdateTime } );
      context.dispatch( { type: AutomatonActionType.UpdateLength } );
      context.dispatch( { type: AutomatonActionType.UpdateIsPlaying } );

      automaton.on( AutomatonWithGUIEvent.Update, () => {
        context.dispatch( { type: AutomatonActionType.UpdateTime } );
      } );

      automaton.on( AutomatonWithGUIEvent.ChangeLength, () => {
        context.dispatch( { type: AutomatonActionType.UpdateLength } );
      } );

      automaton.on( AutomatonWithGUIEvent.Play, () => {
        context.dispatch( { type: AutomatonActionType.UpdateIsPlaying } );
      } );

      automaton.on( AutomatonWithGUIEvent.Pause, () => {
        context.dispatch( { type: AutomatonActionType.UpdateIsPlaying } );
      } );
    },
    [ automaton ]
  );

  return (
    <Root />
  );
};
