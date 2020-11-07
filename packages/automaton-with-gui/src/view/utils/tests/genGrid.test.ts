/* eslint-env jest */

import { genGrid } from '../genGrid';

describe( 'genGrid', () => {
  // this test is bad

  it( 'must generate a grid properly (t = [0 - 5])', () => {
    const result = genGrid( 0.0, 5.0 );
    expect( result ).toContainEqual( { value: 0, importance: Infinity } );
    expect( result ).toContainEqual( { value: 1, importance: 0.2 } );
    expect( result ).toContainEqual( { value: 2, importance: 0.2 } );
    expect( result ).toContainEqual( { value: 4, importance: 0.2 } );
  } );

  it( 'must generate a grid properly (t = [-5.0 - 0.0])', () => {
    const result = genGrid( -5.0, 0.0 );
    expect( result ).toContainEqual( { value: -5.0, importance: 0.2 } );
    expect( result ).toContainEqual( { value: 0, importance: Infinity } );
  } );

  it( 'must generate a grid properly (t = [0.5 - 10.5], details = 2)', () => {
    const result = genGrid( 0.5, 10.5, { details: 2 } );
    expect( result ).toContainEqual( { value: 0.5, importance: 0.01 } );
    expect( result ).toContainEqual( { value: 2, importance: 0.1 } );
    expect( result ).toContainEqual( { value: 10, importance: 1.0 } );
  } );

  it( 'must generate a grid properly (t = [4 - 20], base = 4, details = 2)', () => {
    const result = genGrid( 4, 20, { base: 4, details: 2 } );
    expect( result ).toContainEqual( { value: 4, importance: 0.25 } );
    expect( result ).toContainEqual( { value: 10, importance: 0.0625 } );
    expect( result ).toContainEqual( { value: 16, importance: 1 } );
  } );
} );
