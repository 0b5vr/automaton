import { FxDefinition } from '@fms-cat/automaton';

export default {
  name: 'Gravity',
  description: 'Accelerate and bounce the curve.',
  params: {
    a: { name: 'Acceleration', type: 'float', default: 9.8 },
    e: { name: 'Restitution', type: 'float', default: 0.5, min: 0.0 },
    preserve: { name: 'Preserve Velocity', type: 'boolean', default: false }
  },
  func( context ) {
    const dt = context.deltaTime;
    const v = context.value;

    if ( context.init ) {
      context.state.pos = v;
      if ( context.params.preserve ) {
        const dv = v - context.getValue( context.time - dt );
        context.state.vel = dv / dt;
      } else {
        context.state.vel = 0.0;
      }
    }

    const a = Math.sign( v - context.state.pos ) * context.params.a;
    context.state.vel += a * dt;
    context.state.pos += context.state.vel * dt;

    if ( Math.sign( a ) !== Math.sign( v - context.state.pos ) ) {
      context.state.vel *= -context.params.e;
      context.state.pos = v + context.params.e * ( v - context.state.pos );
    }

    return context.state.pos;
  }
} as FxDefinition;
