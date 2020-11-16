export function reorderArray<T extends Array<any>>(
  array: T,
  index: number,
  length = 1,
  hook?: ( event: {
    index: number;
    length: number;
    newIndex: number;
  } ) => number,
): ( index: number ) => T {
  const arrayLength = array.length;
  index = Math.min( Math.max( index, 0 ), arrayLength - 1 );
  length = Math.min( length, arrayLength - index );

  return ( newIndex: number ): T => {
    if ( hook ) {
      newIndex = hook( { index, length, newIndex } ) ?? newIndex;
    }

    newIndex = Math.min( Math.max( newIndex, 0 ), arrayLength - length );

    const inserting = array.splice( index, length );
    array.splice( newIndex, 0, ...inserting );

    index = newIndex;
    return array;
  };
}
