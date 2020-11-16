import { reorderArray } from '../reorderArray';

describe( 'reorderArray', () => {
  it( 'should reorder given array correctly (2 elements)', () => {
    const array = [ 1, 2, 3, 4, 5 ];
    const reorder = reorderArray( array, 2, 2 );
    reorder( 0 );
    expect( array ).toEqual( [ 3, 4, 1, 2, 5 ] );
  } );

  it( 'should reorder given array correctly (2 elements, reorder twice)', () => {
    const array = [ 1, 2, 3, 4, 5 ];
    const reorder = reorderArray( array, 2, 2 );
    reorder( 3 );
    reorder( 1 );
    expect( array ).toEqual( [ 1, 3, 4, 2, 5 ] );
  } );

  it( 'should reorder given array correctly (3 elements, attempt to reorder to far away)', () => {
    const array = [ 1, 2, 3, 4, 5 ];
    const reorder = reorderArray( array, 1, 3 );
    reorder( 99 );
    expect( array ).toEqual( [ 1, 5, 2, 3, 4 ] );
  } );
} );
