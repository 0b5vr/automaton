/* eslint-env jest */

import { SerializedAutomaton, SerializedChannel } from '../types';
import { Automaton } from '../Automaton';
import { Channel } from '../Channel';

const data: SerializedAutomaton = {
  length: 1.0,
  resolution: 100.0,
  curves: [
    { nodes: [ { time: 0.0, value: 0.0 }, { time: 0.6, value: 1.0 } ] },
    { nodes: [ { time: 0.0, value: 2.0 }, { time: 0.6, value: 2.0 } ] }
  ],
  channels: {}
};

const serializedChannelWithALinearCurve: SerializedChannel = {
  items: [ { curve: 0, time: 0.1 } ]
};

const serializedChannelWithAConstantCurve: SerializedChannel = {
  items: [ { curve: 1, time: 0.1 } ]
};

describe( 'Channel', () => {
  let automaton = new Automaton( data );

  beforeEach( () => {
    automaton = new Automaton( data );
  } );

  it( 'must be instantiated correctly (serializedChannelWithALinearCurve)', () => {
    const channel = new Channel( automaton, serializedChannelWithALinearCurve );
    expect( channel ).toBeInstanceOf( Channel );
  } );

  it( 'must be instantiated correctly (serializedChannelWithAConstantCurve)', () => {
    const channel = new Channel( automaton, serializedChannelWithAConstantCurve );
    expect( channel ).toBeInstanceOf( Channel );
  } );

  describe( 'getValue', () => {
    let channelWithALinearCurve = new Channel( automaton, serializedChannelWithALinearCurve );
    let channelWithAConstantCurve = new Channel( automaton, serializedChannelWithAConstantCurve );

    beforeEach( () => {
      channelWithALinearCurve = new Channel( automaton, serializedChannelWithALinearCurve );
      channelWithAConstantCurve = new Channel( automaton, serializedChannelWithAConstantCurve );
    } );

    it( 'must return a proper value (channelWithALinearCurve, before the curve starts)', () => {
      const result = channelWithALinearCurve.getValue( 0.05 );
      expect( result ).toBeCloseTo( 0.0 );
    } );

    it( 'must return a proper value (channelWithAConstantCurve, before the curve starts)', () => {
      const result = channelWithAConstantCurve.getValue( 0.05 );
      expect( result ).toBeCloseTo( 0.0 );
    } );

    it( 'must return a proper value (channelWithALinearCurve, during the curve)', () => {
      const result = channelWithALinearCurve.getValue( 0.4 );
      expect( result ).toBeCloseTo( 0.5 );
    } );

    it( 'must return a proper value (channelWithAConstantCurve, during the curve)', () => {
      const result = channelWithAConstantCurve.getValue( 0.4 );
      expect( result ).toBeCloseTo( 2.0 );
    } );

    it( 'must return a proper value (channelWithALinearCurve, after the curve ends)', () => {
      const result = channelWithALinearCurve.getValue( 0.9 );
      expect( result ).toBeCloseTo( 1.0 );
    } );

    it( 'must return a proper value (channelWithAConstantCurve, after the curve ends)', () => {
      const result = channelWithAConstantCurve.getValue( 0.9 );
      expect( result ).toBeCloseTo( 2.0 );
    } );
  } );
} );
