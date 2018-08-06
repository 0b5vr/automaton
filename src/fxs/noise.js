import Xorshift from './modules/xorshift';

const TAU = Math.PI * 2.0;

const smoothstep = ( _a, _b, _k ) => {
  const smooth = _k * _k * ( 3.0 - 2.0 * _k );
  return _a + ( _b - _a ) * smooth;
};

const genNoise = ( _params ) => {
  const params = typeof _params === 'object' ? _params : {
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

  const table = [ 0 ];
  const xorshift = new Xorshift();
  xorshift.gen( params.seed );
  for ( let i = 1; i < params.reso; i ++ ) {
    table[ i ] = xorshift.gen() * 2.0 - 1.0;
  }
  table.push( table[ 0 ] );

  const arr = [];
  for ( let i = 0; i < params.length; i ++ ) {
    arr[ i ] = 0.0;
    const prog = i / params.length;
    for ( let j = 0; j < params.recursion; j ++ ) {
      const index = ( prog * params.freq * params.reso * Math.pow( 2.0, j ) ) % params.reso;
      const indexi = Math.floor( index );
      const indexf = index % 1.0;
      const amp = Math.pow( 2.0, -j - 1.0 );

      arr[ i ] += amp * ( smoothstep( table[ indexi ], table[ indexi + 1 ], indexf ) );
    }
  }

  return arr;
};

export default {
  name: 'Fractal Noise',
  params: {
    recursion: { name: 'Recursion', type: 'int', default: 4, min: 0 },
    freq: { name: 'Frequency', type: 'float', default: 1.0, min: 0.0 },
    reso: { name: 'Resolution', type: 'float', default: 8.0, min: 0.0 },
    seed: { name: 'Seed', type: 'int', default: 1, min: 0 },
    amp: { name: 'Amp', type: 'float', default: 0.2 }
  },
  func( context ) {
    if ( !context.noise ) {
      context.noise = genNoise( {
        length: context.i1 - context.i0,
        recursion: context.params.recursion,
        reso: context.params.reso,
        freq: context.params.freq,
        seed: context.params.seed
      } );
    }

    const v = context.getValue( context.t );
    const i = context.i - context.i0;
    return v + context.params.amp * context.noise[ i ];
  }
};