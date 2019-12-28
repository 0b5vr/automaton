import React, { useContext } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { About } from './About';
import { AutomatonStateListener } from './AutomatonStateListener';
import { AutomatonWithGUI } from '../../AutomatonWithGUI';
import { Colors } from '../constants/Colors';
import { Contexts } from '../contexts/Context';
import { CurveEditor } from './CurveEditor';
import { Header } from './Header';
import { Inspector } from './Inspector';
import { Metrics } from '../constants/Metrics';
import { ParamList } from './ParamList';
import { Stalker } from './Stalker';

// == styles =======================================================================================
const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css?family=Roboto:300,400,500,700,900');
`;

const StyledHeader = styled( Header )`
  position: absolute;
  top: 0;
  width: calc( 100% - 0.25rem );
  height: calc( ${ Metrics.headerHeight } - 0.25rem );
`;

const StyledParamList = styled( ParamList )`
  position: absolute;
  bottom: 0;
  width: ${ Metrics.paramListWidth };
  height: calc( 100% - ${ Metrics.headerHeight } );
`;

const StyledCurveEditor = styled( CurveEditor )`
  position: absolute;
  left: ${ Metrics.paramListWidth };
  bottom: 0;
  width: calc( 100% - ${ Metrics.paramListWidth } - ${ Metrics.inspectorWidth } );
  height: calc( 100% - ${ Metrics.headerHeight } );
`;

const StyledInspector = styled( Inspector )`
  position: absolute;
  right: 0;
  bottom: 0;
  width: ${ Metrics.inspectorWidth };
  height: calc( 100% - ${ Metrics.headerHeight } );
`;

const StyledAbout = styled( About )`
  position: absolute;
  left: calc( 50% - 15em );
  top: 1rem;
  width: 30em;
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
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  position: absolute;
  font-family: 'Roboto', sans-serif;
  font-weight: 300;
  font-size: ${ Metrics.rootFontSize };
  background: ${ Colors.black };
  color: ${ Colors.fore };
  user-select: none;
`;

// == element ======================================================================================
export interface AppProps {
  automaton: AutomatonWithGUI;
}

const Fuck = ( { automaton }: AppProps ): JSX.Element => {
  const contexts = useContext( Contexts.Store );

  return (
    <Root>
      <AutomatonStateListener automaton={ automaton } />
      <StyledHeader />
      <StyledParamList />
      <StyledCurveEditor />
      <StyledInspector />

      { contexts.state.about.isVisible && <>
        <OverlayBG
          onClick={ () => contexts.dispatch( { type: 'About/Close' } ) }
        />
        <StyledAbout />
      </> }

      <Stalker />
    </Root>
  );
};

export const App = ( props: AppProps ): JSX.Element => <>
  <GlobalStyle />
  <Contexts.Provider>
    <Fuck { ...props } />
  </Contexts.Provider>
</>;
