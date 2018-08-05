export default {
  name: 'Exponential Smoothing',
  params: {
    factor: { name: 'Factor', type: 'float', default: 10.0, min: 0.0 }
  },
  func( context ) {
    const t = context.t;
    const v = context.getValue( t );

    if ( typeof context.pos !== 'number' ) {
      context.pos = v;
    }

    const k = Math.exp( -context.dt * context.params.factor );
    context.pos = context.pos * k + v * ( 1.0 - k );
    return context.pos;
  }
};