import { Provider, useSelector } from 'react-redux';
import { State, store } from '../states/store';
import styled, { createGlobalStyle } from 'styled-components';
import { About } from './About';
import { AutomatonStateListener } from './AutomatonStateListener';
import { AutomatonWithGUI } from '../../AutomatonWithGUI';
import { ChannelList } from './ChannelList';
import { Colors } from '../constants/Colors';
import { ContextMenu } from './ContextMenu';
import { CurveEditor } from './CurveEditor';
import { FxSpawner } from './FxSpawner';
import { Header } from './Header';
import { Inspector } from './Inspector';
import { Metrics } from '../constants/Metrics';
import React from 'react';
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

const StyledChannelList = styled( ChannelList )`
  position: absolute;
  bottom: 0;
  width: ${ Metrics.channelListWidth };
  height: calc( 100% - ${ Metrics.headerHeight } );
`;

const StyledCurveEditor = styled( CurveEditor )`
  position: absolute;
  left: ${ Metrics.channelListWidth };
  bottom: 0;
  width: calc( 100% - ${ Metrics.channelListWidth } - ${ Metrics.inspectorWidth } );
  height: calc( 100% - ${ Metrics.headerHeight } );
`;

const StyledInspector = styled( Inspector )`
  position: absolute;
  right: 0;
  bottom: 0;
  width: ${ Metrics.inspectorWidth };
  height: calc( 100% - ${ Metrics.headerHeight } );
`;

const StyledFxSpawner = styled( FxSpawner )`
  position: absolute;
  width: 100%;
  height: 100%;
`;

const StyledAbout = styled( About )`
  position: absolute;
  width: 100%;
  height: 100%;
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
  const isFxSpawnerVisible = useSelector( ( state: State ) => state.fxSpawner.isVisible );
  const isAboutVisible = useSelector( ( state: State ) => state.about.isVisible );
  const isContextMenuVisible = useSelector( ( state: State ) => state.contextMenu.isVisible );

  return (
    <Root>
      <AutomatonStateListener automaton={ automaton } />
      <StyledHeader />
      <StyledChannelList />
      <StyledCurveEditor />
      <StyledInspector />
      { isFxSpawnerVisible && <StyledFxSpawner /> }
      { isAboutVisible && <StyledAbout /> }
      { isContextMenuVisible && <ContextMenu /> }

      <Stalker />
    </Root>
  );
};

export const App = ( props: AppProps ): JSX.Element => <>
  <GlobalStyle />
  <Provider store={ store }>
    <Fuck { ...props } />
  </Provider>
</>;
