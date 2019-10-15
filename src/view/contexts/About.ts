import { produce } from 'immer';

// == state ========================================================================================
export interface AboutState {
  isVisible: boolean;
}

export const initialAboutState: Readonly<AboutState> = {
  isVisible: false
};

// == action =======================================================================================
export enum AboutActionType {
  Open = 'About/Open',
  Close = 'About/Close'
}

interface Action {
  type: AboutActionType;
  [ key: string ]: any;
}

// == reducer ======================================================================================
export function aboutReducer(
  state: AboutState,
  action: Action
): AboutState {
  return produce( state, ( newState: AboutState ) => {
    if ( action.type === AboutActionType.Open ) {
      newState.isVisible = true;
    } else if ( action.type === AboutActionType.Close ) {
      newState.isVisible = false;
    }
  } );
}
