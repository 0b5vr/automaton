import { Action as ContextAction } from './store';
import { Reducer } from 'redux';
import { Resolution } from '../utils/Resolution';
import { TimeValueRange } from '../utils/TimeValueRange';
export interface State {
    selectedChannel: string | null;
    selected: {
        labels: string[];
        items: {
            [id: string]: {
                id: string;
                channel: string;
            };
        };
    };
    lastSelectedItem: {
        id: string;
        channel: string;
    } | null;
    range: TimeValueRange;
}
export declare const initialState: State;
export declare type Action = {
    type: 'Timeline/SelectChannel';
    channel: string | null;
} | {
    type: 'Timeline/SelectItems';
    items: Array<{
        id: string;
        channel: string;
    }>;
} | {
    type: 'Timeline/SelectItemsAdd';
    items: Array<{
        id: string;
        channel: string;
    }>;
} | {
    type: 'Timeline/SelectItemsSub';
    items: string[];
} | {
    type: 'Timeline/SelectLabels';
    labels: string[];
} | {
    type: 'Timeline/SelectLabelsAdd';
    labels: string[];
} | {
    type: 'Timeline/SelectLabelsSub';
    labels: string[];
} | {
    type: 'Timeline/UnselectItemsOfOtherChannels';
} | {
    type: 'Timeline/MoveRange';
    size: Resolution;
    dx: number;
    dy: number;
    tmax?: number;
} | {
    type: 'Timeline/ZoomRange';
    size: Resolution;
    cx: number;
    cy: number;
    dx: number;
    dy: number;
    tmax?: number;
};
export declare const reducer: Reducer<State, ContextAction>;
