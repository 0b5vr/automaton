import React, { useContext, useEffect, useState } from 'react';
import { Colors } from '../constants/Colors';
import { Contexts } from '../contexts/Context';
import { InspectorHeader } from './InspectorHeader';
import { InspectorHr } from './InspectorHr';
import { InspectorItem } from './InspectorItem';
import { NumberParam } from './NumberParam';
import styled from 'styled-components';

// == styles =======================================================================================
const Root = styled.div`
`;

export const ConfirmNotice = styled.div`
  margin: 0.15rem;
  font-size: 0.7rem;
  line-height: 1em;
  width: calc( 100% - 0.3rem );
  text-align: center;
`;

export const ConfirmButton = styled.div`
  margin: 0.15rem auto;
  font-size: 0.8rem;
  line-height: 1.2rem;
  width: 4rem;
  text-align: center;
  background: ${ Colors.back3 };
  cursor: pointer;

  &:hover {
    background: ${ Colors.back4 };
  }

  &:active {
    background: ${ Colors.back1 };
  }
`;

// == element ======================================================================================
export interface InspectorGeneralProps {
  className?: string;
}

export const InspectorGeneral = ( { className }: InspectorGeneralProps ): JSX.Element => {
  const { state, dispatch } = useContext( Contexts.Store );
  const automaton = state.automaton.instance;
  const [ length, setLength ] = useState( 0.0 );
  const [ resolution, setResolution ] = useState( 0.0 );

  useEffect(
    () => {
      if ( state.settings.mode === 'general' ) {
        setLength( automaton?.length || 1.0 );
        setResolution( automaton?.resolution || 1.0 );
      }
    },
    [ state.settings.mode ]
  );

  return <>
    { automaton && (
      <Root className={ className }>
        <InspectorHeader text="General Config" />

        <InspectorHr />

        <InspectorItem name="Length">
          <NumberParam
            type="float"
            value={ length }
            onChange={ ( value ) => {
              setLength( Math.max( 0.0, value ) );
            } }
          />
        </InspectorItem>

        <InspectorItem name="Resolution">
          <NumberParam
            type="int"
            value={ resolution }
            onChange={ ( value ) => {
              setResolution( Math.max( 0.0, value ) );
            } }
          />
        </InspectorItem>

        <InspectorHr />

        <ConfirmNotice>This cannot be undone!</ConfirmNotice>
        <ConfirmButton
          onClick={ () => {
            automaton.setLength( length );
            automaton.setResolution( resolution );

            dispatch( {
              type: 'History/Drop'
            } );
          } }
        >
          Apply
        </ConfirmButton>
      </Root>
    ) }
  </>;
};
