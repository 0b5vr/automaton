type Keyable = number | string | symbol;

export function objectMapSize<K extends Keyable, T>( object: Record<K, T> ): number {
  return Object.keys( object ).length;
}

export function objectMapValues<K extends Keyable, T>( object: Record<K, T> ): T[] {
  return Object.values( object );
}

export function objectMapHas<K extends Keyable, T>( object: Record<K, T>, key: K ): boolean {
  return object[ key ] != null;
}
