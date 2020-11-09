import { Action as ContextAction } from './store';
import { Reducer } from 'redux';
export interface State {
    isVisible: boolean;
    recently: string[];
    callback: ((name: string) => void) | null;
}
export declare const initialState: Readonly<State>;
export declare type Action = {
    type: 'FxSpawner/Open';
    callback: (name: string) => void;
} | {
    type: 'FxSpawner/Close';
} | {
    type: 'FxSpawner/AddRecently';
    name: string;
};
export declare const reducer: Reducer<State, ContextAction>;
