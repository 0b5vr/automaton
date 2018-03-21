export default {
  /**
   * Detect a deprecated handler then throw an exception.
   * @param {function} f function. if there, it throws an exception
   * @param {string} o old handler name
   * @param {string} [n] new handler name, if there
   */
  handler( f, o, n ) {
    if ( typeof f === "function" ) {
      throw o + " is deprecated!" + ( n ? " Use " + n + " instead" : "" );
    }
  },

  /**
   * Throw an deprecation exception.
   * @param {string} o old API name
   * @param {string} [n] new API name, if there
   */
  throw( o, n ) {
    throw o + " is deprecated!" + ( n ? " Use " + n + " instead" : "" );
  }
};