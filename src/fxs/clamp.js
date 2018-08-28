const clamp = ( x, a, b ) => Math.min( Math.max( x, a ), b );

const smin = ( a, b, k ) => {
  const h = Math.max( k - Math.abs( a - b ), 0.0 );
  return Math.min( a, b ) - h * h * h / ( 6.0 * k * k );
};

export default [ 'clamp', {
  name: 'Clamp',
  params: {
    min: { name: 'Min', type: 'float', default: 0.0 },
    max: { name: 'Max', type: 'float', default: 1.0 },
    smooth: { name: 'Smooth', type: 'float', default: 0.0, min: 0.0 }
  },
  func( context ) {
    if ( context.params.smooth === 0.0 ) {
      return clamp( context.v, context.params.min, context.params.max );
    }

    let v = -smin( -context.params.min, -context.v, context.params.smooth );
    return smin( context.params.max, v, context.params.smooth );
  }
} ];