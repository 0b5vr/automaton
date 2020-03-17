import { FxDefinition } from '@fms-cat/automaton';

const TAU = Math.PI * 2.0;

export default [ 'sine', {
  name: 'Sinewave',
  description: 'Overlay a sinewave to the curve.',
  params: {
    amp: { name: 'Amp', type: 'float', default: 0.1 },
    freq: { name: 'Frequency', type: 'float', default: 5.0 },
    phase: { name: 'Phase', type: 'float', default: 0.0, min: 0.0, max: 1.0 }
  },
  func( context ) {
    const v = context.value;
    const p = context.progress * context.params.freq + context.params.phase;
    return v + context.params.amp * Math.sin( p * TAU );
  }
} as FxDefinition ];
