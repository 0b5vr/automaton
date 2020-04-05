export function arraySetDelete<T>( array: Array<T>, value: T ): void {
  const index = array.indexOf( value );
  if ( index === -1 ) { return; }
  array.splice( index, 1 );
}

export function arraySetHas<T>( array: Array<T>, value: T ): boolean {
  return array.indexOf( value ) !== -1;
}

export function arraySetUnion<T>( a: Array<T>, b: Array<T> ): Array<T> {
  const out = [ ...a ];
  b.forEach( ( v ) => {
    if ( !arraySetHas( out, v ) ) {
      out.push( v );
    }
  } );
  return out;
}

export function arraySetDiff<T>( from: Array<T>, diff: Array<T> ): Array<T> {
  const out = [ ...from ];
  diff.forEach( ( v ) => {
    arraySetDelete( out, v );
  } );
  return out;
}
