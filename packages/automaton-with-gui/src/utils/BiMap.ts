export class BiMap<TKey, TValue> extends Map<TKey, TValue> {
  private readonly __secondary = new Map<TValue, TKey>();

  public constructor( map: Map<TKey, TValue> ) {
    super( map );

    for ( const [ key, value ] of map.entries() ) {
      this.__secondary.set( value, key );
    }
  }

  public set( key: TKey, value: TValue ): this {
    super.set( key, value );
    this.__secondary?.set( value, key ); // might be called in its super constructor
    return this;
  }

  public delete( key: TKey ): boolean {
    const value = this.get( key );
    const result = super.delete( key );
    if ( value != null ) { this.__secondary.delete( value ); }
    return result;
  }

  public clear(): this {
    super.clear();
    this.__secondary.clear();
    return this;
  }

  public getFromValue( value: TValue ): TKey | undefined {
    return this.__secondary.get( value );
  }
}
