import React from 'react';
export interface ChannelListEntryProps {
    className?: string;
    name: string;
    refScrollTop: React.RefObject<number>;
}
declare const ChannelListEntry: (props: ChannelListEntryProps) => JSX.Element;
export { ChannelListEntry };
