import { Reducer } from 'redux';
export interface State {
    isVisible: boolean;
    position: {
        x: number;
        y: number;
    };
    text: string;
    placeholder: string;
    checkValid?: ((text: string) => string | null) | null;
    callback?: ((text: string) => void) | null;
}
export declare const initialState: Readonly<State>;
export declare type Action = {
    type: 'TextPrompt/Open';
    position: {
        x: number;
        y: number;
    };
    defaultText?: string;
    placeholder?: string;
    checkValid?: ((text: string) => string | null);
    callback: ((text: string) => void);
} | {
    type: 'TextPrompt/SetText';
    text: string;
} | {
    type: 'TextPrompt/Close';
};
export declare const reducer: Reducer<State, Action>;
