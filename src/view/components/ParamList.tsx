import React, { useMemo } from 'react';
import { Colors } from '../constants/Colors';
import { ParamListEntry } from './ParamListEntry';
import { Scrollable } from './Scrollable';
import { State } from '../states/store';
import styled from 'styled-components';
import { useSelector } from 'react-redux';

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
  const automaton = useSelector( ( state: State ) => state.automaton.instance );
  const params = useSelector( ( state: State ) => state.automaton.params );

  const arrayOfParams = useMemo(
    () => Object.keys( params ),
    [ params ]
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
