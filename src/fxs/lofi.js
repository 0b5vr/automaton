export default [ 'lofi', {
  name: 'Lo-Fi',
  params: {
    resolution: { name: 'Resolution', type: 'float', default: 10.0, min: 1E-3, max: 100.0 },
    relative: { name: 'Relative', type: 'boolean', default: false }
  },
  func( context ) {
    let t;
    if ( context.params.relative ) {
      t = context.t0 + Math.floor( ( context.t - context.t0 ) * context.params.resolution ) / context.params.resolution;
    } else {
      t = Math.floor( ( context.t ) * context.params.resolution ) / context.params.resolution;
    }
    return context.getValue( t );
  }
} ];