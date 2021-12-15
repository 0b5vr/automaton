import { AutomatonWithGUI } from '../../AutomatonWithGUI';
import { BezierNode, FxSection, SerializedChannel, SerializedCurve } from '@0b5vr/automaton';
import { WithBypass } from '../../types/WithBypass';
import { WithID } from '../../types/WithID';
import type { StateChannelItem } from '../../types/StateChannelItem';
export declare type HistoryCommand = {
    type: 'automaton/createChannel';
    channel: string;
    index?: number;
    data?: SerializedChannel;
} | {
    type: 'automaton/removeChannel';
    channel: string;
    index: number;
    data: SerializedChannel;
} | {
    type: 'automaton/renameChannel';
    name: string;
    newName: string;
    index: number;
    data: SerializedChannel;
} | {
    type: 'automaton/createCurve';
    data: SerializedCurve & WithID;
} | {
    type: 'automaton/removeCurve';
    data: SerializedCurve & WithID;
} | {
    type: 'automaton/reorderChannels';
    name: string;
    deltaIndex: number;
} | {
    type: 'automaton/createLabel';
    name: string;
    time: number;
} | {
    type: 'automaton/moveLabel';
    name: string;
    time: number;
    timePrev: number;
} | {
    type: 'automaton/deleteLabel';
    name: string;
    timePrev: number;
} | {
    type: 'channel/createItemFromData';
    channel: string;
    data: StateChannelItem;
} | {
    type: 'channel/removeItem';
    channel: string;
    data: StateChannelItem;
} | {
    type: 'channel/moveItem';
    channel: string;
    item: string;
    time: number;
    timePrev: number;
} | {
    type: 'channel/changeItemValue';
    channel: string;
    item: string;
    value: number;
    valuePrev: number;
} | {
    type: 'channel/changeItemReset';
    channel: string;
    item: string;
    reset: boolean;
    resetPrev: boolean;
} | {
    type: 'channel/resizeItem';
    channel: string;
    item: string;
    length: number;
    lengthPrev: number;
    stretch: boolean;
} | {
    type: 'channel/resizeItemByLeft';
    channel: string;
    item: string;
    length: number;
    lengthPrev: number;
    stretch: boolean;
} | {
    type: 'channel/changeCurveSpeedAndOffset';
    channel: string;
    item: string;
    speed: number;
    speedPrev: number;
    offset: number;
    offsetPrev: number;
} | {
    type: 'channel/changeCurveAmp';
    channel: string;
    item: string;
    amp: number;
    ampPrev: number;
} | {
    type: 'curve/createNodeFromData';
    curveId: string;
    data: BezierNode & WithID;
} | {
    type: 'curve/removeNode';
    curveId: string;
    data: BezierNode & WithID;
} | {
    type: 'curve/moveNodeTime';
    curveId: string;
    node: string;
    time: number;
    timePrev: number;
} | {
    type: 'curve/moveNodeValue';
    curveId: string;
    node: string;
    value: number;
    valuePrev: number;
} | {
    type: 'curve/moveHandleTime';
    curveId: string;
    node: string;
    dir: 'in' | 'out';
    time: number;
    timePrev: number;
} | {
    type: 'curve/moveHandleValue';
    curveId: string;
    node: string;
    dir: 'in' | 'out';
    value: number;
    valuePrev: number;
} | {
    type: 'curve/createFxFromData';
    curveId: string;
    data: FxSection & WithBypass & WithID;
} | {
    type: 'curve/removeFx';
    curveId: string;
    data: FxSection & WithBypass & WithID;
} | {
    type: 'curve/moveFx';
    curveId: string;
    fx: string;
    time: number;
    timePrev: number;
} | {
    type: 'curve/changeFxRow';
    curveId: string;
    fx: string;
    row: number;
    rowPrev: number;
} | {
    type: 'curve/forceMoveFx';
    curveId: string;
    fx: string;
    time: number;
    timePrev: number;
    row: number;
    rowPrev: number;
} | {
    type: 'curve/resizeFx';
    curveId: string;
    fx: string;
    length: number;
    lengthPrev: number;
} | {
    type: 'curve/resizeFxByLeft';
    curveId: string;
    fx: string;
    length: number;
    lengthPrev: number;
} | {
    type: 'curve/bypassFx';
    curveId: string;
    fx: string;
    bypass: boolean;
} | {
    type: 'curve/changeFxParam';
    curveId: string;
    fx: string;
    key: string;
    value: any;
    valuePrev: any;
};
export declare function parseHistoryCommand(command: HistoryCommand): {
    undo: (automaton: AutomatonWithGUI) => void;
    redo: (automaton: AutomatonWithGUI) => void;
};
export declare function performUndo(automaton: AutomatonWithGUI, commands: HistoryCommand[]): void;
export declare function performRedo(automaton: AutomatonWithGUI, commands: HistoryCommand[]): void;
