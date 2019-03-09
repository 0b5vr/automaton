export function jsonCopy<T>( data: T ): T {
  return JSON.parse( JSON.stringify( data ) );
}
