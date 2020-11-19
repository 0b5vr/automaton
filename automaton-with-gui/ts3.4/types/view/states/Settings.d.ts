import { Reducer } from 'redux';
declare type SettingsMode = 'none' | 'snapping' | 'beat' | 'general' | 'stats';
export interface State {
    mode: SettingsMode;
}
export declare const initialState: Readonly<State>;
export declare type Action = {
    type: 'Settings/ChangeMode';
    mode: SettingsMode;
};
export declare const reducer: Reducer<State, Action>;
export {};
