import { ReactNode } from 'react';
export interface ScrollableProps {
    className?: string;
    children?: ReactNode;
    barPosition?: 'left' | 'right' | 'none';
}
declare const Scrollable: (props: ScrollableProps) => JSX.Element;
export { Scrollable };
