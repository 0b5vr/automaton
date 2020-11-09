/* eslint-env jest */

import { Automaton } from '../Automaton';
import type { ChannelUpdateEvent } from '../types/ChannelUpdateEvent';
import type { SerializedAutomaton } from '../types/SerializedAutomaton';

const data: SerializedAutomaton = {
  resolution: 100.0,
  curves: [
    { nodes: [ { time: 0.0, value: 0.0 }, { time: 0.6, value: 1.0 } ] },
    { nodes: [ { time: 0.0, value: 2.0 }, { time: 0.6, value: 2.0 } ] }
  ],
  channels: {
    channelWithALinearCurve: { items: [ { curve: 0, time: 0.1 } ] },
    channelWithAConstantCurve: { items: [ { curve: 1, time: 0.1 } ] },
  }
};

describe( 'Automaton', () => {
  it( 'must be instantiated correctly', () => {
    const automaton = new Automaton( data );
    expect( automaton ).toBeInstanceOf( Automaton );
  } );

  describe( 'auto', () => {
    let automaton = new Automaton( data );
    let auto = automaton.auto;

    beforeEach( () => {
      automaton = new Automaton( data );
      auto = automaton.auto;
    } );

    it( 'must return a proper value (channelWithALinearCurve, before the curve starts)', () => {
      automaton.update( 0.05 );
      expect( auto( 'channelWithALinearCurve' ) ).toBeCloseTo( 0.0 );
    } );

    it( 'must return a proper value (channelWithAConstantCurve, before the curve starts)', () => {
      automaton.update( 0.05 );
      expect( auto( 'channelWithAConstantCurve' ) ).toBeCloseTo( 0.0 );
    } );

    it( 'must return a proper value (channelWithALinearCurve, during the curve)', () => {
      automaton.update( 0.4 );
      expect( auto( 'channelWithALinearCurve' ) ).toBeCloseTo( 0.5 );
    } );

    it( 'must return a proper value (channelWithAConstantCurve, during the curve)', () => {
      automaton.update( 0.4 );
      expect( auto( 'channelWithAConstantCurve' ) ).toBeCloseTo( 2.0 );
    } );

    it( 'must return a proper value (channelWithALinearCurve, after the curve ends)', () => {
      automaton.update( 0.9 );
      expect( auto( 'channelWithALinearCurve' ) ).toBeCloseTo( 1.0 );
    } );

    it( 'must return a proper value (channelWithAConstantCurve, after the curve ends)', () => {
      automaton.update( 0.9 );
      expect( auto( 'channelWithAConstantCurve' ) ).toBeCloseTo( 2.0 );
    } );
  } );

  describe( 'update', () => {
    let automaton = new Automaton( data );
    let auto = automaton.auto;

    beforeEach( () => {
      automaton = new Automaton( data );
      auto = automaton.auto;
    } );

    it( 'must execute a callback function with a proper argument (channelWithALinearCurve)', () => {
      let result: ChannelUpdateEvent | undefined;
      auto( 'channelWithALinearCurve', ( event ) => {
        result = event;
      } );

      automaton.update( 0.4 );

      expect( result?.init ).toBe( true );
      expect( result?.uninit ).toBeFalsy();
      expect( result?.value ).toBeCloseTo( 0.5 );
      expect( result?.progress ).toBeCloseTo( 0.5 );
    } );

    it( 'must execute a callback function with a proper argument (channelWithAConstantCurve)', () => {
      let result: ChannelUpdateEvent | undefined;
      auto( 'channelWithAConstantCurve', ( event ) => {
        result = event;
      } );

      automaton.update( 0.4 );

      expect( result?.init ).toBe( true );
      expect( result?.uninit ).toBeFalsy();
      expect( result?.value ).toBeCloseTo( 2.0 );
      expect( result?.progress ).toBeCloseTo( 0.5 );
    } );
  } );
} );
