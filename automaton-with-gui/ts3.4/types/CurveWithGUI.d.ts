import { AutomatonWithGUI } from './AutomatonWithGUI';
import { BezierNode, Curve, FxSection, SerializedCurve } from '@fms-cat/automaton';
import { EventEmittable } from './mixins/EventEmittable';
import { SerializableWithID } from './types/SerializableWithID';
import { WithStatus } from './types/Status';
import { WithBypass } from './types/WithBypass';
import { WithID } from './types/WithID';
/**
 * Handles of a new node will be created in this length.
 */
export declare const CURVE_DEFAULT_HANDLE_LENGTH = 0.1;
export declare const CURVE_FX_ROW_MAX = 5;
/**
 * Represents "Status code" of a status of the {@link Curve}.
 */
export declare enum CurveStatusCode {
    NOT_USED = 0,
    NAN_DETECTED = 1
}
/**
 * It represents a channel of Automaton.
 * It has even more pretty APIs than raw {@link Curve} yay
 * @param automaton Parent automaton
 * @param data Data of the channel
 */
export declare class CurveWithGUI extends Curve {
    /**
     * Default data of a curve.
     */
    static readonly DEFAULT_DATA: SerializedCurve;
    /**
     * The parent automaton.
     */
    protected __automaton: AutomatonWithGUI;
    /**
     * {@link __values} but without fxs.
     */
    protected __valuesWithoutFxs: Float32Array;
    /**
     * List of bezier nodes.
     */
    protected __nodes: Array<BezierNode & WithID>;
    /**
     * List of fx sections.
     */
    protected __fxs: Array<FxSection & WithBypass & WithID>;
    /**
     * I'm crying
     */
    private __userCount;
    /*
    * List of bezier nodes.
    */
    readonly nodes: Array<BezierNode & WithID>;
    /*
    * List of fx sections.
    */
    readonly fxs: Array<FxSection & WithBypass & WithID>;
    /*
    * Whether the curve is being used in somewhere or not.
    */
    readonly isUsed: boolean;
    constructor(automaton: AutomatonWithGUI, data?: SerializedCurve & Partial<WithID>);
    /**
     * Load a curve data.
     * @param data Data of curve
     */
    deserialize(data: SerializedCurve): void;
    /**
     * Precalculate value of samples.
     */
    precalc(): void;
    /**
     * Update the preview time.
     * Do not call this function if you're not a [[ChannelItemCurveWithGUI]].
     * @param time Time
     * @param value Value
     */
    setPreviewTime(time: number): void;
    /**
     * I'm crying
     * Intended to be used in {@link ChannelWithGUI} via {@link ChannelItemWithGUI#curve}.
     */
    incrementUserCount(): void;
    /**
     * I'm crying
     * Intended to be used in {@link ChannelWithGUI} via {@link ChannelItemWithGUI#curve}.
     */
    decrementUserCount(): void;
    /**
     * Return how many node the curve currently have.
     * @returns Nodes count
     */
    getNumNode(): number;
    /**
     * Serialize its current state.
     * @returns Serialized state
     */
    serialize(): SerializedCurve;
    /**
     * Get the nth node.
     * @param index Index of the node
     * @returns Data of the node
     */
    getNodeByIndex(index: number): BezierNode & WithID;
    /**
     * Dump data of a node.
     * @param id Id of the node you want to dump
     * @returns Data of the node
     */
    getNode(id: string): BezierNode & WithID;
    /**
     * Dump data of a previous node from a specified node.
     * It might return `null` when the specified node is the first node.
     * @param id Id of the node you want to refer
     * @returns Data of the previous node
     */
    getPreviousNode(id: string): (BezierNode & WithID) | null;
    /**
     * Dump data of a next node from a specified node.
     * It might return `null` when the specified node is the last node.
     * @param id Id of the node you want to refer
     * @returns Data of the next node
     */
    getNextNode(id: string): (BezierNode & WithID) | null;
    /**
     * Create a node.
     * @param time Time of new node
     * @param value Value of new node
     * @returns Data of the node
     */
    createNode(time: number, value: number): BezierNode & WithID;
    /**
     * Create a node from dumped data.
     * @param node Dumped bezier node object
     * @returns Data of the node
     */
    createNodeFromData(node: BezierNode & WithID): BezierNode & WithID;
    /**
     * Check whether the node is the first node or not.
     * @param id Id of the node you want to check
     */
    isFirstNode(id: string): boolean;
    /**
     * Check whether the node is the last node or not.
     * @param id Id of the node you want to check
     */
    isLastNode(id: string): boolean;
    /**
     * Remove a node.
     * @param id Id of the node you want to remove
     */
    removeNode(id: string): void;
    /**
     * Move a node in the time axis.
     * @param id Id of the node you want to move
     * @param time Time
     */
    moveNodeTime(id: string, time: number): void;
    /**
     * Move a node in the value axis.
     * @param id Id of the node you want to move
     * @param value Value
     */
    moveNodeValue(id: string, value: number): void;
    /**
     * Move a handle of a node in the time axis.
     * @param id Id of the node you want to operate
     * @param dir Which handle?
     * @param time Time
     */
    moveHandleTime(id: string, dir: 'in' | 'out', time: number): void;
    /**
     * Move a handle of a node in the value axis.
     * @param id Id of the node you want to operate
     * @param dir Which handle?
     * @param value Value
     */
    moveHandleValue(id: string, dir: 'in' | 'out', value: number): void;
    /**
     * Reset a handle of a node.
     * @param id Id of the node you want to operate
     * @param dir Which handle?
     */
    resetHandle(id: string, dir: 'in' | 'out'): void;
    /**
     * Get the nth fx section.
     * @param index Index of the fx section
     * @returns Data of the fx section
     */
    getFxByIndex(index: number): FxSection & WithBypass & WithID;
    /**
     * Dump data of a fx section.
     * @param id Id of a fx section you want to dump
     * @returns Data of the fx
     */
    getFx(id: string): FxSection & WithBypass & WithID;
    /**
     * Create a fx.
     * If it couldn't create an fx, it will return `null` instead.
     * @param time Beginning time of new fx
     * @param length Length of new fx
     * @param def Definition id (kind) of new fx
     * @returns Id of the new fx
     */
    createFx(time: number, length: number, def: string): (FxSection & WithBypass & WithID) | null;
    /**
     * Create a fx from dumped data.
     * If it couldn't create an fx, it will return empty string instead.
     * @param fx Dumped fx data
     * @returns Id of the new fx
     */
    createFxFromData(fx: FxSection & WithBypass & WithID): (FxSection & WithBypass & WithID) | null;
    /**
     * Remove a fx.
     * @param id Id of the fx you want to remove
     */
    removeFx(id: string): void;
    /**
     * Move a fx.
     * @param id Id of the fx you want to move
     * @param time Beginning time
     */
    moveFx(id: string, time: number): void;
    /**
     * Change row of a fx.
     * @param id Id of the fx you want to move
     * @param row Row
     */
    changeFxRow(id: string, row: number): void;
    /**
     * Bypass or unbypass a fx.
     * @param id Id of the fx you want to change
     * @param bypass If true, fx will be bypassed
     */
    bypassFx(id: string, bypass: boolean): void;
    /**
     * Change a param of a fx.
     * @param id Id of the fx you want to change
     * @param name Name of the param you want to change
     * @param value Your desired value
     */
    changeFxParam(id: string, name: string, value: any): void;
    /**
     * Move a fx --force.
     * Best for undo-redo operation. probably.
     * @param id Id of the fx you want to move
     * @param time Beginning time
     * @param row Row
     */
    forceMoveFx(id: string, time: number, row: number): void;
    /**
     * Resize a fx.
     * @param id Index of the fx you want to resize
     * @param length Length
     */
    resizeFx(id: string, length: number): void;
    /**
     * Resize a fx by left side of the end.
     * It's very GUI dev friendly method. yeah.
     * @param id Index of the fx you want to resize
     * @param length Length
     */
    resizeFxByLeft(id: string, length: number): void;
    /**
     * Same as {@link getValue}, but without fxs.
     * This is an exclusive feature for WithGUI variant.
     * @param time Time at the point you want to grab the value.
     * @returns Result value
     */
    getValueWithoutFxs(time: number): number;
    /**
     * Serialize its nodes.
     * @returns Serialized nodes
     */
    private __serializeNodes;
    /**
     * Serialize its fxs.
     * @returns Serialized fxs
     */
    private __serializeFxs;
    /**
     * Watch for status changes.
     * Execute given procedure immediately.
     * If the procedure changes its status, emit an event.
     * @param procedure A procedure that might change its status
     */
    private __watchStatus;
    /**
     * Sort nodes by time.
     */
    private __sortNodes;
    /**
     * Search for node that has given id then return index of it.
     * If it couldn't find the node, it will throw an error instead.
     * @param id Id of node you want to grab
     * @returns The index of the node
     */
    private __getNodeIndexById;
    /**
     * Sort fxs by time.
     */
    private __sortFxs;
    /**
     * Search for fx section that has given id then return index of it.
     * If it couldn't find the section, it will throw an error instead.
     * @param id Id of section you want to grab
     * @returns The index of the section
     */
    private __getFxIndexById;
    /**
     * Search for vacance fx row for given time and length.
     * @param time Beginning time of fx
     * @param length Length of fx
     * @param row If given, rows lower than this value will not be searched.
     * @returns Minimal free fx row
     */
    private __getFreeRow;
}
export interface CurveWithGUIEvents {
    createNode: {
        id: string;
        node: BezierNode & WithID;
    };
    updateNode: {
        id: string;
        node: BezierNode & WithID;
    };
    removeNode: {
        id: string;
    };
    createFx: {
        id: string;
        fx: FxSection & WithBypass & WithID;
    };
    updateFx: {
        id: string;
        fx: FxSection & WithBypass & WithID;
    };
    removeFx: {
        id: string;
    };
    previewTime: {
        time: number;
    };
    precalc: void;
    updateStatus: void;
    changeLength: {
        length: number;
    };
}
export interface CurveWithGUI extends SerializableWithID<SerializedCurve> {
}
export interface CurveWithGUI extends EventEmittable<CurveWithGUIEvents> {
}
export interface CurveWithGUI extends WithStatus<CurveStatusCode> {
}
