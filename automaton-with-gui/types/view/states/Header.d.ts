import { Reducer } from 'redux';
export interface State {
    isSeeking: boolean;
    isSeekbarHovered: boolean;
}
export declare const initialState: Readonly<State>;
export declare type Action = {
    type: 'Header/SeekDown';
} | {
    type: 'Header/SeekUp';
} | {
    type: 'Header/SeekbarEnter';
} | {
    type: 'Header/SeekbarLeave';
};
export declare const reducer: Reducer<State, Action>;
