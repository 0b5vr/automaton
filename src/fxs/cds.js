export default {
  name: 'Critically Damped Spring',
  params: {
    factor: { name: 'Factor', type: 'float', default: 100.0, min: 0.0 },
    ratio: { name: 'Ratio', type: 'float', default: 1.0 },
    preserve: { name: 'Preserve Velocity', type: 'boolean', default: false }
  },
  func( context ) {
    const t = context.t;
    const dt = context.dt;
    const v = context.getValue( t );
    const k = context.params.factor;

    if ( typeof context.pos !== 'number' ) {
      context.pos = v;
      if ( context.params.preserve ) {
        const dv = v - context.getValue( t - dt );
        context.vel = dv / dt;
      } else {
        context.vel = 0.0;
      }
    }

    context.vel += ( -k * ( context.pos - v ) - 2.0 * context.vel * Math.sqrt( k ) * context.params.ratio ) * dt;
    context.pos += context.vel * dt;
    return context.pos;
  }
};