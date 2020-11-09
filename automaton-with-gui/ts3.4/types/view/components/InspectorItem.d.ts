import { ReactNode } from 'react';
export interface InspectorItemProps {
    className?: string;
    children?: ReactNode;
    name?: string;
    description?: string;
}
declare const InspectorItem: ({ className, children, name, description }: InspectorItemProps) => JSX.Element;
export { InspectorItem };
