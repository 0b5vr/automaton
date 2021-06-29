/**
 * Look for an index from a sorted list using binary search.
 *
 * If you don't provide a compare function, it will look for **the first same value** it can find.
 * If it cannot find an exactly matching value, it can return N where the length of given array is N.
 *
 * @param array A sorted array
 * @param compare Make this function return `false` if you want to point right side of given element, `true` if you want to point left side of given element.
 * @returns An index found
 */
export declare function binarySearch<T>(array: ArrayLike<T>, element: T): number;
export declare function binarySearch<T>(array: ArrayLike<T>, compare: (element: T) => boolean): number;
