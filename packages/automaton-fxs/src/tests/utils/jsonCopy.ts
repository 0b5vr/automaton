export function jsonCopy<T>( fuck: T ): T {
  return JSON.parse( JSON.stringify( fuck ) );
}
