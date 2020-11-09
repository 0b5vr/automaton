import { Action as ContextAction } from './store';
import { Reducer } from 'redux';
import { Resolution } from '../utils/Resolution';
import { TimeValueRange } from '../utils/TimeValueRange';
export interface State {
    selectedCurve: string | null;
    selected: {
        nodes: string[];
        fxs: string[];
    };
    range: TimeValueRange;
}
export declare const initialState: State;
export declare type Action = {
    type: 'CurveEditor/SelectCurve';
    curveId: string | null;
} | {
    type: 'CurveEditor/SelectItems';
    nodes?: string[];
    fxs?: string[];
} | {
    type: 'CurveEditor/SelectItemsAdd';
    nodes?: string[];
    fxs?: string[];
} | {
    type: 'CurveEditor/SelectItemsSub';
    nodes?: string[];
    fxs?: string[];
} | {
    type: 'CurveEditor/MoveRange';
    size: Resolution;
    dx: number;
    dy: number;
    tmax?: number;
} | {
    type: 'CurveEditor/ZoomRange';
    size: Resolution;
    cx: number;
    cy: number;
    dx: number;
    dy: number;
    tmax?: number;
};
export declare const reducer: Reducer<State, ContextAction>;
