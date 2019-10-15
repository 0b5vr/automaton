import { produce } from 'immer';

// == state ========================================================================================
export interface HeaderState {
  isSeeking: boolean;
  isSeekbarHovered: boolean;
}

export const initialHeaderState: Readonly<HeaderState> = {
  isSeeking: false,
  isSeekbarHovered: false
};

// == action =======================================================================================
export enum HeaderActionType {
  SeekDown = 'Header/SeekDown',
  SeekUp = 'Header/SeekUp',
  SeekbarEnter = 'Header/SeekbarEnter',
  SeekbarLeave = 'Header/SeekbarLeave',
}

interface Action {
  type: HeaderActionType;
  [ key: string ]: any;
}

// == reducer ======================================================================================
export function headerReducer(
  state: HeaderState,
  action: Action
): HeaderState {
  return produce( state, ( newState: HeaderState ) => {
    if ( action.type === HeaderActionType.SeekDown ) {
      newState.isSeeking = true;
      newState.isSeekbarHovered = true; // just in case
    } else if ( action.type === HeaderActionType.SeekUp ) {
      newState.isSeeking = false;
    } else if ( action.type === HeaderActionType.SeekbarEnter ) {
      newState.isSeekbarHovered = true;
    } else if ( action.type === HeaderActionType.SeekbarLeave ) {
      newState.isSeekbarHovered = false;
    }
  } );
}
