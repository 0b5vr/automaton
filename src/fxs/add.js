export default [ 'add', {
  name: 'Add',
  params: {
    value: { name: 'Value', type: 'float', default: 1.0 }
  },
  func( context ) {
    return context.v + context.params.value;
  }
} ];