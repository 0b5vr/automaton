import React from 'react';
export interface DopeSheetRectSelectState {
    isSelecting: boolean;
    channels: string[];
    t0: number;
    t1: number;
}
export interface DopeSheetProps {
    className?: string;
    intersectionRoot: HTMLElement | null;
    refScrollTop: React.RefObject<number>;
}
declare const DopeSheet: ({ className, refScrollTop, intersectionRoot }: DopeSheetProps) => JSX.Element;
export { DopeSheet };
