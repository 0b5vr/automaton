import { Throttle } from './utils/Throttle';

export class ThrottledJSONStorage<T> {
  public readonly key: string;

  /**
   * Do not write to this directly.
   * Use {@link set} instead.
   */
  public readonly values: T;

  private __throttle: Throttle;

  /**
   * @param key The local storage key
   * @param throttleRate Throttle rate, in ms
   */
  public constructor( key: string, throttleRate?: number ) {
    this.key = key;

    const valuesStr = localStorage.getItem( key );
    this.values = valuesStr != null ? JSON.parse( valuesStr ) : {};

    this.__throttle = new Throttle( throttleRate );
  }

  public get<TKey extends keyof T>( key: TKey ): T[ TKey ] | undefined {
    return this.values[ key ];
  }

  public set<TKey extends keyof T>( key: TKey, value: T[ TKey ] ): void {
    this.values[ key ] = value;
    this.__throttle.do( () => this.__write() );
  }

  private __write(): void {
    const value = JSON.stringify( this.values );
    localStorage.setItem( this.key, value );
  }
}
