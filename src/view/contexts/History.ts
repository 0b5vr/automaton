import { produce } from 'immer';

// == state ========================================================================================
interface HistoryEntry {
  description: string;
  redo: () => void;
  undo: () => void;
}

export interface HistoryState {
  entries: HistoryEntry[];
  index: number;
}

export const initialHistoryState: Readonly<HistoryState> = {
  entries: [],
  index: 0
};

// == action =======================================================================================
export enum HistoryActionType {
  Push = 'History/Push',
  Drop = 'History/Drop',
  Undo = 'History/Undo',
  Redo = 'History/Redo'
}

interface Action {
  type: HistoryActionType;
  [ key: string ]: any;
}

// == reducer ======================================================================================
export function historyReducer(
  state: HistoryState,
  action: Action
): HistoryState {
  return produce( state, ( newState: HistoryState ) => {
    if ( action.type === HistoryActionType.Push ) {
      newState.entries.splice( state.index );
      newState.entries.push( action.entry );
      newState.index ++;
    } else if ( action.type === HistoryActionType.Drop ) {
      newState.entries.splice( 0 );
      newState.index = 0;
    } else if ( action.type === HistoryActionType.Undo ) {
      newState.index --;
    } else if ( action.type === HistoryActionType.Redo ) {
      newState.index ++;
    }
  } );
}
