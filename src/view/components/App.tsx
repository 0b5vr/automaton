import { store, useSelector } from '../states/store';
import { About } from './About';
import { AutomatonStateListener } from './AutomatonStateListener';
import { AutomatonWithGUI } from '../../AutomatonWithGUI';
import { ChannelEditor } from './ChannelEditor';
import { ChannelListAndDopeSheet } from './ChannelListAndDopeSheet';
import { Colors } from '../constants/Colors';
import { ContextMenu } from './ContextMenu';
import { CurveEditor } from './CurveEditor';
import { CurveList } from './CurveList';
import { FxSpawner } from './FxSpawner';
import { GUIRemocon } from '../../GUIRemocon';
import { GUIRemoconListener } from './GUIRemoconListener';
import { Header } from './Header';
import { Inspector } from './Inspector';
import { Metrics } from '../constants/Metrics';
import { Provider } from 'react-redux';
import React from 'react';
import { Stalker } from './Stalker';
import styled from 'styled-components';

// == styles =======================================================================================
const StyledHeader = styled( Header )`
  position: absolute;
  top: 0;
  width: 100%;
  height: ${ Metrics.headerHeight };
`;

const StyledChannelEditor = styled( ChannelEditor )`
  position: absolute;
  left: ${ Metrics.channelListWidth }px;
  top: ${ Metrics.headerHeight };
  width: calc( 100% - ${ Metrics.channelListWidth }px - ${ Metrics.inspectorWidth } );
  height: calc( 100% - ${ Metrics.headerHeight } );
`;

const StyledChannelListAndDopeSheet = styled( ChannelListAndDopeSheet )`
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
  * {
    box-sizing: border-box;
  }

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
interface AppProps {
  className?: string;
  automaton: AutomatonWithGUI;
  guiRemocon: GUIRemocon;
}

const Fuck = ( { className, automaton, guiRemocon }: AppProps ): JSX.Element => {
  const {
    isFxSpawnerVisible,
    isAboutVisible,
    isContextMenuVisible,
    selectedChannel,
    selectedCurve
  } = useSelector( ( state ) => ( {
    isFxSpawnerVisible: state.fxSpawner.isVisible,
    isAboutVisible: state.about.isVisible,
    isContextMenuVisible: state.contextMenu.isVisible,
    selectedChannel: state.timeline.selectedChannel,
    selectedCurve: state.curveEditor.selectedCurve
  } ) );

  const realm: 'dopeSheet' | 'timeline' | 'curveEditor' = (
    selectedCurve != null ? 'curveEditor' :
    selectedChannel != null ? 'timeline' :
    'dopeSheet'
  );

  return (
    <Root className={ className }>
      <AutomatonStateListener automaton={ automaton } />
      <GUIRemoconListener guiRemocon={ guiRemocon } />
      <StyledHeader />
      <StyledChannelListAndDopeSheet />
      { realm === 'timeline' && <StyledChannelEditor /> }
      { realm === 'curveEditor' && <>
        <StyledCurveList />
        <StyledCurveEditor />
      </> }
      <StyledInspector />
      { isFxSpawnerVisible && <StyledFxSpawner /> }
      { isAboutVisible && <StyledAbout /> }
      { isContextMenuVisible && <ContextMenu /> }

      <Stalker />
    </Root>
  );
};

const App = ( props: AppProps ): JSX.Element => <>
  <Provider store={ store }>
    <Fuck { ...props } />
  </Provider>
</>;

export { App };
