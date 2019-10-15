import { produce } from 'immer';

// == state ========================================================================================
export interface ControlsState {
  lastClick: number;
}

export const initialControlsState: Readonly<ControlsState> = {
  lastClick: 0
};

// == action =======================================================================================
export enum ControlsActionType {
  SetLastClick = 'Controls/SetLastClick'
}

interface Action {
  type: ControlsActionType;
  [ key: string ]: any;
}

// == reducer ======================================================================================
export function controlsReducer(
  state: ControlsState,
  action: Action
): ControlsState {
  return produce( state, ( newState: ControlsState ) => {
    if ( action.type === ControlsActionType.SetLastClick ) {
      newState.lastClick = action.date;
    }
  } );
}
