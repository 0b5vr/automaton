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
export function reducer(
  state: State,
  action: Action
): State {
  return produce( state, ( newState: State ) => {
    if ( action.type === 'About/Open' ) {
      newState.isVisible = true;
    } else if ( action.type === 'About/Close' ) {
      newState.isVisible = false;
    }
  } );
}
