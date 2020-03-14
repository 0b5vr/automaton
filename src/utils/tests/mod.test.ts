import { mod } from "../mod";

describe( 'mod', () => {
  it ( 'should do mod( 5, 2 ) correctly', () => {
    expect( mod( 5, 2 ) ).toBeCloseTo( 1 );
  } );

  it ( 'should do mod( 2, 5 ) correctly', () => {
    expect( mod( 2, 5 ) ).toBeCloseTo( 2 );
  } );

  it ( 'should do mod( -2, 5 ) correctly', () => {
    expect( mod( -2, 5 ) ).toBeCloseTo( 3 );
  } );
} );
