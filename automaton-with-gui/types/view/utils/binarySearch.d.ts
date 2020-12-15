/**
 * Look for an index from a sorted list using the binary search.
 * @param array A sorted array
 * @param compare Make this function return `false` if the value looking forward is smaller (or same) than given element, `true` if the value looking forward is bigger than given element.
 * @returns An index found
 */
export declare function binarySearch<T>(array: ArrayLike<T>, element: T): number;
export declare function binarySearch<T>(array: ArrayLike<T>, compare: (element: T) => boolean): number;
