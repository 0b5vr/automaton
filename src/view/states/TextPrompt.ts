import { Reducer } from 'redux';
import { produce } from 'immer';

// == state ========================================================================================
export interface State {
  isVisible: boolean;
  position: { x: number; y: number };
  text: string;
  placeholder: string;
  checkValid?: ( ( text: string ) => boolean ) | null;
  callback?: ( ( text: string ) => void ) | null;
}

export const initialState: Readonly<State> = {
  isVisible: false,
  position: { x: 0, y: 0 },
  text: '',
  placeholder: ''
};

// == action =======================================================================================
export type Action = {
  type: 'TextPrompt/Open';
  position: { x: number; y: number };
  defaultText?: string;
  placeholder?: string;
  checkValid?: ( ( text: string ) => boolean );
  callback: ( ( text: string ) => void );
} | {
  type: 'TextPrompt/SetText';
  text: string;
} | {
  type: 'TextPrompt/Close';
};

// == reducer ======================================================================================
export const reducer: Reducer<State, Action> = ( state = initialState, action ) => {
  return produce( state, ( newState: State ) => {
    if ( action.type === 'TextPrompt/Open' ) {
      newState.isVisible = true;
      newState.position = action.position;
      newState.text = action.defaultText || '';
      newState.placeholder = action.placeholder || '';
      newState.checkValid = action.checkValid;
      newState.callback = action.callback;
    } else if ( action.type === 'TextPrompt/SetText' ) {
      newState.text = action.text;
    } else if ( action.type === 'TextPrompt/Close' ) {
      newState.isVisible = false;
      newState.text = '';
      newState.placeholder = '';
      newState.checkValid = null;
      newState.callback = null;
    }
  } );
};
