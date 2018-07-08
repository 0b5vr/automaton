import xorshift from './xorshift';

let int = ( _a, _b, _k ) => {
  let smooth = _k * _k * ( 3.0 - 2.0 * _k );
  return _a + ( _b - _a ) * smooth;
};

let genNoise = ( _params ) => {
  let params = typeof _params === 'object' ? _params : {
    length: 32,
    recursion: 6,
    freq: 1.0,
    reso: 4,
    seed: 0
  };
  params.length = parseInt( params.length );
  params.recursion = parseInt( params.recursion );
  params.reso = parseInt( params.reso );
  params.seed = parseInt( params.seed );

  let table = [ 0 ];
  xorshift( params.seed );
  for ( let i = 1; i < params.reso; i ++ ) {
    table[ i ] = xorshift() * 2.0 - 1.0;
  }
  table.push( table[ 0 ] );

  let arr = [];
  for ( let i = 0; i < params.length; i ++ ) {
    arr[ i ] = 0.0;
    let prog = i / params.length;
    for ( let j = 0; j < params.recursion; j ++ ) {
      let index = ( prog * params.freq * params.reso * Math.pow( 2.0, j ) ) % params.reso;
      let indexi = Math.floor( index );
      let indexf = index % 1.0;
      let amp = Math.pow( 2.0, -j - 1.0 );

      arr[ i ] += amp * ( int( table[ indexi ], table[ indexi + 1 ], indexf ) );
    }
  }

  return arr;
};

export default genNoise;