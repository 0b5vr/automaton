import { Reducer } from 'redux';
import { produce } from 'immer';

// == state ========================================================================================
export interface State {
  isVisible: boolean;
}

export const initialState: Readonly<State> = {
  isVisible: false
};

// == action =======================================================================================
export type Action = {
  type: 'About/Open';
} | {
  type: 'About/Close';
};

// == reducer ======================================================================================
export const reducer: Reducer<State, Action> = ( state = initialState, action ) => {
  return produce( state, ( newState: State ) => {
    if ( action.type === 'About/Open' ) {
      newState.isVisible = true;
    } else if ( action.type === 'About/Close' ) {
      newState.isVisible = false;
    }
  } );
};
