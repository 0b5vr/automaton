export default () => {
  let ret = '';
  for ( let i = 0; i < 16; i ++ ) {
    ret += Math.floor( 16.0 * Math.random() ).toString( 16 );
  }
  return ret;
};
