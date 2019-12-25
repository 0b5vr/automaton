import { produce } from 'immer';

// == state ========================================================================================
export interface State {
  params: Set<string>;
}

export const initialState: Readonly<State> = {
  params: new Set()
};

// == action =======================================================================================
export enum ActionType {
  AddParam = 'ParamList/AddParam',
  DeleteParam = 'ParamList/DeleteParam',
  SetParams = 'ParamList/SetParams',
}

type Action = {
  type: ActionType.AddParam;
  param: string;
} | {
  type: ActionType.DeleteParam;
  param: string;
} | {
  type: ActionType.SetParams;
  params: string[];
};

// == reducer ======================================================================================
export function reducer(
  state: State,
  action: Action
): State {
  return produce( state, ( newState: State ) => {
    if ( action.type === ActionType.AddParam ) {
      newState.params.add( action.param );
    } else if ( action.type === ActionType.DeleteParam ) {
      newState.params.delete( action.param );
    } else if ( action.type === ActionType.SetParams ) {
      newState.params.clear();
      action.params.forEach( ( param: string ) => newState.params.add( param ) );
    }
  } );
}
