export default {
  name: 'Add',
  params: {
    value: { name: 'Value', type: 'float', default: 1.0 }
  },
  func( context ) {
    const t = context.t;
    const v = context.getValue( t );
    return v + context.params.value;
  }
};