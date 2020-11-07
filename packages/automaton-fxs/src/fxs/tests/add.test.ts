/* eslint-env jest */

import { Automaton } from '@fms-cat/automaton';
import type { SerializedAutomaton } from '@fms-cat/automaton';
import { add } from '../add';
import { jsonCopy } from './utils/jsonCopy';

const defaultData: SerializedAutomaton = {
  resolution: 100.0,
  curves: [
    { nodes: [ { time: 0.0, value: 0.0 }, { time: 1.0, value: 1.0 } ] },
  ],
  channels: {}
};

describe( 'add', () => {
  it( 'must return a correct value', () => {
    const data = jsonCopy( defaultData );
    data.curves[ 0 ].fxs = [ {
      time: 0.0,
      length: 1.0,
      def: 'add',
      params: { value: 0.75 }
    } ];

    const automaton = new Automaton( data, { fxDefinitions: { add } } );
    const curve = automaton.getCurve( 0 )!;

    expect( curve.getValue( 0.5 ) ).toBeCloseTo( 1.25 );
  } );
} );
