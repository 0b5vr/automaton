import React, { useContext, useEffect, useMemo } from 'react';
import { AutomatonWithGUIEvent } from '../../AutomatonWithGUI';
import { Colors } from '../style-constants/Colors';
import { Context } from '../contexts/Context';
import { ParamEntry } from './ParamEntry';
import { ParamListActionType } from '../contexts/ParamList';
import styled from 'styled-components';

// == styles =======================================================================================
const StyledParamEntry = styled( ParamEntry )`
  width: calc( 100% - 0.25rem );
  margin: 0.125rem;
  cursor: pointer;
`;

const Root = styled.div`
  background: ${ Colors.back2 };
`;

// == element ======================================================================================
export interface ParamListProps {
  className?: string;
}

export const ParamList = ( { className }: ParamListProps ): JSX.Element => {
  const context = useContext( Context.Store );
  const automaton = context.state.automaton.instance;

  useEffect(
    () => {
      if ( !automaton ) { return; }
      context.dispatch( {
        type: ParamListActionType.SetParams,
        params: automaton.getParamNames()
      } );

      function handleCreateParam( { name }: any ): void {
        context.dispatch( { type: ParamListActionType.AddParam, param: name } );
      }
      function handleRemoveParam( { name }: any ): void {
        context.dispatch( { type: ParamListActionType.DeleteParam, param: name } );
      }

      automaton.on( AutomatonWithGUIEvent.CreateParam, handleCreateParam );
      automaton.on( AutomatonWithGUIEvent.RemoveParam, handleRemoveParam );
      return () => {
        automaton.off( AutomatonWithGUIEvent.CreateParam, handleCreateParam );
        automaton.off( AutomatonWithGUIEvent.RemoveParam, handleRemoveParam );
      };
    },
    [ automaton ]
  );

  const arrayOfParams = useMemo(
    () => Object.keys( context.state.paramList.params ),
    [ context.state.paramList.params ]
  );

  return (
    <Root className={ className }>
      { arrayOfParams.map( ( param ) => (
        <StyledParamEntry
          key={ param }
          name={ param }
          value={ automaton!.getParam( param )!.getValue() }
          status={ automaton!.getParam( param )!.status }
        />
      ) ) }
    </Root>
  );
};
