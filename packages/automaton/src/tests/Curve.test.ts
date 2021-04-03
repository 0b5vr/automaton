/* eslint-env jest */

import { Automaton } from '../Automaton';
import { Curve } from '../Curve';
import type { SerializedAutomaton } from '../types/SerializedAutomaton';

const data: SerializedAutomaton = {
  resolution: 100.0,
  curves: [],
  channels: []
};

describe( 'Curve', () => {
  let automaton = new Automaton( data );

  beforeEach( () => {
    automaton = new Automaton( data );
  } );

  it( 'must be instantiated correctly', () => {
    const curve = new Curve( automaton, {
      nodes: [ [], [ 0.5, 1.0 ] ],
    } );
    expect( curve ).toBeInstanceOf( Curve );
  } );

  describe( 'getValue', () => {
    it( 'must handle a curve with a linear properly', () => {
      const curve = new Curve( automaton, {
        nodes: [ [], [ 0.5, 1.0 ] ],
      } );
      expect( curve.getValue( 0.0 ) ).toBeCloseTo( 0.0 );
      expect( curve.getValue( 0.25 ) ).toBeCloseTo( 0.5 );
      expect( curve.getValue( 0.5 ) ).toBeCloseTo( 1.0 );
    } );

    it( 'must handle a curve with a sharp point properly', () => {
      const curve = new Curve( automaton, {
        nodes: [ [], [ 0.5, 1.0 ], [ 0.5 ], [ 1.0, 1.0 ] ],
      } );
      expect( curve.getValue( 0.5 - 1E-9 ) ).toBeCloseTo( 1.0 );
      expect( curve.getValue( 0.5 + 1E-9 ) ).toBeCloseTo( 0.0 );
    } );
  } );
} );
