import { AboutState, aboutReducer, initialAboutState } from './About';
import { AutomatonState, automatonReducer, initialAutomatonState } from './Automaton';
import { ControlsState, controlsReducer, initialControlsState } from './Controls';
import { CurveEditorState, curveEditorReducer, initialCurveEditorState } from './CurveEditor';
import { HeaderState, headerReducer, initialHeaderState } from './Header';
import { HistoryState, historyReducer, initialHistoryState } from './History';
import { ParamListState, initialParamListState, paramListReducer } from './ParamList';
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
export interface ContextState {
  about: AboutState;
  automaton: AutomatonState;
  controls: ControlsState;
  curveEditor: CurveEditorState;
  header: HeaderState;
  history: HistoryState;
  paramList: ParamListState;
}

const initialState: Readonly<ContextState> = {
  about: initialAboutState,
  automaton: initialAutomatonState,
  controls: initialControlsState,
  curveEditor: initialCurveEditorState,
  header: initialHeaderState,
  history: initialHistoryState,
  paramList: initialParamListState
};

// == reducer ======================================================================================
const reducer = combineReducers<ContextState>( {
  about: aboutReducer,
  automaton: automatonReducer,
  controls: controlsReducer,
  curveEditor: curveEditorReducer,
  header: headerReducer,
  history: historyReducer,
  paramList: paramListReducer
} );

// == context ======================================================================================
interface StoreType {
  state: ContextState;
  dispatch: React.Dispatch<any>;
}

const Store = createContext<StoreType>( undefined as any as StoreType );

const Provider = ( { children }: { children: JSX.Element } ): JSX.Element => {
  const [ state, dispatch ] = useReducer( reducer, initialState );
  return <Store.Provider value={ { state, dispatch } }>{ children }</Store.Provider>;
};

export const Context = {
  Store,
  Provider
};
