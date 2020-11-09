import { Action as ContextAction } from './store';
import { Dispatch, Reducer } from 'redux';
import { WithID } from '../../types/WithID';
export interface State {
    entries: {
        [id: string]: {
            kind: 'error' | 'warning' | 'info';
            message: string;
            closing: boolean;
        } & WithID;
    };
}
export declare const initialState: Readonly<State>;
export declare type Action = {
    type: 'Toasty/Push';
    id: string;
    kind: 'error' | 'warning' | 'info';
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
export declare const reducer: Reducer<State, ContextAction>;
export declare function closeToasty({ id, dispatch }: {
    id: string;
    dispatch: Dispatch<ContextAction>;
}): void;
export declare function showToasty({ kind, message, dispatch, timeout }: {
    kind: 'error' | 'warning' | 'info';
    message: string;
    dispatch: Dispatch<ContextAction>;
    timeout?: number;
}): void;
