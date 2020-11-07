import { AboutLargeA } from './AboutLargeA';
import { Anchor } from './Anchor';
import { Colors } from '../constants/Colors';
import { Icons } from '../icons/Icons';
import { useDispatch, useSelector } from '../states/store';
import React from 'react';
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

const StyledLargeA = styled( AboutLargeA )`
  position: absolute;
  right: -0.5rem;
  bottom: -0.5rem;
  width: 11rem;
  height: 11rem;
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

const About = ( { className }: AboutProps ): JSX.Element => {
  const dispatch = useDispatch();
  const version = useSelector( ( state ) => state.automaton.instance?.version );

  return <Root className={ className }>
    <OverlayBG
      onClick={ () => dispatch( { type: 'About/Close' } ) }
    />
    <Container>
      <StyledLargeA />
      <SubRoot>
        <LogoAndVersion>
          <Logo as={ Icons.Automaton } />
          <Version>{ version }</Version>
        </LogoAndVersion>
        <Description>Animation engine for creative coding</Description>
        <Hr />
        Author: <Anchor href="https://github.com/FMS-Cat">FMS_Cat</Anchor><br />
        Repository: <Anchor href="https://github.com/FMS-Cat/automaton/">https://github.com/fms-cat/automaton/</Anchor><br />
        Automaton is distributed under permissive <Anchor href="https://opensource.org/licenses/MIT">MIT License</Anchor><br />
        Shoutouts to <Anchor href="https://www.image-line.com/flstudio/">Image Line Software</Anchor> &lt;3
      </SubRoot>
      <Close onClick={
        () => dispatch( { type: 'About/Close' } )
      } />
    </Container>
  </Root>;
};

export { About };
