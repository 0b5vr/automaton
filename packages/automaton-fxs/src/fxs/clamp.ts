import type { FxDefinition } from '@fms-cat/automaton';
import { clamp as rawClamp } from './utils/clamp';
import { smin } from './utils/smin';

export const clamp: FxDefinition = {
  name: 'Clamp',
  description: 'Constrain the curve between two values, featuring smooth minimum.',
  params: {
    min: { name: 'Min', type: 'float', default: 0.0 },
    max: { name: 'Max', type: 'float', default: 1.0 },
    smooth: { name: 'Smooth', type: 'float', default: 0.0, min: 0.0 }
  },
  func( context ) {
    if ( context.params.smooth === 0.0 ) {
      return rawClamp( context.value, context.params.min, context.params.max );
    }

    const v = -smin( -context.params.min, -context.value, context.params.smooth );
    return smin( context.params.max, v, context.params.smooth );
  }
};
