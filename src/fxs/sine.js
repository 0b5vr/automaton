const TAU = Math.PI * 2.0;

export default {
  name: 'sineCurve',
  params: [
    { name: 'amp', type: 'float', default: 0.1 },
    { name: 'freq', type: 'float', default: 5.0 },
    { name: 'phase', type: 'float', default: 0.0, min: 0.0, max: 1.0 }
  ],
  function( array, params ) {
    for ( let i = 0; i < array.length; i ++ ) {
      let p = ( params.phase + params.freq / array.length * i ) % 1.0;
      array[ i ] = params.amp * Math.sin( p * TAU );
    }
    return array;
  }
};