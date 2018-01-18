const fs = require( 'fs' );

const gulp = require( 'gulp' );
const rename = require( 'gulp-rename' );

const browserify = require( 'browserify' );
const watchify = require( 'watchify' );
const envify = require( 'envify' );
const babelify = require( 'babelify' );
const source = require( 'vinyl-source-stream' );
const vueify = require( 'vueify' );
const imgurify = require( 'imgurify' );
const uglifyify = require( 'uglifyify' );

const browserSync = require( 'browser-sync' );

// ------

let debugBro = browserify( './src/main.js', {
  cache: {},
  packageCache: {},
  fullPaths: true,
  debug: true,
  standalone: 'Automaton',
  transform: [
    [ envify, {
      GUI: true
    } ],
    vueify,
    imgurify,
    [ babelify, {
      presets: 'es2015'
    } ],
    uglifyify
  ]
} );

let guiBro = browserify( './src/main.js', {
  cache: {},
  packageCache: {},
  fullPaths: true,
  standalone: 'Automaton',
  transform: [
    [ envify, {
      GUI: true
    } ],
    vueify,
    imgurify,
    [ babelify, {
      presets: 'es2015'
    } ],
    uglifyify
  ]
} );

let miniBro = browserify( './src/main.js', {
  cache: {},
  packageCache: {},
  fullPaths: true,
  standalone: 'Automaton',
  transform: [
    [ envify, {
      GUI: false
    } ],
    vueify,
    [ babelify, {
      presets: 'es2015'
    } ],
    uglifyify
  ]
} );

gulp.task( 'script-build', () => {
  debugBro.bundle()
  .on( 'error', _error => console.error( _error ) )
  .pipe( source( 'automaton.dev.js' ) )
  .pipe( gulp.dest( './dist' ) );

  guiBro.bundle()
  .on( 'error', _error => console.error( _error ) )
  .pipe( source( 'automaton.js' ) )
  .pipe( gulp.dest( './dist' ) );

  miniBro.bundle()
  .on( 'error', _error => console.error( _error ) )
  .pipe( source( 'automaton.min.js' ) )
  .pipe( gulp.dest( './dist' ) );
} );

gulp.task( 'script-watch', () => {
  let debugWatch = watchify( debugBro );

  debugWatch.on( 'update', () => {
    console.log( '🔮 Browserify!' );
    debugWatch.bundle()
    .on( 'error', _error => console.error( _error ) )
    .pipe( source( 'automaton.dev.js' ) )
    .pipe( gulp.dest( './dist' ) );
  } );

  debugWatch.on( 'log', ( _log ) => {
    console.log( '🍕 ' + _log );
  } );
} );

// ------

gulp.task( 'browser-init', () => {
  browserSync.init( {
    server: '.',
    startPath: './play/index.html'
  } );
} );

gulp.task( 'browser-reload', () => {
  browserSync.reload();
} );

gulp.task( 'browser-watch', () => {
  gulp.watch( [ './dist/**' ], [ 'browser-reload' ] );
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
  'script-watch'
] );

gulp.task( 'build', [
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
