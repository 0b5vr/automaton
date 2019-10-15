import { AutomatonWithGUI } from '../../AutomatonWithGUI';
import { produce } from 'immer';

// == state ========================================================================================
export interface AutomatonState {
  instance?: AutomatonWithGUI;
  isPlaying: boolean;
  time: number;
  length: number;
}

export const initialAutomatonState: Readonly<AutomatonState> = {
  isPlaying: false,
  time: 0.0,
  length: 1.0
};

// == action =======================================================================================
export enum AutomatonActionType {
  SetInstance = 'Automaton/SetInstance',
  UpdateIsPlaying = 'Automaton/UpdateIsPlaying',
  UpdateTime = 'Automaton/UpdateTime',
  UpdateLength = 'Automaton/UpdateLength',
}

interface Action {
  type: AutomatonActionType;
  [ key: string ]: any;
}

// == reducer ======================================================================================
export function automatonReducer(
  state: AutomatonState,
  action: Action
): AutomatonState {
  return produce( state, ( newState: AutomatonState ) => {
    if ( action.type === AutomatonActionType.SetInstance ) {
      newState.instance = action.automaton;
    } else if ( action.type === AutomatonActionType.UpdateIsPlaying ) {
      newState.isPlaying = state.instance!.isPlaying;
    } else if ( action.type === AutomatonActionType.UpdateTime ) {
      newState.time = state.instance!.time;
    } else if ( action.type === AutomatonActionType.UpdateLength ) {
      newState.length = state.instance!.length;
    }
  } );
}
