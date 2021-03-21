import type { FxDefinition } from '@fms-cat/automaton';

export const repeat: FxDefinition = {
  name: 'Repeat',
  description: 'Repeat a section of the curve.',
  params: {
    interval: { name: 'Interval', type: 'float', default: 1.0, min: 0.0 },
  },
  func( context ) {
    if ( context.init ) {
      context.shouldNotInterpolate[ context.i1 ] = 1;
    }

    if (
      context.index !== context.i0 &&
      context.elapsed % context.params.interval < context.deltaTime
    ) {
      context.shouldNotInterpolate[ context.index - 1 ] = 1;
    }

    return context.getValue( context.t0 + context.elapsed % context.params.interval );
  }
};
