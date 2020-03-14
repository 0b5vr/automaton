/* eslint-env jest */

import { Automaton } from '../Automaton';
import { SerializedData } from '../types';

const mostSimpleData: SerializedData = {
  length: 1.0,
  resolution: 100.0,
  params: {
    x: { nodes: [ { time: 0.0, value: 0.0 }, { time: 1.0, value: 1.0 } ], fxs: [] },
    y: { nodes: [ { time: 0.0, value: 2.0 }, { time: 1.0, value: 2.0 } ], fxs: [] },
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

    it( 'must return a value on time = 0 if it\'s called before its first update', () => {
      expect( auto( 'x' ) ).toBeCloseTo( 0.0 );
      expect( auto( 'y' ) ).toBeCloseTo( 2.0 );
    } );

    it( 'must return a proper value (single param)', () => {
      automaton.update( 0.5 );
      expect( auto( 'x' ) ).toBeCloseTo( 0.5 );
      expect( auto( 'y' ) ).toBeCloseTo( 2.0 );
    } );

    it( 'must return a proper value (multiple param)', () => {
      automaton.update( 0.5 );
      const result = auto( [ 'x', 'y' ] );
      expect( result.x ).toBeCloseTo( 0.5 );
      expect( result.y ).toBeCloseTo( 2.0 );
    } );
  } );

  describe( 'update', () => {
    let automaton = new Automaton( mostSimpleData );
    let auto = automaton.auto;

    beforeEach( () => {
      automaton = new Automaton( mostSimpleData );
      auto = automaton.auto;
    } );

    it( 'must execute a callback function exactly once', () => {
      let count = 0;
      auto( [ 'x', 'y' ], () => {
        count ++;
      } );

      automaton.update( 0.5 );

      expect( count ).toBe( 1 );
    } );

    it( 'must not execute a callback function if the param is not changed', () => {
      let count = 0;
      auto( 'y', () => {
        count ++;
      } );

      automaton.update( 0.5 );

      expect( count ).toBe( 0 );
    } );

    it( 'must execute a callback function with a proper argument (single param)', () => {
      let resultX: number = 0.0;
      auto( 'x', ( x ) => {
        resultX = x;
      } );

      automaton.update( 0.5 );

      expect( resultX ).toBeCloseTo( 0.5 );
    } );

    it( 'must execute a callback function with a proper argument (multiple param)', () => {
      let result: any = {};
      auto( [ 'x', 'y' ], ( r ) => {
        result = r;
      } );

      automaton.update( 0.5 );

      expect( result.x ).toBeCloseTo( 0.5 );
      expect( result.y ).toBeCloseTo( 2.0 );
    } );

    it( 'must execute a callback function exactly once', () => {
      let count = 0;
      auto( [ 'x', 'y' ], () => {
        count ++;
      } );

      automaton.update( 0.5 );

      expect( count ).toBe( 1 );
    } );
  } );
} );
