import { Reducer } from 'redux';
import { combineArraysUnique } from '../utils/combineArraysUnique';
import { produce } from 'immer';

// == state ========================================================================================
export interface State {
  isVisible: boolean;
  recently: string[];
  callback: ( ( name: string ) => void ) | null;
}

export const initialState: Readonly<State> = {
  isVisible: false,
  recently: [],
  callback: null
};

// == action =======================================================================================
export type Action = {
  type: 'FxSpawner/Open';
  callback: ( name: string ) => void;
} | {
  type: 'FxSpawner/Close';
} | {
  type: 'FxSpawner/AddRecently';
  name: string;
};

// == reducer ======================================================================================
export const reducer: Reducer<State, Action> = ( state = initialState, action ) => {
  return produce( state, ( newState: State ) => {
    if ( action.type === 'FxSpawner/Open' ) {
      newState.isVisible = true;
      newState.callback = action.callback;
    } else if ( action.type === 'FxSpawner/Close' ) {
      newState.isVisible = false;
      newState.callback = null;
    } else if ( action.type === 'FxSpawner/AddRecently' ) {
      newState.recently = combineArraysUnique( [ action.name ], state.recently );
    }
  } );
};
