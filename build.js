( function() {

  'use strict';

  let fs = require( 'fs' );
  let path = require( 'path' );

  let babel = require( 'babel-core' );
  let uglify = require( 'uglify-js' );

  fs.readFile( path.join( __dirname, 'src/main.js' ), 'utf8', function( _error, _file ) {
    let babelOptions = {
      presets: [ 'es2015' ]
    };
    let babeled = babel.transform( _file, babelOptions ).code;

    {
      let ret = babeled;
      fs.writeFile( path.join( __dirname, 'dist/automaton.js' ), ret, 'utf8', function() {
        console.log( '🍕  dev' );
      } );
    }

    {
      let ret = uglify.minify( babeled, { fromString: true } ).code;
      fs.writeFile( path.join( __dirname, 'dist/automaton.min.js' ), ret, 'utf8', function() {
        console.log( '🍕  prod' );
      } );
    }
  } );

} )();
