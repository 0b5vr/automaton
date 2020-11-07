export function combineArraysUnique<T>( ...arrays: Array<Array<T>> ): Array<T> {
  const known = new Set<T>();
  arrays.forEach( ( array ) => {
    array.forEach( ( el ) => {
      if ( !known.has( el ) ) {
        known.add( el );
      }
    } );
  } );
  return [ ...known ];
}
