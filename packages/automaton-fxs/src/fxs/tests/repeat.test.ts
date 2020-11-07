/* eslint-env jest */

import { Automaton } from '@fms-cat/automaton';
import type { SerializedAutomaton } from '@fms-cat/automaton';
import { jsonCopy } from './utils/jsonCopy';
import { repeat } from '../repeat';

const defaultData: SerializedAutomaton = {
  resolution: 100.0,
  curves: [
    { nodes: [ { time: 0.0, value: 0.0 }, { time: 1.0, value: 1.0 } ] },
  ],
  channels: {}
};

describe( 'repeat', () => {
  it( 'must return a correct value', () => {
    const data = jsonCopy( defaultData );
    data.curves[ 0 ].fxs = [ {
      time: 0.3,
      length: 0.5,
      def: 'repeat',
      params: { interval: 0.25 }
    } ];

    const automaton = new Automaton( data, { fxDefinitions: { repeat } } );
    const curve = automaton.getCurve( 0 )!;

    const expected = curve.getValue( 0.4 );
    const actual = curve.getValue( 0.4 + 0.25 );

    expect( actual ).toBeCloseTo( expected );
  } );
} );