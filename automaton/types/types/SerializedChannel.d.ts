import type { SerializedChannelItem } from './SerializedChannelItem';
/**
 * Represents a serialized channel.
 */
export interface SerializedChannel {
    /**
     *List of channel items.
     */
    items?: SerializedChannelItem[];
}
