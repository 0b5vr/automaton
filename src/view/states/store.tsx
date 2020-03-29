import * as About from './About';
import * as Automaton from './Automaton';
import * as ContextMenu from './ContextMenu';
import * as CurveEditor from './CurveEditor';
import * as FxSpawner from './FxSpawner';
import * as Header from './Header';
import * as History from './History';
import * as Settings from './Settings';
import { combineReducers, createStore } from 'redux';

// == state ========================================================================================
export interface State {
  about: About.State;
  automaton: Automaton.State;
  contextMenu: ContextMenu.State;
  curveEditor: CurveEditor.State;
  fxSpawner: FxSpawner.State;
  header: Header.State;
  history: History.State;
  settings: Settings.State;
}

// == action =======================================================================================
export type Action = (
  About.Action |
  Automaton.Action |
  ContextMenu.Action |
  CurveEditor.Action |
  FxSpawner.Action |
  Header.Action |
  History.Action |
  Settings.Action
);

// == reducer ======================================================================================
const reducer = combineReducers<State>( {
  about: About.reducer,
  automaton: Automaton.reducer,
  contextMenu: ContextMenu.reducer,
  curveEditor: CurveEditor.reducer,
  fxSpawner: FxSpawner.reducer,
  header: Header.reducer,
  history: History.reducer,
  settings: Settings.reducer
} );

// == store ========================================================================================
const devtools = ( window as any ).__REDUX_DEVTOOLS_EXTENSION__;
export const store = createStore(
  reducer,
  devtools && devtools()
);
