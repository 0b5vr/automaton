// yoinked from https://github.com/FMS-Cat/experimental-npm/blob/f3564cef096ecc7f48879f066862e212308245b5/src/algorithm/binarySearch.ts

/**
 * Look for an index from a sorted list using the binary search.
 * @param array A sorted array
 * @param compare Make this function return `false` if the value looking forward is smaller (or same) than given element, `true` if the value looking forward is bigger than given element.
 * @returns An index found
 */
export function binarySearch<T>( array: ArrayLike<T>, element: T ): number;
export function binarySearch<T>( array: ArrayLike<T>, compare: ( element: T ) => boolean ): number;
export function binarySearch<T>(
  array: ArrayLike<T>,
  elementOrCompare: T | ( ( element: T ) => boolean ),
): number {
  if ( typeof elementOrCompare !== 'function' ) {
    return binarySearch( array, ( element ) => ( element <= elementOrCompare ) );
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
