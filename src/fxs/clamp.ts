import { FxDefinition } from '@fms-cat/automaton';

function clamp( x: number, a: number, b: number ): number {
  return Math.min( Math.max( x, a ), b );
}

function smin( a: number, b: number, k: number ): number {
  const h = Math.max( k - Math.abs( a - b ), 0.0 );
  return Math.min( a, b ) - h * h * h / ( 6.0 * k * k );
}

export default {
  name: 'Clamp',
  description: 'Constrain the curve between two values, featuring smooth minimum.',
  params: {
    min: { name: 'Min', type: 'float', default: 0.0 },
    max: { name: 'Max', type: 'float', default: 1.0 },
    smooth: { name: 'Smooth', type: 'float', default: 0.0, min: 0.0 }
  },
  func( context ) {
    if ( context.params.smooth === 0.0 ) {
      return clamp( context.value, context.params.min, context.params.max );
    }

    const v = -smin( -context.params.min, -context.value, context.params.smooth );
    return smin( context.params.max, v, context.params.smooth );
  }
} as FxDefinition;
