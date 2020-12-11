/* eslint-env jest */

import { Automaton } from '../Automaton';
import type { ChannelUpdateEvent } from '../types/ChannelUpdateEvent';
import type { SerializedAutomaton } from '../types/SerializedAutomaton';

const data: SerializedAutomaton = {
  resolution: 100.0,
  curves: [
    { nodes: [ [ 0.0, 0.0 ], [ 0.6, 1.0 ] ] },
    { nodes: [ [ 0.0, 2.0 ], [ 0.6, 2.0 ] ] }
  ],
  channels: [
    [ 'channelWithALinearCurve', { items: [ { curve: 0, time: 0.1 } ] } ],
    [ 'channelWithAConstantCurve', { items: [ { curve: 1, time: 0.1 } ] } ],
  ]
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

    it( 'must read a proper value from a callback function', () => {
      const automaton = new Automaton( {
        resolution: 100.0,
        curves: [],
        channels: [
          // a ..1...2.
          // b 1..2....
          // c O=======
          // d O====...
          [ 'a', { items: [ { time: 0.50, value: 1.0 }, { time: 1.50, value: 2.0 } ] } ],
          [ 'b', { items: [ { time: 0.00, value: 1.0 }, { time: 0.75, value: 2.0 } ] } ],
          [ 'c', { items: [ { time: 0.00, length: 2.00 } ] } ],
          [ 'd', { items: [ { time: 0.00, length: 1.25 } ] } ],
        ]
      } );
      const auto = automaton.auto;

      let resultC: [ number, number ] | undefined;
      let resultD: [ number, number ] | undefined;

      auto( 'c', () => resultC = [ auto( 'a' ), auto( 'b' ) ] );
      auto( 'd', () => resultD = [ auto( 'a' ), auto( 'b' ) ] );

      automaton.update( 2.5 );

      expect( resultC ).toEqual( [ 2.0, 2.0 ] );
      expect( resultD ).toEqual( [ 1.0, 2.0 ] );
    } );

    it( 'must execute callback functions in a proper order (case 1)', () => {
      const automaton = new Automaton( {
        resolution: 100.0,
        curves: [],
        channels: [
          // a 1.....8.
          // b ..3.5...
          // c 2...6...
          // d ..4..7..
          [ 'a', { items: [ { time: 0.00 }, { time: 1.50 } ] } ],
          [ 'b', { items: [ { time: 0.50 }, { time: 1.00 } ] } ],
          [ 'c', { items: [ { time: 0.00 }, { time: 1.00 } ] } ],
          [ 'd', { items: [ { time: 0.50 }, { time: 1.25 } ] } ],
        ]
      } );
      const auto = automaton.auto;

      const result: [ number, string ][] = [];

      auto( 'a', ( event ) => result.push( [ event.begin, 'a' ] ) );
      auto( 'b', ( event ) => result.push( [ event.begin, 'b' ] ) );
      auto( 'c', ( event ) => result.push( [ event.begin, 'c' ] ) );
      auto( 'd', ( event ) => result.push( [ event.begin, 'd' ] ) );

      automaton.update( 1.5 );

      expect( result ).toEqual( [
        [ 0.00, 'a' ],
        [ 0.00, 'c' ],
        [ 0.50, 'b' ],
        [ 0.50, 'd' ],
        [ 1.00, 'b' ],
        [ 1.00, 'c' ],
        [ 1.25, 'd' ],
        [ 1.50, 'a' ],
      ] );
    } );

    it( 'must execute callback functions in a proper order (case 2)', () => {
      const automaton = new Automaton( {
        resolution: 100.0,
        curves: [],
        channels: [
          // a 1...3...
          // b ....4==.
          // c .5======
          // d ..2=....
          [ 'a', { items: [ { time: 0.00, length: 0.25 }, { time: 1.00, length: 0.25 } ] } ],
          [ 'b', { items: [ { time: 1.00, length: 0.75 } ] } ],
          [ 'c', { items: [ { time: 0.25, length: 1.75 } ] } ],
          [ 'd', { items: [ { time: 0.50, length: 0.50 } ] } ],
        ]
      } );
      const auto = automaton.auto;

      const result: [ number, string ][] = [];

      auto( 'a', ( event ) => result.push( [ event.begin, 'a' ] ) );
      auto( 'b', ( event ) => result.push( [ event.begin, 'b' ] ) );
      auto( 'c', ( event ) => result.push( [ event.begin, 'c' ] ) );
      auto( 'd', ( event ) => result.push( [ event.begin, 'd' ] ) );

      automaton.update( 1.5 );

      expect( result ).toEqual( [
        [ 0.00, 'a' ],
        [ 0.50, 'd' ],
        [ 1.00, 'a' ],
        [ 1.00, 'b' ],
        [ 0.25, 'c' ],
      ] );
    } );
  } );
} );
