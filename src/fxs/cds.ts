import { FxDefinition } from '@fms-cat/automaton';

export default [ 'cds', {
  name: 'Critically Damped Spring',
  description: 'Basically the best smoothing method. Shoutouts to Keijiro Takahashi',
  params: {
    factor: { name: 'Factor', type: 'float', default: 100.0, min: 0.0 },
    ratio: { name: 'Damp Ratio', type: 'float', default: 1.0 },
    preserve: { name: 'Preserve Velocity', type: 'boolean', default: false }
  },
  func( context ) {
    const dt = context.deltaTime;
    const v = context.value;
    const k = context.params.factor;

    if ( context.init ) {
      context.state.pos = context.value;
      if ( context.params.preserve ) {
        const dv = v - context.getValue( context.time - dt );
        context.state.vel = dv / dt;
      } else {
        context.state.vel = 0.0;
      }
    }

    context.state.vel += (
      -k * ( context.state.pos - v )
      - 2.0 * context.state.vel * Math.sqrt( k ) * context.params.ratio
    ) * dt;
    context.state.pos += context.state.vel * dt;
    return context.state.pos;
  }
} as FxDefinition ];
