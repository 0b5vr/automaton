import { BezierNode, BezierNodePlusID } from './types/BezierNode';
import { FxSection, FxSectionPlusID } from './types/FxSection';
import { AutomatonWithGUI } from './AutomatonWithGUI';
import { Param } from './Param';
import { SerializedParam } from './types/SerializedParam';
/**
 * Handles of a new node will be created in this length.
 */
export declare const PARAM_DEFAULT_HANDLE_LENGTH = 0.5;
export declare const PARAM_FX_ROW_MAX = 4;
/**
 * Represents "Status code" of a {@link ParamStatus}.
 */
export declare enum ParamStatusCode {
    OK = 0,
    NOT_USED = 1,
    NAN_DETECTED = 2
}
/**
 * Represents fatality of a {@link ParamStatus}.
 */
export declare enum ParamStatusLevel {
    OK = 0,
    INFO = 1,
    WARNING = 2,
    ERROR = 3
}
/**
 * Interface represents a status of a {@link Param}.
 * Status: info / warning / error...
 */
export interface ParamStatus {
    /**
     * Status code of the status.
     */
    code: ParamStatusCode;
    /**
     * Fatality of the status.
     */
    level: ParamStatusLevel;
    /**
     * Message of the status.
     */
    message?: string;
}
/**
 * It represents a param of Automaton.
 * It's `automaton.js` and `automaton.min.js` version.
 * It has even more pretty APIs yay
 * @param automaton Parent automaton
 * @param data Data of the param
 */
export declare class ParamWithGUI extends Param {
    /**
     * The parent automaton.
     */
    protected __automaton: AutomatonWithGUI;
    /**
     * List of bezier node.
     */
    protected __nodes: BezierNodePlusID[];
    /**
     * List of fx sections.
     */
    protected __fxs: FxSectionPlusID[];
    /**
     * List of status (warning / error).
     * The array is empty = you're cool
     */
    private __statusList;
    constructor(automaton: AutomatonWithGUI, data?: SerializedParam);
    /**
     * Its current status (warning / error).
     */
    readonly status: ParamStatus;
    /**
     * Load a param data.
     * @param data Data of param
     */
    load(data: SerializedParam): void;
    /**
     * Precalculate value of samples.
     */
    precalc(): void;
    /**
     * Mark this param as used.
     */
    markAsUsed(): void;
    /**
     * Return how many node the param currently have.
     * @returns Nodes count
     */
    getNumNode(): number;
    /**
     * Dump data of a node.
     * @param id Id of the node you want to dump
     * @returns Data of the node
     */
    dumpNode(id: string): BezierNodePlusID;
    /**
     * Dump data of nodes.
     * @returns Data of nodes
     */
    dumpNodes(): BezierNodePlusID[];
    /**
     * Dump data of nodes, without `$id`.
     * @returns Data of nodes
     */
    dumpNodesWithoutId(): BezierNode[];
    /**
     * Create a node.
     * @param time Time of new node
     * @param value Value of new node
     * @returns Id of the new node
     */
    createNode(time: number, value: number): string;
    /**
     * Create a node from dumped data.
     * @param node Dumped bezier node object
     * @returns Id of the new node
     */
    createNodeFromData(node: BezierNodePlusID): string;
    /**
     * Remove a node.
     * @param id Id of the node you want to remove
     */
    removeNode(id: string): void;
    /**
     * Move a node.
     * @param id Id of the node you want to move
     * @param time Time
     * @param value Value
     */
    moveNode(id: string, time: number, value: number): void;
    /**
     * Move a handle of a node.
     * @param id Id of the node you want to operate
     * @param isOut Input handle if false, output handle if true
     * @param time Time
     * @param value Value
     */
    moveHandle(id: string, isOut: boolean, time: number, value: number): void;
    /**
     * Reset a handle of a node.
     * @param id Id of the node you want to operate
     * @param isOut Input handle if false, output handle if true
     */
    resetHandle(id: string, isOut: boolean): void;
    /**
     * Dump data of a fx section.
     * @param id Id of a fx section you want to dump
     * @returns Data of the fx
     */
    dumpFx(id: string): FxSectionPlusID;
    /**
     * Dump data of fxs.
     * @returns Data of fxs
     */
    dumpFxs(): FxSectionPlusID[];
    /**
     * Dump data of fxs, without `$id`.
     * @returns Data of fxs
     */
    dumpFxsWithoutId(): FxSection[];
    /**
     * Create a fx.
     * If it couldn't create param, it will return `null` instead.
     * @param time Beginning time of new fx
     * @param length Length of new fx
     * @param def Definition id (kind) of new fx
     * @returns Id of the new fx
     */
    createFx(time: number, length: number, def: string): string | null;
    /**
     * Create a fx from dumped data.
     * If it couldn't create param, it will return empty string instead.
     * @param fx Dumped fx data
     * @returns Id of the new fx
     */
    createFxFromData(fx: FxSectionPlusID): string;
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
     * Call when you need to change automaton length.
     * This is very hardcore method. Should not be called by anywhere except {@link AutomatonWithGUI#setLength}.
     * @param length Desired length
     */
    changeLength(length: number): void;
    /**
     * Set a status.
     * @param bool Boolean whether the status is currently active or not
     * @param status The status
     */
    private __setStatus;
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
export default ParamWithGUI;
