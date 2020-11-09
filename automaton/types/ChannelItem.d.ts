import { Automaton, Curve } from '.';
import type { SerializedChannelItem } from './types/SerializedChannelItem';
/**
 * Represents an item of a [[Channel]].
 */
export declare class ChannelItem {
    /**
     * The parent automaton.
     */
    protected readonly __automaton: Automaton;
    /**
     * Beginning timepoint of the item.
     */
    time: number;
    /**
     * Length of the item.
     */
    length: number;
    /**
     * Value of the item.
     */
    value: number;
    /**
     * Whether reset channels value to zero at the end of this item or not.
     */
    reset?: boolean;
    /**
     * This will only make sense when {@link curve} is specified.
     * The time offset of the item.
     */
    offset: number;
    /**
     * This will only make sense when {@link curve} is specified.
     * The speed rate of the item.
     */
    speed: number;
    /**
     * This will only make sense when {@link curve} is specified.
     * The scale of the item in the value axis.
     */
    amp: number;
    /**
     * The curve of the item.
     */
    curve?: Curve;
    /**
     * Ending timepoint of the item.
     */
    get end(): number;
    /**
     * Constructor of the [[ChannelItem]].
     * @param automaton Parent automaton
     * @param data Data of the item
     */
    constructor(automaton: Automaton, data: SerializedChannelItem);
    getValue(time: number): number;
    /**
     * Deserialize a serialized data of item from [[SerializedChannelItem]].
     * @param data A serialized item.
     */
    deserialize(data: SerializedChannelItem): void;
}
