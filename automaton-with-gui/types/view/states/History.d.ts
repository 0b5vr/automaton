import { HistoryCommand } from '../history/HistoryCommand';
import { Reducer } from 'redux';
interface HistoryEntry {
    commands: HistoryCommand[];
    description: string;
}
export interface State {
    entries: HistoryEntry[];
    index: number;
    cantUndoThis: number;
}
export declare const initialState: Readonly<State>;
export declare type Action = {
    type: 'History/Push';
    commands: HistoryCommand[];
    description: string;
} | {
    type: 'History/Drop';
} | {
    type: 'History/Undo';
} | {
    type: 'History/Redo';
} | {
    type: 'History/SetCantUndoThis';
    cantUndoThis: number;
};
export declare const reducer: Reducer<State, Action>;
export {};
