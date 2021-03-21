// https://github.com/FMS-Cat/experimental-npm/blob/cf685846488ed3765e0abf68c8f6cd4916049cfa/src/algorithm/binarySearch.ts

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
export function binarySearch<T>( array: ArrayLike<T>, element: T ): number;
export function binarySearch<T>( array: ArrayLike<T>, compare: ( element: T ) => boolean ): number;
export function binarySearch<T>(
  array: ArrayLike<T>,
  elementOrCompare: T | ( ( element: T ) => boolean ),
): number {
  if ( typeof elementOrCompare !== 'function' ) {
    return binarySearch( array, ( element ) => ( element < elementOrCompare ) );
  }
  const compare = elementOrCompare as ( element: T ) => boolean;

  let start = 0;
  let end = array.length;

  while ( start < end ) {
    const center = ( start + end ) >> 1;
    const centerElement = array[ center ];

    const compareResult = compare( centerElement );

    if ( compareResult ) {
      start = center + 1;
    } else {
      end = center;
    }
  }

  return start;
}
