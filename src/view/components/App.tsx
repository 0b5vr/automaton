import { About } from './About';
import { Action, State, useSelector } from '../states/store';
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
import { ModeSelector } from './ModeSelector';
import { Provider } from 'react-redux';
import { Stalker } from './Stalker';
import { Store } from 'redux';
import { TextPrompt } from './TextPrompt';
import { Toasty } from './Toasty';
import React, { useCallback } from 'react';
import styled from 'styled-components';

// == styles =======================================================================================
const StyledHeader = styled( Header )`
  position: absolute;
  top: 0;
  width: 100%;
  height: ${ Metrics.headerHeight }px;
`;

const StyledModeSelector = styled( ModeSelector )`
  position: absolute;
  left: 0;
  top: ${ Metrics.headerHeight }px;
  width: ${ Metrics.modeSelectorWidth }px;
  height: calc( 100% - ${ Metrics.headerHeight }px );
`;

const StyledChannelEditor = styled( ChannelEditor )`
  position: absolute;
  left: ${ Metrics.modeSelectorWidth + Metrics.channelListWidth }px;
  top: ${ Metrics.headerHeight }px;
  width: calc( 100% - ${ Metrics.modeSelectorWidth + Metrics.channelListWidth + Metrics.inspectorWidth }px );
  height: calc( 100% - ${ Metrics.headerHeight }px );
`;

const StyledChannelListAndDopeSheet = styled( ChannelListAndDopeSheet )`
  position: absolute;
  left: ${ Metrics.modeSelectorWidth }px;
  top: ${ Metrics.headerHeight }px;
  width: calc( 100% - ${ Metrics.modeSelectorWidth + Metrics.inspectorWidth }px );
  height: calc( 100% - ${ Metrics.headerHeight }px );
`;

const StyledCurveList = styled( CurveList )`
  position: absolute;
  left: ${ Metrics.modeSelectorWidth }px;
  bottom: 0;
  width: ${ Metrics.curveListWidth }px;
  height: calc( 100% - ${ Metrics.headerHeight }px );
`;

const StyledCurveEditor = styled( CurveEditor )`
  position: absolute;
  left: ${ Metrics.modeSelectorWidth + Metrics.curveListWidth }px;
  bottom: 0;
  width: calc( 100% - ${ Metrics.modeSelectorWidth + Metrics.curveListWidth + Metrics.inspectorWidth }px );
  height: calc( 100% - ${ Metrics.headerHeight }px );
`;

const StyledInspector = styled( Inspector )`
  position: absolute;
  right: 0;
  bottom: 0;
  width: ${ Metrics.inspectorWidth }px;
  height: calc( 100% - ${ Metrics.headerHeight }px );
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
  font-size: ${ Metrics.rootFontSize }px;
  background: ${ Colors.back2 };
  color: ${ Colors.fore };
  user-select: none;
`;

// == element ======================================================================================
interface AppProps {
  className?: string;
  store: Store<State, Action>;
  automaton: AutomatonWithGUI;
  guiRemocon: GUIRemocon;
}

const Fuck = ( { className, automaton, guiRemocon }: AppProps ): JSX.Element => {
  const {
    isFxSpawnerVisible,
    isAboutVisible,
    isContextMenuVisible,
    isTextPromptVisible,
    mode
  } = useSelector( ( state ) => ( {
    isFxSpawnerVisible: state.fxSpawner.isVisible,
    isAboutVisible: state.about.isVisible,
    isContextMenuVisible: state.contextMenu.isVisible,
    isTextPromptVisible: state.textPrompt.isVisible,
    mode: state.workspace.mode
  } ) );

  const handleContextMenu = useCallback(
    ( event ) => {
      event.preventDefault();
      event.stopPropagation();
    },
    []
  );

  return (
    <Root
      className={ className }
      onContextMenu={ handleContextMenu }
    >
      <AutomatonStateListener automaton={ automaton } />
      <GUIRemoconListener guiRemocon={ guiRemocon } />
      <StyledHeader />
      <StyledModeSelector />
      <StyledChannelListAndDopeSheet />
      { mode === 'channel' && <StyledChannelEditor /> }
      { mode === 'curve' && <>
        <StyledCurveList />
        <StyledCurveEditor />
      </> }
      <StyledInspector />
      { isFxSpawnerVisible && <StyledFxSpawner /> }
      { isAboutVisible && <StyledAbout /> }
      { isContextMenuVisible && <ContextMenu /> }
      { isTextPromptVisible && <TextPrompt /> }

      <Toasty />
      <Stalker />
    </Root>
  );
};

const App = ( props: AppProps ): JSX.Element => <Provider store={ props.store }>
  <Fuck { ...props } />
</Provider>;

export { App };
