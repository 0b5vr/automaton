import type { FxDefinition } from '@fms-cat/automaton';

export const repeat: FxDefinition = {
  name: 'Repeat',
  description: 'Repeat a section of the curve.',
  params: {
    interval: { name: 'Interval', type: 'float', default: 1.0, min: 0.0 },
  },
  func( context ) {
    if ( context.index === context.i1 ) {
      context.setShouldNotInterpolate( true );
    }

    if (
      ( context.elapsed + context.deltaTime ) % context.params.interval < context.deltaTime
    ) {
      context.setShouldNotInterpolate( true );
    }

    return context.getValue( context.t0 + context.elapsed % context.params.interval );
  }
};
