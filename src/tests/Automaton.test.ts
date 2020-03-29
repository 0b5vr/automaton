/* eslint-env jest */

import { Automaton } from '../Automaton';
import { ChannelUpdateEvent } from '../Channel';
import { SerializedAutomaton } from '../types';

const mostSimpleData: SerializedAutomaton = {
  length: 1.0,
  resolution: 100.0,
  curves: [
    { nodes: [ { time: 0.0, value: 0.0 }, { time: 1.0, value: 1.0 } ] },
    { nodes: [ { time: 0.0, value: 2.0 }, { time: 1.0, value: 2.0 } ] }
  ],
  channels: {
    x: { items: [ { curve: 0 } ] },
    y: { items: [ { curve: 1 } ] },
  }
};

describe( 'Automaton', () => {
  it( 'must be instantiated correctly', () => {
    const automaton = new Automaton( mostSimpleData );
    expect( automaton ).toBeInstanceOf( Automaton );
  } );

  describe( 'auto', () => {
    let automaton = new Automaton( mostSimpleData );
    let auto = automaton.auto;

    beforeEach( () => {
      automaton = new Automaton( mostSimpleData );
      auto = automaton.auto;
    } );

    it( 'must return a proper value', () => {
      automaton.update( 0.5 );
      expect( auto( 'x' ) ).toBeCloseTo( 0.5 );
      expect( auto( 'y' ) ).toBeCloseTo( 2.0 );
    } );
  } );

  describe( 'update', () => {
    let automaton = new Automaton( mostSimpleData );
    let auto = automaton.auto;

    beforeEach( () => {
      automaton = new Automaton( mostSimpleData );
      auto = automaton.auto;
    } );

    it( 'must execute a callback function with a proper argument', () => {
      let resultX: ChannelUpdateEvent | undefined;
      auto( 'x', ( event ) => {
        resultX = event;
      } );

      automaton.update( 0.5 );

      expect( resultX?.init ).toBe( true );
      expect( resultX?.uninit ).toBeFalsy();
      expect( resultX?.value ).toBeCloseTo( 0.5 );
      expect( resultX?.progress ).toBeCloseTo( 0.5 );
    } );
  } );
} );
