import type { SerializedChannelItem } from '@fms-cat/automaton';
/**
 * Interface of a serialized channel.
 */
export interface V3SerializedChannel {
    /**
     *List of channel items.
     */
    items?: SerializedChannelItem[];
}
