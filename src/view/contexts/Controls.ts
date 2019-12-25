import { produce } from 'immer';

// == state ========================================================================================
export interface State {
  lastClick: number;
}

export const initialState: Readonly<State> = {
  lastClick: 0
};

// == action =======================================================================================
export enum ActionType {
  SetLastClick = 'Controls/SetLastClick'
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
    if ( action.type === ActionType.SetLastClick ) {
      newState.lastClick = action.date;
    }
  } );
}
