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
export type Action = {
  type: 'History/Push';
  entry: HistoryEntry;
} | {
  type: 'History/Drop';
} | {
  type: 'History/Undo';
} | {
  type: 'History/Redo';
};

// == reducer ======================================================================================
export function reducer(
  state: State,
  action: Action
): State {
  return produce( state, ( newState: State ) => {
    if ( action.type === 'History/Push' ) {
      newState.entries.splice( state.index );
      newState.entries.push( action.entry );
      newState.index ++;
    } else if ( action.type === 'History/Drop' ) {
      newState.entries.splice( 0 );
      newState.index = 0;
    } else if ( action.type === 'History/Undo' ) {
      newState.index --;
    } else if ( action.type === 'History/Redo' ) {
      newState.index ++;
    }
  } );
}
