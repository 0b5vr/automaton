export default [ 'cds', {
  name: 'Critically Damped Spring',
  description: 'Basically the best smoothing method. Shoutouts to Keijiro Takahashi',
  params: {
    factor: { name: 'Factor', type: 'float', default: 100.0, min: 0.0 },
    ratio: { name: 'Damp Ratio', type: 'float', default: 1.0 },
    preserve: { name: 'Preserve Velocity', type: 'boolean', default: false }
  },
  func( context ) {
    const dt = context.dt;
    const v = context.v;
    const k = context.params.factor;

    if ( context.init ) {
      context.pos = context.v;
      if ( context.params.preserve ) {
        const dv = v - context.getValue( context.t - dt );
        context.vel = dv / dt;
      } else {
        context.vel = 0.0;
      }
    }

    context.vel += ( -k * ( context.pos - v ) - 2.0 * context.vel * Math.sqrt( k ) * context.params.ratio ) * dt;
    context.pos += context.vel * dt;
    return context.pos;
  }
} ];