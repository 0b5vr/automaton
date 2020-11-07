import { Reducer } from 'redux';
import { produce } from 'immer';

// == state ========================================================================================
export interface State {
  mode: 'dope' | 'channel' | 'curve';
}

export const initialState: Readonly<State> = {
  mode: 'dope'
};

// == action =======================================================================================
export type Action = {
  type: 'Workspace/ChangeMode';
  mode: 'dope' | 'channel' | 'curve';
};

// == reducer ======================================================================================
export const reducer: Reducer<State, Action> = ( state = initialState, action ) => {
  return produce( state, ( newState: State ) => {
    if ( action.type === 'Workspace/ChangeMode' ) {
      newState.mode = action.mode;
    }
  } );
};
