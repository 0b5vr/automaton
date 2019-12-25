import { produce } from 'immer';

// == state ========================================================================================
interface HistoryEntry {
  description: string;
  redo: () => void;
  undo: () => void;
}

export interface State {
  entries: HistoryEntry[];
  index: number;
}

export const initialState: Readonly<State> = {
  entries: [],
  index: 0
};

// == action =======================================================================================
export enum ActionType {
  Push = 'History/Push',
  Drop = 'History/Drop',
  Undo = 'History/Undo',
  Redo = 'History/Redo'
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
    if ( action.type === ActionType.Push ) {
      newState.entries.splice( state.index );
      newState.entries.push( action.entry );
      newState.index ++;
    } else if ( action.type === ActionType.Drop ) {
      newState.entries.splice( 0 );
      newState.index = 0;
    } else if ( action.type === ActionType.Undo ) {
      newState.index --;
    } else if ( action.type === ActionType.Redo ) {
      newState.index ++;
    }
  } );
}
