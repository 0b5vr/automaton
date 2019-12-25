import { produce } from 'immer';

// == state ========================================================================================
export interface State {
  lastClick: number;
}

export const initialState: Readonly<State> = {
  lastClick: 0
};

// == action =======================================================================================
export type Action = {
  type: 'Controls/SetLastClick';
  date: number;
}

// == reducer ======================================================================================
export function reducer(
  state: State,
  action: Action
): State {
  return produce( state, ( newState: State ) => {
    if ( action.type === 'Controls/SetLastClick' ) {
      newState.lastClick = action.date;
    }
  } );
}
