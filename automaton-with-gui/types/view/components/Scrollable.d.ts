import { ReactNode } from 'react';
export interface ScrollableProps {
    className?: string;
    children?: ReactNode;
    barPosition?: 'left' | 'right' | 'none';
    onScroll?: (scroll: number) => void;
}
declare const Scrollable: (props: ScrollableProps) => JSX.Element;
export { Scrollable };
