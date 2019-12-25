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
export enum ActionType {
  SeekDown = 'Header/SeekDown',
  SeekUp = 'Header/SeekUp',
  SeekbarEnter = 'Header/SeekbarEnter',
  SeekbarLeave = 'Header/SeekbarLeave',
}

type Action = {
  type: ActionType.SeekDown;
} | {
  type: ActionType.SeekUp;
} | {
  type: ActionType.SeekbarEnter;
} | {
  type: ActionType.SeekbarLeave;
};

// == reducer ======================================================================================
export function reducer(
  state: State,
  action: Action
): State {
  return produce( state, ( newState: State ) => {
    if ( action.type === ActionType.SeekDown ) {
      newState.isSeeking = true;
      newState.isSeekbarHovered = true; // just in case
    } else if ( action.type === ActionType.SeekUp ) {
      newState.isSeeking = false;
    } else if ( action.type === ActionType.SeekbarEnter ) {
      newState.isSeekbarHovered = true;
    } else if ( action.type === ActionType.SeekbarLeave ) {
      newState.isSeekbarHovered = false;
    }
  } );
}
