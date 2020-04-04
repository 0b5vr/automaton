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
import { CurveList } from './CurveList';
import { DopeSheet } from './DopeSheet';
import { DopeSheetOverlay } from './DopeSheetOverlay';
import { DopeSheetUnderlay } from './DopeSheetUnderlay';
import { FxSpawner } from './FxSpawner';
import { Header } from './Header';
import { Inspector } from './Inspector';
import { Metrics } from '../constants/Metrics';
import React from 'react';
import { Scrollable } from './Scrollable';
import { Stalker } from './Stalker';
import { Timeline } from './Timeline';

// == styles =======================================================================================
const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css?family=Roboto:300,400,500,700,900');

  * {
    box-sizing: border-box;
  }
`;

const StyledHeader = styled( Header )`
  position: absolute;
  top: 0;
  width: 100%;
  height: ${ Metrics.headerHeight };
`;

const StyledChannelList = styled( ChannelList )`
  width: ${ Metrics.channelListWidth - 4 }px;
  margin: 0 2px;
`;

const StyledDopeSheetUnderlay = styled( DopeSheetUnderlay )`
  position: absolute;
  width: calc( 100% - ${ Metrics.channelListWidth }px - ${ Metrics.inspectorWidth } );
  height: calc( 100% - ${ Metrics.headerHeight } );
  left: ${ Metrics.channelListWidth }px;
  top: ${ Metrics.headerHeight };
`;

const StyledDopeSheetOverlay = styled( DopeSheetOverlay )`
  position: absolute;
  width: calc( 100% - ${ Metrics.channelListWidth }px - ${ Metrics.inspectorWidth } );
  height: calc( 100% - ${ Metrics.headerHeight } );
  left: ${ Metrics.channelListWidth }px;
  top: ${ Metrics.headerHeight };
  pointer-events: none;
`;

const StyledDopeSheet = styled( DopeSheet )`
  width: calc( 100% - ${ Metrics.channelListWidth }px );
  flex-grow: 1;
`;

const StyledTimeline = styled( Timeline )`
  position: absolute;
  left: ${ Metrics.channelListWidth }px;
  top: ${ Metrics.headerHeight };
  width: calc( 100% - ${ Metrics.channelListWidth }px - ${ Metrics.inspectorWidth } );
  height: calc( 100% - ${ Metrics.headerHeight } );
`;

const ChannelListAndDopeSheetContainer = styled.div`
  display: flex;
`;

const ChannelListAndDopeSheetScrollable = styled( Scrollable )`
  position: absolute;
  left: 0;
  top: ${ Metrics.headerHeight };
  width: calc( 100% - ${ Metrics.inspectorWidth } );
  height: calc( 100% - ${ Metrics.headerHeight } );
`;

const StyledCurveList = styled( CurveList )`
  position: absolute;
  bottom: 0;
  width: ${ Metrics.curveListWidth }px;
  height: calc( 100% - ${ Metrics.headerHeight } );
`;

const StyledCurveEditor = styled( CurveEditor )`
  position: absolute;
  left: ${ Metrics.curveListWidth }px;
  bottom: 0;
  width: calc( 100% - ${ Metrics.curveListWidth }px - ${ Metrics.inspectorWidth } );
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
  background: ${ Colors.back2 };
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
      <StyledDopeSheetUnderlay />
      <ChannelListAndDopeSheetScrollable barPosition='left'>
        <ChannelListAndDopeSheetContainer>
          <StyledChannelList />
          <StyledDopeSheet />
        </ChannelListAndDopeSheetContainer>
      </ChannelListAndDopeSheetScrollable>
      <StyledDopeSheetOverlay />
      <StyledTimeline />
      {/* <StyledCurveEditor /> */}
      <StyledInspector />
      { isFxSpawnerVisible && <StyledFxSpawner /> }
      { isAboutVisible && <StyledAbout /> }
      { isContextMenuVisible && <ContextMenu /> }

      <Stalker />
    </Root>
  );
};

const App = ( props: AppProps ): JSX.Element => <>
  <GlobalStyle />
  <Provider store={ store }>
    <Fuck { ...props } />
  </Provider>
</>;

export { App };
