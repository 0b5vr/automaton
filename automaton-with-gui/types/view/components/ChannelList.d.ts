import React from 'react';
export interface ChannelListProps {
    className?: string;
    refScrollTop: React.RefObject<number>;
}
declare const ChannelList: ({ className, refScrollTop }: ChannelListProps) => JSX.Element;
export { ChannelList };
