export declare function reorderArray<T extends Array<any>>(array: T, index: number, length?: number, hook?: (event: {
    index: number;
    length: number;
    newIndex: number;
}) => number): (index: number) => T;
