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
  opacity: 0.2;
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

const Root = styled.div`
  overflow: hidden;
  border-radius: 0.5rem;
  background: ${ Colors.back3 };
  filter: drop-shadow( 0 0 2px ${ Colors.black } );
  font-size: 0.8rem;
`;

// == element ======================================================================================
export interface AboutProps {
  className?: string;
}

export const About = ( { className }: AboutProps ): JSX.Element => {
  const context = useContext( Contexts.Store );
  const automaton = context.state.automaton.instance;
  const { selectedParam } = context.state.curveEditor;
  const param = automaton && selectedParam && automaton.getParam( selectedParam )!;
  const value = param ? ( 360.0 * param.getValue() ) : 0.0;

  return <Root className={ className }>
    <LargeA
      style={{ transform: `rotate(${ value }deg)` }}
    />
    <SubRoot>
      <LogoAndVersion>
        <Logo as={ Icons.Automaton } />
        <Version>{
          context.state.automaton.instance && context.state.automaton.instance.version
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
      () => context.dispatch( { type: 'About/Close' } )
    } />
  </Root>;
};
