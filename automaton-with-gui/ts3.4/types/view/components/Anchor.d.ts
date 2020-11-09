import React from 'react';
export interface AnchorProps {
    className?: string;
    href: string;
    children: React.ReactNode;
}
declare const Anchor: ({ className, href, children }: AnchorProps) => JSX.Element;
export { Anchor };
