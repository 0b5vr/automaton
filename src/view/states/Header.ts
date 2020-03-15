import { Reducer } from 'redux';
import { produce } from 'immer';

// == state ========================================================================================
export interface State {
  isSeeking: boolean;
  isSeekbarHovered: boolean;
}

export const initialState: Readonly<State> = {
  isSeeking: false,
  isSeekbarHovered: false
};

// == action =======================================================================================
export type Action = {
  type: 'Header/SeekDown';
} | {
  type: 'Header/SeekUp';
} | {
  type: 'Header/SeekbarEnter';
} | {
  type: 'Header/SeekbarLeave';
};

// == reducer ======================================================================================
export const reducer: Reducer<State, Action> = ( state = initialState, action ) => {
  return produce( state, ( newState: State ) => {
    if ( action.type === 'Header/SeekDown' ) {
      newState.isSeeking = true;
      newState.isSeekbarHovered = true; // just in case
    } else if ( action.type === 'Header/SeekUp' ) {
      newState.isSeeking = false;
    } else if ( action.type === 'Header/SeekbarEnter' ) {
      newState.isSeekbarHovered = true;
    } else if ( action.type === 'Header/SeekbarLeave' ) {
      newState.isSeekbarHovered = false;
    }
  } );
};
