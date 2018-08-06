let Xorshift = class {
  constructor( _seed ) {
    this.set( _seed );
  }

  gen( _seed ) {
    if ( _seed ) { this.set( _seed ); }
    this.seed = this.seed ^ ( this.seed << 13 );
    this.seed = this.seed ^ ( this.seed >>> 17 );
    this.seed = this.seed ^ ( this.seed << 5 );
    return this.seed / Math.pow( 2, 32 ) + 0.5;
  }

  set( _seed ) {
    this.seed = _seed || this.seed || 1;
  }
};

module.exports = Xorshift;
