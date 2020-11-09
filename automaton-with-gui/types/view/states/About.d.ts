import { Reducer } from 'redux';
export interface State {
    isVisible: boolean;
}
export declare const initialState: Readonly<State>;
export declare type Action = {
    type: 'About/Open';
} | {
    type: 'About/Close';
};
export declare const reducer: Reducer<State, Action>;
