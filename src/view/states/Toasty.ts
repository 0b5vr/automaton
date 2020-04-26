import { Dispatch, Reducer } from 'redux';
import { Action as ContextAction } from './store';
import { WithID } from '../../types/WithID';
import { genID } from '../../utils/genID';
import { objectMapHas } from '../utils/objectMap';
import { produce } from 'immer';

// == types ========================================================================================
export enum ToastyKind {
  Error,
  Warning,
  Info
}

// == state ========================================================================================
export interface State {
  entries: {
    [ id: string ]: {
      kind: ToastyKind;
      message: string;
      closing: boolean;
    } & WithID;
  };
}

export const initialState: Readonly<State> = {
  entries: {}
};

// == action =======================================================================================
export type Action = {
  type: 'Toasty/Push';
  id: string;
  kind: ToastyKind;
  message: string;
} | {
  type: 'Toasty/Closing';
  id: string;
} | {
  type: 'Toasty/Close';
  id: string;
} | {
  type: 'Toasty/Clear';
};

// == reducer ======================================================================================
export const reducer: Reducer<State, ContextAction> = ( state = initialState, action ) => {
  return produce( state, ( newState: State ) => {
    if ( action.type === 'Toasty/Push' ) {
      newState.entries[ action.id ] = {
        $id: action.id,
        kind: action.kind,
        message: action.message,
        closing: false
      };
    } else if ( action.type === 'Toasty/Closing' ) {
      if ( objectMapHas( newState.entries, action.id ) ) {
        newState.entries[ action.id ].closing = true;
      }
    } else if ( action.type === 'Toasty/Close' ) {
      delete newState.entries[ action.id ];
    } else if ( action.type === 'Toasty/Clear' ) {
      newState.entries = {};
    }
  } );
};

// == helpers ======================================================================================
export function closeToasty( { id, dispatch }: {
  id: string;
  dispatch: Dispatch<ContextAction>;
} ): void {
  dispatch( {
    type: 'Toasty/Closing',
    id
  } );

  setTimeout(
    () => {
      dispatch( {
        type: 'Toasty/Close',
        id
      } );
    },
    200
  );
}

export function showToasty( { kind, message, dispatch, timeout }: {
  kind: ToastyKind;
  message: string;
  dispatch: Dispatch<ContextAction>;
  timeout?: number;
} ): void {
  const id = genID();

  dispatch( {
    type: 'Toasty/Push',
    id,
    kind,
    message
  } );

  if ( timeout ) {
    setTimeout(
      () => closeToasty( { id, dispatch } ),
      1000.0 * timeout
    );
  }
}
