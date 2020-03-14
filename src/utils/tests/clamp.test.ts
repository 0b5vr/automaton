/* eslint-env jest */

import { clamp } from '../clamp';

describe( 'mod', () => {
  it( 'should do clamp( 0.5, 0.0, 1.0 ) correctly', () => {
    expect( clamp( 0.5, 0.0, 1.0 ) ).toBeCloseTo( 0.5 );
  } );

  it( 'should do clamp( 1.5, 0.0, 1.0 ) correctly', () => {
    expect( clamp( 1.5, 0.0, 1.0 ) ).toBeCloseTo( 1.0 );
  } );

  it( 'should do clamp( -0.5, 0.0, 1.0 ) correctly', () => {
    expect( clamp( -0.5, 0.0, 1.0 ) ).toBeCloseTo( 0.0 );
  } );
} );
