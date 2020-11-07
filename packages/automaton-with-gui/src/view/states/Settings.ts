import { Reducer } from 'redux';
import { produce } from 'immer';

// == state ========================================================================================
type SettingsMode = 'none' | 'snapping' | 'general';

export interface State {
  mode: SettingsMode;
}

export const initialState: Readonly<State> = {
  mode: 'none'
};

// == action =======================================================================================
export type Action = {
  type: 'Settings/ChangeMode';
  mode: SettingsMode;
};

// == reducer ======================================================================================
export const reducer: Reducer<State, Action> = ( state = initialState, action ) => {
  return produce( state, ( newState: State ) => {
    if ( action.type === 'Settings/ChangeMode' ) {
      newState.mode = action.mode;
    }
  } );
};
