import { AutomatonWithGUI } from '../../AutomatonWithGUI';
import { SerializedParam } from '@fms-cat/automaton';
import { produce } from 'immer';

// == state ========================================================================================
export interface State {
  instance?: AutomatonWithGUI;
  params: { [ name: string ]: SerializedParam };
  isPlaying: boolean;
  time: number;
  length: number;
}

export const initialState: Readonly<State> = {
  params: {},
  isPlaying: false,
  time: 0.0,
  length: 1.0
};

// == action =======================================================================================
export type Action = {
  type: 'Automaton/SetInstance';
  automaton: AutomatonWithGUI;
} | {
  type: 'Automaton/UpdateParam';
  name: string;
  serializedParam: SerializedParam;
} | {
  type: 'Automaton/UpdateIsPlaying';
} | {
  type: 'Automaton/UpdateTime';
} | {
  type: 'Automaton/UpdateLength';
};

// == reducer ======================================================================================
export function reducer(
  state: State,
  action: Action
): State {
  return produce( state, ( newState: State ) => {
    if ( action.type === 'Automaton/SetInstance' ) {
      newState.instance = action.automaton;
    } else if ( action.type === 'Automaton/UpdateParam' ) {
      newState.params[ action.name ] = action.serializedParam;
    } else if ( action.type === 'Automaton/UpdateIsPlaying' ) {
      newState.isPlaying = state.instance!.isPlaying;
    } else if ( action.type === 'Automaton/UpdateTime' ) {
      newState.time = state.instance!.time;
    } else if ( action.type === 'Automaton/UpdateLength' ) {
      newState.length = state.instance!.length;
    }
  } );
}
