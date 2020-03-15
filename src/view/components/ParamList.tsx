import React, { useContext, useMemo } from 'react';
import { Colors } from '../constants/Colors';
import { Contexts } from '../contexts/Context';
import { ParamListEntry } from './ParamListEntry';
import { Scrollable } from './Scrollable';
import styled from 'styled-components';

// == styles =======================================================================================
const StyledParamListEntry = styled( ParamListEntry )`
  width: calc( 100% - 0.25rem );
  margin: 0.125rem;
  cursor: pointer;
`;

const Root = styled( Scrollable )`
  background: ${ Colors.back2 };
`;

// == element ======================================================================================
export interface ParamListProps {
  className?: string;
}

export const ParamList = ( { className }: ParamListProps ): JSX.Element => {
  const contexts = useContext( Contexts.Store );
  const automaton = contexts.state.automaton.instance;

  const arrayOfParams = useMemo(
    () => Object.keys( contexts.state.automaton.params ),
    [ contexts.state.automaton.params ]
  );

  return (
    <Root className={ className } barPosition='left'>
      { arrayOfParams.map( ( param ) => (
        <StyledParamListEntry
          key={ param }
          name={ param }
          value={ automaton!.getParam( param )!.value }
          status={ automaton!.getParam( param )!.status }
        />
      ) ) }
    </Root>
  );
};
