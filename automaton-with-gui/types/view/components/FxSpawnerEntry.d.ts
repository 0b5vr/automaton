import React from 'react';
export declare const Id: import("styled-components").StyledComponent<"div", any, {}, never>;
export declare const Name: import("styled-components").StyledComponent<"div", any, {}, never>;
export declare const Root: import("styled-components").StyledComponent<"div", any, {
    isSelected?: boolean | undefined;
}, never>;
export interface FxSpawnerEntryProps {
    className?: string;
    name?: string;
    id: string;
    description?: string;
    isSelected?: boolean;
    onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}
declare const FxSpawnerEntry: (props: FxSpawnerEntryProps) => JSX.Element;
export { FxSpawnerEntry };
