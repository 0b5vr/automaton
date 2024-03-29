import type { FxDefinition } from '@0b5vr/automaton';

export const add: FxDefinition = {
  name: 'Add',
  description: 'The simplest fx ever. Just add a constant value to the curve.',
  params: {
    value: { name: 'Value', type: 'float', default: 1.0 }
  },
  func( context ) {
    return context.value + context.params.value;
  }
};
