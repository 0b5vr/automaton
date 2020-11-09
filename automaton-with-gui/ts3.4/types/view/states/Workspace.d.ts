import { Reducer } from 'redux';
export interface State {
    mode: 'dope' | 'channel' | 'curve';
}
export declare const initialState: Readonly<State>;
export declare type Action = {
    type: 'Workspace/ChangeMode';
    mode: 'dope' | 'channel' | 'curve';
};
export declare const reducer: Reducer<State, Action>;
