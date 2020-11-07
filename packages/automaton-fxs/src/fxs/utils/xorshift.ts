export class Xorshift {
  private __seed: number = 1;

  public constructor( seed?: number ) {
    this.set( seed );
  }

  public gen( seed?: number ): number {
    if ( seed ) { this.set( seed ); }
    this.__seed = this.__seed ^ ( this.__seed << 13 );
    this.__seed = this.__seed ^ ( this.__seed >>> 17 );
    this.__seed = this.__seed ^ ( this.__seed << 5 );
    return this.__seed / Math.pow( 2, 32 ) + 0.5;
  }

  public set( seed: number = 1 ): void {
    this.__seed = seed;
  }
}

export default Xorshift;
