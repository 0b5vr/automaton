import { SerializedChannelItem } from './SerializedChannelItem';
/**
 * Interface of a serialized channel.
 */
export interface SerializedChannel {
    /**
     *List of channel items.
     */
    items: Array<SerializedChannelItem>;
}
