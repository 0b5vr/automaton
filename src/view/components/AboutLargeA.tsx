import { Colors } from '../constants/Colors';
import { Icons } from '../icons/Icons';
import React from 'react';
import { State } from '../states/store';
import styled from 'styled-components';
import { useSelector } from 'react-redux';

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
  const automaton = useSelector( ( state: State ) => state.automaton.instance );
  const selectedParam = useSelector( ( state: State ) => state.curveEditor.selectedParam );
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
