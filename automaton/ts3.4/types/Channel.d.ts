import { Automaton } from './Automaton';
import { ChannelItem } from './ChannelItem';
import { ChannelUpdateEvent } from './types/ChannelUpdateEvent';
import { SerializedChannel } from './types/SerializedChannel';
/**
 * It represents a channel of Automaton.
 */
export declare class Channel {
    /**
     * The parent automaton.
     */
    protected __automaton: Automaton;
    /**
     * List of channel items.
     */
    protected __items: ChannelItem[];
    /**
     * A cache of last calculated value.
     */
    protected __value: number;
    /**
     * The time that was used for the calculation of [[__lastValue]].
     */
    protected __time: number;
    /**
     * The index of [[__items]] it should evaluate next.
     */
    protected __head: number;
    /**
     * An array of listeners.
     */
    protected __listeners: Array<(event: ChannelUpdateEvent) => void>;
    /**
     * Constructor of the [[Channel]].
     * @param automaton Parent automaton
     * @param data Data of the channel
     */
    constructor(automaton: Automaton, data: SerializedChannel);
    /*
    * A cache of last calculated value.
    */
    readonly currentValue: number;
    /*
    * The time that was used for the calculation of [[__lastValue]].
    */
    readonly currentTime: number;
    /**
     * Load a serialized data of a channel.
     * @param data Data of a channel
     */
    deserialize(data: SerializedChannel): void;
    /**
     * Reset the internal states.
     * Call this method when you seek the time.
     */
    reset(): void;
    /**
     * Add a new listener that receives a [[ChannelUpdateEvent]] when an update is happened.
     * @param listener A subscribing listener
     */
    subscribe(listener: (event: ChannelUpdateEvent) => void): void;
    /**
     * Return the value of specified time point.
     * @param time Time at the point you want to grab the value.
     * @returns Result value
     */
    getValue(time: number): number;
    /**
     * This method is intended to be used by [[Automaton.update]].
     * @param time The current time of the parent [[Automaton]]
     * @returns whether the value has been changed or not
     */
    update(time: number): void;
}
