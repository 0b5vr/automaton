/* eslint-env jest */

import { Automaton } from '../Automaton';
import { Channel } from '../Channel';
import type { SerializedAutomaton } from '../types/SerializedAutomaton';

const data: SerializedAutomaton = {
  resolution: 100.0,
  curves: [
    { nodes: [ [ 0.0, 0.0 ], [ 0.6, 1.0 ] ] },
    { nodes: [ [ 0.0, 2.0 ], [ 0.6, 2.0 ] ] }
  ],
  channels: []
};

describe( 'Channel', () => {
  let automaton = new Automaton( data );

  beforeEach( () => {
    automaton = new Automaton( data );
  } );

  it( 'must be instantiated correctly', () => {
    const channel = new Channel( automaton, {
      items: [ { curve: 0, time: 0.1 } ],
    } );
    expect( channel ).toBeInstanceOf( Channel );
  } );

  describe( 'getValue', () => {
    it( 'must handle an item of a linear curve properly', () => {
      const channel = new Channel( automaton, {
        items: [ { curve: 0, time: 0.1 } ],
      } );
      expect( channel.getValue( 0.05 ) ).toBeCloseTo( 0.0 );
      expect( channel.getValue( 0.4 ) ).toBeCloseTo( 0.5 );
      expect( channel.getValue( 0.9 ) ).toBeCloseTo( 1.0 );
    } );

    it( 'must handle an item of a constant curve properly', () => {
      const channel = new Channel( automaton, {
        items: [ { curve: 1, time: 0.1 } ],
      } );
      expect( channel.getValue( 0.05 ) ).toBeCloseTo( 0.0 );
      expect( channel.getValue( 0.4 ) ).toBeCloseTo( 2.0 );
      expect( channel.getValue( 0.9 ) ).toBeCloseTo( 2.0 );
    } );

    it( 'must handle a constant item with reset properly', () => {
      const channel = new Channel( automaton, {
        items: [ { time: 0.5, length: 0.5, value: 1.0, reset: true } ],
      } );
      expect( channel.getValue( 0.3 ) ).toBeCloseTo( 0.0 );
      expect( channel.getValue( 0.6 ) ).toBeCloseTo( 1.0 );
      expect( channel.getValue( 1.2 ) ).toBeCloseTo( 0.0 );
    } );

    it( 'must handle an item of a linear curve with reset properly', () => {
      const channel = new Channel( automaton, {
        items: [ { curve: 0, time: 0.1, reset: true } ],
      } );
      expect( channel.getValue( 0.05 ) ).toBeCloseTo( 0.0 );
      expect( channel.getValue( 0.4 ) ).toBeCloseTo( 0.5 );
      expect( channel.getValue( 0.9 ) ).toBeCloseTo( 0.0 );
    } );

    it( 'must handle an item of a linear curve with repeat properly', () => {
      const channel = new Channel( automaton, {
        items: [ { curve: 0, time: 0.1, length: 2.0, repeat: 1.0 } ],
      } );
      expect( channel.getValue( 0.05 ) ).toBeCloseTo( 0.0 );
      expect( channel.getValue( 0.4 ) ).toBeCloseTo( 0.5 );
      expect( channel.getValue( 0.9 ) ).toBeCloseTo( 1.0 );
      expect( channel.getValue( 1.1 ) ).toBeCloseTo( 0.0 );
      expect( channel.getValue( 1.4 ) ).toBeCloseTo( 0.5 );
      expect( channel.getValue( 1.7 ) ).toBeCloseTo( 1.0 );
    } );
  } );
} );
