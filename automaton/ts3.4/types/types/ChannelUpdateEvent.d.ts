/**
 * Represent an event that is emitted by [[Channel.update]].
 */
export interface ChannelUpdateEvent {
    /**
     * Current time.
     */
    time: number;
    /**
     * Current elapsed time since the item started.
     */
    elapsed: number;
    /**
     * Beginning time of the current item.
     */
    begin: number;
    /**
     * Ending time of the current item.
     */
    end: number;
    /**
     * Length of the current item.
     */
    length: number;
    /**
     * Current value of the channel.
     */
    value: number;
    /**
     * `true` if the update was the first call of the item.
     */
    init?: true;
    /**
     * `true` if the update was the last call of the item.
     */
    uninit?: true;
    /**
     * The progress of the item.
     */
    progress: number;
}
