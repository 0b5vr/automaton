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

const AboutLargeA = ( { className }: AboutLargeAProps ): JSX.Element => {
  const {
    selectedChannel,
    automaton,
    time
  } = useSelector( ( state: State ) => ( {
    selectedChannel: state.timeline.selectedChannel,
    automaton: state.automaton.instance,
    time: state.automaton.time
  } ) );
  const channel = automaton && selectedChannel != null && automaton.getChannel( selectedChannel )!;

  const values = useMemo(
    () => new Array( 10 ).fill( 0 ).map( ( _, i ) => {
      if ( time == null ) { return 0.0; }

      const t = Math.max( time - i * 0.00166, 0.0 );
      return channel ? ( 360.0 * channel.getValue( t ) ) : 0.0;
    } ),
    [ time, channel ]
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

export { AboutLargeA };
