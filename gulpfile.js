const fs = require( 'fs' );

const gulp = require( 'gulp' );
const rename = require( 'gulp-rename' );
const changed = require( 'gulp-changed' );

const browserify = require( 'browserify' );
const watchify = require( 'watchify' );
const babelify = require( 'babelify' );
const source = require( 'vinyl-source-stream' );
const uglify = require( 'gulp-uglify' );

const browserSync = require( 'browser-sync' );

// ------

gulp.task( 'static-build', () => {
  gulp.src( [ './src/static/**/*' ] )
  .pipe( changed( './dist' ) )
  .pipe( gulp.dest( './dist' ) );
} );

gulp.task( 'static-watch', () => {
  gulp.watch( './src/static/**', [ 'static-build' ] );
} );

// ------

let brwsrfy = browserify( {
  cache: {},
  packageCache: {},
  fullPaths: true,
  entries: [ './src/script/main.js' ],
  transform: [
    [ babelify, {
      presets: 'es2015'
    } ]
  ]
} );

gulp.task( 'script-build', () => {
  brwsrfy.bundle()
  .on( 'error', function( _error ) {
    console.error( _error );
    this.emit( 'end' );
  } )
  .pipe( source( 'automaton.js' ) )
  .pipe( gulp.dest( './dist' ) );

  gulp.src( './dist/automaton.js' )
  .pipe( uglify() )
  .pipe( rename( 'automaton.min.js' ) )
  .pipe( gulp.dest( './dist' ) )
} );

gulp.task( 'script-watch', () => {
  let wtcfy = watchify( brwsrfy );

  wtcfy.on( 'update', function() {
    console.log( '🔮 Browserify!' );
    wtcfy.bundle()
    .on( 'error', function( _error ) {
      console.error( _error );
      this.emit( 'end' );
    } )
    .pipe( source( 'automaton.js' ) )
    .pipe( gulp.dest( './dist' ) );
  } );

  wtcfy.on( 'log', ( _log ) => {
    console.log( '🍕 ' + _log );
  } );
} );

// ------

gulp.task( 'browser-init', () => {
  browserSync.init( {
    server: './dist'
  } );
} );

gulp.task( 'browser-reload', () => {
  browserSync.reload();
} );

gulp.task( 'browser-watch', () => {
  gulp.watch( [ './dist/**', '!./dist/**/*.css' ], [ 'browser-reload' ] );
} );

// ------

let recursiveUnlink = ( _path ) => {
  if ( fs.existsSync( _path ) ) {
    fs.readdirSync( _path ).map( ( _file ) => {
      let filePath = _path + '/' + _file;
      if ( fs.lstatSync( filePath ).isDirectory() ) {
        recursiveUnlink( filePath );
      } else {
        fs.unlinkSync( filePath );
      }
    } );
    fs.rmdirSync( _path );
  }
}

gulp.task( 'clean', () => {
  recursiveUnlink( './dist' );
} );

// ------

gulp.task( 'watch', [
  'static-watch',
  'script-watch'
] );

gulp.task( 'build', [
  'static-build',
  'script-build'
] );

gulp.task( 'browser', [
  'browser-init',
  'browser-watch'
] );

gulp.task( 'dev', [
  'build',
  'watch',
  'browser'
] );

gulp.task( 'default', [
  'dev'
] );
