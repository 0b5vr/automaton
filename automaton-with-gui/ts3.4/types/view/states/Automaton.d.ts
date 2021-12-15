import { AutomatonWithGUI } from '../../AutomatonWithGUI';
import { BezierNode, FxDefinition, FxSection } from '@0b5vr/automaton';
import { ChannelStatusCode } from '../../ChannelWithGUI';
import { Action as ContextAction } from './store';
import { CurveStatusCode } from '../../CurveWithGUI';
import { GUISettings } from '../../types/GUISettings';
import { Reducer } from 'redux';
import { Status } from '../../types/Status';
import { WithBypass } from '../../types/WithBypass';
import { WithID } from '../../types/WithID';
import { StateChannelItem } from '../../types/StateChannelItem';
export interface State {
    instance?: AutomatonWithGUI;
    fxDefinitions: {
        [name: string]: FxDefinition;
    };
    channelNames: string[];
    channels: {
        [name: string]: {
            value: number;
            length: number;
            status: Status<ChannelStatusCode> | null;
            items: {
                [id: string]: StateChannelItem;
            };
            sortedItems: StateChannelItem[];
        };
    };
    curves: {
        [name: string]: {
            status: Status<CurveStatusCode> | null;
            length: number;
            path: string;
            nodes: {
                [id: string]: BezierNode & WithID;
            };
            fxs: {
                [id: string]: FxSection & WithBypass & WithID;
            };
        };
    };
    curvesPreview: {
        [name: string]: {
            time: number | null;
            value: number | null;
            itemTime: number | null;
            itemSpeed: number | null;
            itemOffset: number | null;
        };
    };
    labels: {
        [name: string]: number;
    };
    loopRegion: {
        begin: number;
        end: number;
    } | null;
    isPlaying: boolean;
    time: number;
    length: number;
    resolution: number;
    shouldSave: boolean;
    guiSettings: GUISettings;
}
export declare const initialState: Readonly<State>;
export declare type Action = {
    type: 'Automaton/SetInstance';
    automaton: AutomatonWithGUI;
} | {
    type: 'Automaton/AddFxDefinition';
    name: string;
    fxDefinition: FxDefinition;
} | {
    type: 'Automaton/CreateChannel';
    channel: string;
    index: number;
} | {
    type: 'Automaton/RemoveChannel';
    channel: string;
} | {
    type: 'Automaton/ReorderChannels';
    index: number;
    length: number;
    newIndex: number;
} | {
    type: 'Automaton/UpdateChannelValue';
    channel: string;
    value: number;
} | {
    type: 'Automaton/UpdateChannelLength';
    channel: string;
    length: number;
} | {
    type: 'Automaton/UpdateChannelStatus';
    channel: string;
    status: Status<ChannelStatusCode> | null;
} | {
    type: 'Automaton/UpdateChannelItem';
    channel: string;
    id: string;
    item: StateChannelItem;
} | {
    type: 'Automaton/RemoveChannelItem';
    channel: string;
    id: string;
} | {
    type: 'Automaton/CreateCurve';
    curveId: string;
    length: number;
    path: string;
} | {
    type: 'Automaton/RemoveCurve';
    curveId: string;
} | {
    type: 'Automaton/UpdateCurvePath';
    curveId: string;
    path: string;
} | {
    type: 'Automaton/UpdateCurveLength';
    curveId: string;
    length: number;
} | {
    type: 'Automaton/UpdateCurveStatus';
    curveId: string;
    status: Status<CurveStatusCode> | null;
} | {
    type: 'Automaton/UpdateCurvePreviewTimeValue';
    curveId: string;
    time: number;
    value: number;
    itemTime: number;
    itemSpeed: number;
    itemOffset: number;
} | {
    type: 'Automaton/UpdateCurveNode';
    curveId: string;
    id: string;
    node: BezierNode & WithID;
} | {
    type: 'Automaton/RemoveCurveNode';
    curveId: string;
    id: string;
} | {
    type: 'Automaton/UpdateCurveFx';
    curveId: string;
    id: string;
    fx: FxSection & WithBypass & WithID;
} | {
    type: 'Automaton/RemoveCurveFx';
    curveId: string;
    id: string;
} | {
    type: 'Automaton/UpdateCurveLength';
    curveId: string;
    length: number;
} | {
    type: 'Automaton/SetLabel';
    name: string;
    time: number;
} | {
    type: 'Automaton/DeleteLabel';
    name: string;
} | {
    type: 'Automaton/SetLoopRegion';
    loopRegion: {
        begin: number;
        end: number;
    } | null;
} | {
    type: 'Automaton/UpdateIsPlaying';
    isPlaying: boolean;
} | {
    type: 'Automaton/UpdateTime';
    time: number;
} | {
    type: 'Automaton/ChangeLength';
    length: number;
} | {
    type: 'Automaton/ChangeResolution';
    resolution: number;
} | {
    type: 'Automaton/SetShouldSave';
    shouldSave: boolean;
} | {
    type: 'Automaton/UpdateGUISettings';
    settings: GUISettings;
};
export declare const reducer: Reducer<State, ContextAction>;
