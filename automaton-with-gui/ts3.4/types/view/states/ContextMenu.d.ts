import { Reducer } from 'redux';
export interface ContextMenuCommand {
    name: string;
    description?: string;
    callback: () => void;
}
export interface State {
    isVisible: boolean;
    position: {
        x: number;
        y: number;
    };
    commands: Array<ContextMenuCommand | 'hr'>;
}
export declare const initialState: Readonly<State>;
export declare type Action = {
    type: 'ContextMenu/Push';
    position: {
        x: number;
        y: number;
    };
    commands: Array<ContextMenuCommand>;
} | {
    type: 'ContextMenu/Close';
};
export declare const reducer: Reducer<State, Action>;
