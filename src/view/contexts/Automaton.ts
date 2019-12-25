import { AutomatonWithGUI } from '../../AutomatonWithGUI';
import { produce } from 'immer';

// == state ========================================================================================
export interface State {
  instance?: AutomatonWithGUI;
  isPlaying: boolean;
  time: number;
  length: number;
}

export const initialState: Readonly<State> = {
  isPlaying: false,
  time: 0.0,
  length: 1.0
};

// == action =======================================================================================
export enum ActionType {
  SetInstance = 'Automaton/SetInstance',
  UpdateIsPlaying = 'Automaton/UpdateIsPlaying',
  UpdateTime = 'Automaton/UpdateTime',
  UpdateLength = 'Automaton/UpdateLength',
}

interface Action {
  type: ActionType;
  [ key: string ]: any;
}

// == reducer ======================================================================================
export function reducer(
  state: State,
  action: Action
): State {
  return produce( state, ( newState: State ) => {
    if ( action.type === ActionType.SetInstance ) {
      newState.instance = action.automaton;
    } else if ( action.type === ActionType.UpdateIsPlaying ) {
      newState.isPlaying = state.instance!.isPlaying;
    } else if ( action.type === ActionType.UpdateTime ) {
      newState.time = state.instance!.time;
    } else if ( action.type === ActionType.UpdateLength ) {
      newState.length = state.instance!.length;
    }
  } );
}
