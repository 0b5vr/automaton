import { AutomatonWithGUI } from './AutomatonWithGUI';
import { Channel, SerializedChannel } from '@fms-cat/automaton';
import { ChannelItemWithGUI } from './ChannelItemWithGUI';
import { EventEmittable } from './mixins/EventEmittable';
import { Serializable } from './types/Serializable';
import { WithStatus } from './types/Status';
import { StateChannelItem } from './types/StateChannelItem';
/**
 * Represents "Status code" of a status of the {@link Channel}.
 */
export declare enum ChannelStatusCode {
    NOT_USED = 0
}
/**
 * It represents a channel of Automaton.
 * It has even more pretty APIs than raw {@link Channel} yay
 * It has even more pretty APIs yay
 * @param automaton Parent automaton
 * @param data Data of the channel
 */
export declare class ChannelWithGUI extends Channel implements Serializable<SerializedChannel> {
    /**
     * The parent automaton.
     */
    protected __automaton: AutomatonWithGUI;
    /**
     * List of channel items.
     */
    protected __items: Array<ChannelItemWithGUI>;
    /**
     * Whether it should reset itself in next update call or not.
     */
    private __shouldReset;
    /*
    * List of fx sections.
    */
    readonly items: Array<ChannelItemWithGUI>;
    /*
    * Its length i.e. the end of the last item.
    */
    readonly length: number;
    constructor(automaton: AutomatonWithGUI, data?: SerializedChannel);
    /**
     * Load a channel data.
     * @param data Data of channel
     */
    deserialize(data: SerializedChannel): void;
    /**
     * Reset the internal states.
     * Call this method when you seek the time.
     */
    reset(): void;
    /**
     * Mark this channel as should be reset in next update call.
     * Almost same as {@link update}, but not instant.
     */
    cueReset(): void;
    /**
     * If you want to grab a value from GUI for some reasons, use this.
     * This supresses updating the preview value for curves.
     * @param time Time at the point you want to grab the value.
     * @returns Result value
     */
    getValueFromGUI(time: number): number;
    /**
     * This method is intended to be used by [[Automaton.update]].
     * @param time The current time of the parent [[Automaton]]
     */
    update(time: number): void;
    /**
     * Mark this channel as used.
     */
    markAsUsed(): void;
    /**
     * Return how many items the channel currently have.
     * @returns Items count
     */
    getNumItems(): number;
    /**
     * Serialize its current state.
     * @returns Serialized state
     */
    serialize(): SerializedChannel;
    /**
     * Get the nth item.
     * @param index Index of the item
     * @returns Data of the item
     */
    getItemByIndex(index: number): StateChannelItem;
    /**
     * Dump data of an item.
     * @param id Id of the node you want to dump
     * @returns Data of the node
     */
    getItem(id: string): StateChannelItem;
    /**
     * [[getItem]], but can return null when it cannot find the item.
     * @param id Id of the node you want to dump
     * @returns Data of the node
     */
    tryGetItem(id: string): (StateChannelItem) | null;
    /**
     * Check whether the item is the last item or not.
     * @param id Id of the item you want to check
     */
    isLastItem(id: string): boolean;
    /**
     * Duplicate an item.
     * @param time The timepoint you want to add
     * @param item The item you want to duplicate
     * @returns Data of created item
     */
    duplicateItem(time: number, item: StateChannelItem): StateChannelItem;
    /**
     * "Repeat" (duplicate) the given item.
     * @param id The item you want to repeat
     * @returns Data of created item
     */
    repeatItem(id: string): StateChannelItem;
    /**
     * Create a constant item.
     * @param time The timepoint you want to add
     * @returns Data of the item
     */
    createItemConstant(time: number): StateChannelItem;
    /**
     * Create a curve item.
     * @param curveId The curve id you want to add
     * @param time The timepoint you want to add
     * @returns Data of the item
     */
    createItemCurve(curveId: string, time: number): StateChannelItem;
    /**
     * Create an item from dumped data.
     * @param item Dumped channel item object
     * @returns Data of the item
     */
    createItemFromData(data: StateChannelItem): StateChannelItem;
    /**
     * Remove an item.
     * @param id Id of the item you want to remove
     */
    removeItem(id: string): void;
    /**
     * Move an item.
     * @param id Id of the item you want to move
     * @param time Time
     */
    moveItem(id: string, time: number): void;
    /**
     * Move an item --force.
     * Best for undo-redo operation. probably.
     * @param id Id of the item you want to move
     * @param time Beginning time
     */
    forceMoveItem(id: string, time: number): void;
    /**
     * Resize an item.
     * @param id Index of the item you want to resize
     * @param length Length
     * @param stretch Wheter it should stretch the item or not
     */
    resizeItem(id: string, length: number, stretch?: boolean): void;
    /**
     * Resize an item by left side of the end.
     * It's very GUI dev friendly method. yeah.
     * @param id Index of the item you want to resize
     * @param length Length
     * @param stretch Wheter it should stretch the item or not
     */
    resizeItemByLeft(id: string, length: number, stretch?: boolean): void;
    /**
     * Change the value of an item.
     * @param id Id of the item you want to change
     * @param value Your desired value
     */
    changeItemValue(id: string, value: number): void;
    /**
     * Change the reset of an item.
     * @param id Id of the item you want to change
     * @param reset Reset
     */
    changeItemReset(id: string, reset: boolean): void;
    /**
     * Change the speed and offset of a curve item.
     * @param id Id of the item you want to change
     * @param speed Your desired speed
     * @param offset Your desired offset
     */
    changeCurveSpeedAndOffset(id: string, speed: number, offset: number): void;
    /**
     * Change the amp a curve item.
     * @param id Id of the item you want to change
     * @param amp Your desired amp
     */
    changeCurveAmp(id: string, amp: number): void;
    /**
     * Serialize its items.
     * @returns Serialized items
     */
    private __serializeItems;
    /**
     * Watch for status changes.
     * Execute given procedure immediately.
     * If the procedure changes its status, emit an event.
     * @param procedure A procedure that might change its status
     */
    private __watchStatus;
    /**
     * [[__getItemIndexById]], but can return -1 when it cannot find the item.
     */
    private __tryGetItemIndexById;
    /**
     * Search for item that has given id then return index of it.
     * If it couldn't find the item, it will throw an error instead.
     * @param id Id of item you want to grab
     * @returns The index of the item
     */
    private __getItemIndexById;
    /**
     * Sort items by time.
     */
    private __sortItems;
}
export interface ChannelWithGUIEvents {
    createItem: {
        id: string;
        item: StateChannelItem;
    };
    updateItem: {
        id: string;
        item: StateChannelItem;
    };
    removeItem: {
        id: string;
    };
    changeValue: {
        value: number;
    };
    reset: void;
    updateStatus: void;
    changeLength: {
        length: number;
    };
}
export interface ChannelWithGUI extends EventEmittable<ChannelWithGUIEvents> {
}
export interface ChannelWithGUI extends WithStatus<ChannelStatusCode> {
}
