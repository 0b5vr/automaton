export default ( value, message ) => {
  if ( value ) {
    return true;
  } else {
    throw new Error( message );
  }
};
