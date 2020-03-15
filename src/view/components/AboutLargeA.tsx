import React, { useContext } from 'react';
import { Colors } from '../constants/Colors';
import { Contexts } from '../contexts/Context';
import { Icons } from '../icons/Icons';
import styled from 'styled-components';

// == styles =======================================================================================
const LargeA = styled( Icons.AutomatonA )`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  fill: ${ Colors.black };
  opacity: 0.02;
  mix-blend-mode: darken;
`;

const Root = styled.div`
`;

// == element ======================================================================================
export interface AboutLargeAProps {
  className?: string;
}

export const AboutLargeA = ( { className }: AboutLargeAProps ): JSX.Element => {
  const { state } = useContext( Contexts.Store );
  const automaton = state.automaton.instance;
  const { selectedParam } = state.curveEditor;
  const param = automaton && selectedParam && automaton.getParam( selectedParam )!;
  const values: number[] = [];

  for ( let i = 0; i < 10; i ++ ) {
    const t = automaton ? ( automaton.time - i * 0.00166 ) : 0.0;
    values[ i ] = param ? ( 360.0 * param.getValue( t ) ) : 0.0;
  }

  return <Root className={ className }>
    { values.map( ( value, i ) => (
      <LargeA
        key={ i }
        style={ {
          transform: `rotate(${ value }deg)`
        } }
      />
    ) ) }
  </Root>;
};
