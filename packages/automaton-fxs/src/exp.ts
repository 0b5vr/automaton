import type { FxDefinition } from '@0b5vr/automaton';

export const exp: FxDefinition = {
  name: 'Exponential Smoothing',
  description: 'Smooth the curve. Simple but good.',
  params: {
    factor: { name: 'Factor', type: 'float', default: 10.0, min: 0.0 }
  },
  func( context ) {
    const v = context.value;

    if ( context.init ) {
      context.state.pos = v;
    }

    const k = Math.exp( -context.deltaTime * context.params.factor );
    context.state.pos = context.state.pos * k + v * ( 1.0 - k );
    return context.state.pos;
  }
};
