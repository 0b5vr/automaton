import React, { useContext } from 'react';
import { Anchor } from './Anchor';
import { Colors } from '../constants/Colors';
import { Contexts } from '../contexts/Context';
import { Icons } from '../icons/Icons';
import styled from 'styled-components';

// == styles =======================================================================================
const LogoAndVersion = styled.div`
  margin-bottom: 0.2rem;
`;

const Logo = styled.img`
  fill: ${ Colors.fore };
  width: 15rem;
`;

const Version = styled.span`
  margin-left: 0.75rem;
`;

const Description = styled.div`
  margin-bottom: 0.5rem;
`;

const Hr = styled.div`
  margin-bottom: 0.5rem;
  height: 0.0625rem;
  background: ${ Colors.fore };
`;

const LargeA = styled( Icons.AutomatonA )`
  position: absolute;
  right: -0.5rem;
  bottom: -0.5rem;
  width: 11rem;
  fill: ${ Colors.black };
  opacity: 0.02;
  mix-blend-mode: darken;
`;

const Close = styled( Icons.Close )`
  position: absolute;
  right: 0.4rem;
  top: 0.4rem;
  width: 0.8rem;
  fill: ${ Colors.fore };
  cursor: pointer;

  &:hover {
    opacity: 0.7;
  }
`;

const SubRoot = styled.div`
  position: relative;
  width: calc( 100% - 2rem );
  padding: 0.75rem 1rem;

  a {
    color: ${ Colors.accent };
    text-decoration: none;

    &:hover {
      color: ${ Colors.accentdark };
    }
  }
`;

const Container = styled.div`
  position: absolute;
  left: calc( 50% - 15rem );
  top: 1rem;
  width: 30rem;
  overflow: hidden;
  border-radius: 0.25rem;
  background: ${ Colors.back3 };
  filter: drop-shadow( 0 0 2px ${ Colors.black } );
  font-size: 0.8rem;
`;

const OverlayBG = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: ${ Colors.black };
  opacity: 0.6;
`;

const Root = styled.div`
`;

// == element ======================================================================================
export interface AboutProps {
  className?: string;
}

export const About = ( { className }: AboutProps ): JSX.Element => {
  const contexts = useContext( Contexts.Store );
  const automaton = contexts.state.automaton.instance;
  const { selectedParam } = contexts.state.curveEditor;
  const param = automaton && selectedParam && automaton.getParam( selectedParam )!;
  const values: number[] = [];

  for ( let i = 0; i < 10; i ++ ) {
    const t = automaton ? ( automaton.time - i * 0.00166 ) : 0.0;
    values[ i ] = param ? ( 360.0 * param.getValue( t ) ) : 0.0;
  }

  return <Root className={ className }>
    <OverlayBG
      onClick={ () => contexts.dispatch( { type: 'About/Close' } ) }
    />
    <Container>
      { values.map( ( value, i ) => (
        <LargeA
          key={ i }
          style={ {
            transform: `rotate(${ value }deg)`
          } }
        />
      ) ) }
      <SubRoot>
        <LogoAndVersion>
          <Logo as={ Icons.Automaton } />
          <Version>{
            contexts.state.automaton.instance && contexts.state.automaton.instance.version
          }</Version>
        </LogoAndVersion>
        <Description>Animation engine for creative coding</Description>
        <Hr />
        Author: <Anchor href="https://github.com/FMS-Cat">FMS_Cat</Anchor><br />
        Repository: <Anchor href="https://github.com/FMS-Cat/automaton/">https://github.com/fms-cat/automaton/</Anchor><br />
        Automaton is distributed under permissive <Anchor href="https://opensource.org/licenses/MIT">MIT License</Anchor><br />
        Shoutouts to <Anchor href="https://www.image-line.com/flstudio/">Image Line Software</Anchor> &lt;3
      </SubRoot>
      <Close onClick={
        () => contexts.dispatch( { type: 'About/Close' } )
      } />
    </Container>
  </Root>;
};
