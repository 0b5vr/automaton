import * as About from './About';
import * as Automaton from './Automaton';
import * as ContextMenu from './ContextMenu';
import * as CurveEditor from './CurveEditor';
import * as FxSpawner from './FxSpawner';
import * as Header from './Header';
import * as History from './History';
import * as Settings from './Settings';
import React, { createContext, useReducer } from 'react';

// == utils ========================================================================================
function combineReducers<T>( reducers: any ): ( ( state: any, action: any ) => T ) {
  return ( state: any = {}, action: any ) => {
    const keys = Object.keys( reducers );
    const nextReducers: any = {};
    for ( let i = 0; i < keys.length; i ++ ) {
      const invoke = reducers[ keys[ i ] ]( state[ keys[ i ] ], action );
      nextReducers[ keys[ i ] ] = invoke;
    }
    return nextReducers;
  };
}

// == state ========================================================================================
export interface ContextsState {
  about: About.State;
  automaton: Automaton.State;
  contextMenu: ContextMenu.State;
  curveEditor: CurveEditor.State;
  fxSpawner: FxSpawner.State;
  header: Header.State;
  history: History.State;
  settings: Settings.State;
}

const initialState: Readonly<ContextsState> = {
  about: About.initialState,
  automaton: Automaton.initialState,
  contextMenu: ContextMenu.initialState,
  curveEditor: CurveEditor.initialState,
  fxSpawner: FxSpawner.initialState,
  header: Header.initialState,
  history: History.initialState,
  settings: Settings.initialState
};

// == action =======================================================================================
type Action = (
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
const reducer = combineReducers<ContextsState>( {
  about: About.reducer,
  automaton: Automaton.reducer,
  contextMenu: ContextMenu.reducer,
  curveEditor: CurveEditor.reducer,
  fxSpawner: FxSpawner.reducer,
  header: Header.reducer,
  history: History.reducer,
  settings: Settings.reducer
} );

// == context ======================================================================================
interface StoreType {
  state: ContextsState;
  dispatch: React.Dispatch<Action>;
}

const Store = createContext<StoreType>( undefined as any as StoreType );

const Provider = ( { children }: { children: JSX.Element } ): JSX.Element => {
  const [ state, dispatch ] = useReducer( reducer, initialState );
  return <Store.Provider value={ { state, dispatch } }>{ children }</Store.Provider>;
};

export const Contexts = {
  Store,
  Provider
};
