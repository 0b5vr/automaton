import { produce } from 'immer';

// == state ========================================================================================
export interface State {
  isVisible: boolean;
}

export const initialState: Readonly<State> = {
  isVisible: false
};

// == action =======================================================================================
export enum ActionType {
  Open = 'About/Open',
  Close = 'About/Close'
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
    if ( action.type === ActionType.Open ) {
      newState.isVisible = true;
    } else if ( action.type === ActionType.Close ) {
      newState.isVisible = false;
    }
  } );
}
