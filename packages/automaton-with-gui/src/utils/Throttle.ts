/**
 * @example
 * ```ts
 * const throttle = new Throttle();
 *
 * throttle.do( () => doExpensivePut() );
 * throttle.do( () => doExpensivePut() );
 * throttle.do( () => doExpensivePut() );
 * ```
 */
export class Throttle<T = void> {
  /**
   * Rate, in ms.
   */
  public rate;

  private __currentPromise: Promise<T> | null = null;
  private __latest: ( () => T ) | null = null;

  private __lastTime = 0;

  /**
   * @param rate Rate, in ms.
   */
  public constructor( rate?: number ) {
    this.rate = rate ?? 100;
  }

  public do( func: () => T ): Promise<T> {
    this.__latest = func;

    const now = Date.now();
    const untilNext = Math.max( 0, this.__lastTime + this.rate - now );

    if ( !this.__currentPromise ) {
      this.__currentPromise = new Promise( ( resolve ) => {
        setTimeout( () => {
          this.__lastTime = Date.now();
          resolve( this.__latest!() );
          this.__currentPromise = null;
        }, untilNext );
      } );
    }

    return this.__currentPromise;
  }
}
