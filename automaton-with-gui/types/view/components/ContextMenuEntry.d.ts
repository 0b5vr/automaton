import React from 'react';
interface ContextMenuEntryProps {
    className?: string;
    name: string;
    description?: string;
    onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}
declare const ContextMenuEntry: (props: ContextMenuEntryProps) => JSX.Element;
export { ContextMenuEntry };
