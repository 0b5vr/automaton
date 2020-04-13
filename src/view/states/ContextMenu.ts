import { Reducer } from 'redux';
import { produce } from 'immer';

// == state ========================================================================================
export interface ContextMenuCommand {
  name: string;
  description?: string;
  callback: () => void;
}

export interface State {
  isVisible: boolean;
  position: { x: number; y: number };
  commands: Array<ContextMenuCommand>;
}

export const initialState: Readonly<State> = {
  isVisible: false,
  position: { x: 0, y: 0 },
  commands: []
};

// == action =======================================================================================
export type Action = {
  type: 'ContextMenu/Open';
  position: { x: number; y: number };
  commands: Array<ContextMenuCommand>;
} | {
  type: 'ContextMenu/Close';
};

// == reducer ======================================================================================
export const reducer: Reducer<State, Action> = ( state = initialState, action ) => {
  return produce( state, ( newState: State ) => {
    if ( action.type === 'ContextMenu/Open' ) {
      newState.isVisible = true;
      newState.position = action.position;
      newState.commands = action.commands;
    } else if ( action.type === 'ContextMenu/Close' ) {
      newState.isVisible = false;
      newState.commands = [];
    }
  } );
};
