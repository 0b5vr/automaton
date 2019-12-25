import { produce } from 'immer';

// == state ========================================================================================
export interface State {
  params: { [ name: string ]: true };
}

export const initialState: Readonly<State> = {
  params: {}
};

// == action =======================================================================================
export enum ActionType {
  AddParam = 'ParamList/AddParam',
  DeleteParam = 'ParamList/DeleteParam',
  SetParams = 'ParamList/SetParams',
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
    if ( action.type === ActionType.AddParam ) {
      newState.params[ action.param ] = true;
    } else if ( action.type === ActionType.DeleteParam ) {
      delete newState.params[ action.param ];
    } else if ( action.type === ActionType.SetParams ) {
      newState.params = {};
      action.params.forEach( ( param: string ) => newState.params[ param ] = true );
    }
  } );
}
