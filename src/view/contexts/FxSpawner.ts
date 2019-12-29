import { produce } from 'immer';

// == state ========================================================================================
export interface State {
  isVisible: boolean;
}

export const initialState: Readonly<State> = {
  isVisible: true
};

// == action =======================================================================================
export type Action = {
  type: 'FxSpawner/Open';
} | {
  type: 'FxSpawner/Close';
};

// == reducer ======================================================================================
export function reducer(
  state: State,
  action: Action
): State {
  return produce( state, ( newState: State ) => {
    if ( action.type === 'FxSpawner/Open' ) {
      newState.isVisible = true;
    } else if ( action.type === 'FxSpawner/Close' ) {
      newState.isVisible = false;
    }
  } );
}
