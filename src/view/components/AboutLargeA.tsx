import React, { useMemo } from 'react';
import { Colors } from '../constants/Colors';
import { Icons } from '../icons/Icons';
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
  const { time, automaton, selectedParam } = useSelector( ( state: State ) => ( {
    time: state.automaton.time,
    automaton: state.automaton.instance,
    selectedParam: state.curveEditor.selectedParam
  } ) );
  const param = automaton && selectedParam && automaton.getParam( selectedParam )!;

  const values = useMemo(
    () => new Array( 10 ).fill( 0 ).map( ( _, i ) => {
      const t = time - i * 0.00166;
      return param ? ( 360.0 * param.getValue( t ) ) : 0.0;
    } ),
    [ time, param ]
  );

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
