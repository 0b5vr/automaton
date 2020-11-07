import { HistoryCommand } from '../history/HistoryCommand';
import { Reducer } from 'redux';
import { produce } from 'immer';

// == state ========================================================================================
interface HistoryEntry {
  commands: HistoryCommand[];
  description: string;
}

export interface State {
  entries: HistoryEntry[];
  index: number;
  cantUndoThis: number;
}

export const initialState: Readonly<State> = {
  entries: [],
  index: 0,
  cantUndoThis: 0
};

// == action =======================================================================================
export type Action = {
  type: 'History/Push';
  commands: HistoryCommand[];
  description: string;
} | {
  type: 'History/Drop';
} | {
  type: 'History/Undo';
} | {
  type: 'History/Redo';
} | {
  type: 'History/SetCantUndoThis';
  cantUndoThis: number;
};

// == reducer ======================================================================================
export const reducer: Reducer<State, Action> = ( state = initialState, action ) => {
  return produce( state, ( newState: State ) => {
    if ( action.type === 'History/Push' ) {
      newState.entries.splice( state.index );
      newState.entries.push( {
        commands: action.commands,
        description: action.description
      } );
      newState.index ++;
    } else if ( action.type === 'History/Drop' ) {
      newState.entries.splice( 0 );
      newState.index = 0;
    } else if ( action.type === 'History/Undo' ) {
      newState.index --;
    } else if ( action.type === 'History/Redo' ) {
      newState.index ++;
    } else if ( action.type === 'History/SetCantUndoThis' ) {
      newState.cantUndoThis = action.cantUndoThis;
    }
  } );
};
