import { produce } from 'immer';

// == state ========================================================================================
interface ContextMenuCommand {
  name: string;
  description?: string;
  command: () => void;
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
export function reducer(
  state: State,
  action: Action
): State {
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
}
