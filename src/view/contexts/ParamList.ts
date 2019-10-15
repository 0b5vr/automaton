import { produce } from 'immer';

// == state ========================================================================================
export interface ParamListState {
  params: { [ name: string ]: true };
}

export const initialParamListState: Readonly<ParamListState> = {
  params: {}
};

// == action =======================================================================================
export enum ParamListActionType {
  AddParam = 'ParamList/AddParam',
  DeleteParam = 'ParamList/DeleteParam',
  SetParams = 'ParamList/SetParams',
}

interface Action {
  type: ParamListActionType;
  [ key: string ]: any;
}

// == reducer ======================================================================================
export function paramListReducer(
  state: ParamListState,
  action: Action
): ParamListState {
  return produce( state, ( newState: ParamListState ) => {
    if ( action.type === ParamListActionType.AddParam ) {
      newState.params[ action.param ] = true;
    } else if ( action.type === ParamListActionType.DeleteParam ) {
      delete newState.params[ action.param ];
    } else if ( action.type === ParamListActionType.SetParams ) {
      newState.params = {};
      action.params.forEach( ( param: string ) => newState.params[ param ] = true );
    }
  } );
}
