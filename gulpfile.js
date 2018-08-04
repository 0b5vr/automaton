const fs = require( 'fs' );

const gulp = require( 'gulp' );
const jsdoc = require( 'gulp-jsdoc3' );

const browserify = require( 'browserify' );
const watchify = require( 'watchify' );
const envify = require( 'envify' );
const babelify = require( 'babelify' );
const source = require( 'vinyl-source-stream' );
const vueify = require( 'vueify' );
const imgurify = require( 'imgurify' );
const uglifyify = require( 'uglifyify' );
const banner = require( 'browserify-banner' );

const browserSync = require( 'browser-sync' );

const packageJson = require( './package.json' );

// ------

const env = {
  NAME: packageJson.name,
  VERSION: packageJson.version
};

const debugName = 'automaton.js';
const debugBro = browserify( './src/main-gui.js', {
  debug: true,
  standalone: 'Automaton',
  transform: [
    [ envify, env ],
    vueify,
    imgurify,
    [ babelify, { presets: 'env' } ],
  ]
} ).plugin( banner, { file: './src/-banner' } );

const minName = 'automaton.min.js';
const minBro = browserify( './src/main-gui.js', {
  standalone: 'Automaton',
  transform: [
    [ envify, env ],
    vueify,
    imgurify,
    [ babelify, { presets: 'env' } ],
    [ uglifyify, { global: true } ]
  ]
} ).plugin( banner, { file: './src/-banner-min' } );

const noguiName = 'automaton.nogui.js';
const noguiBro = browserify( './src/main.js', {
  standalone: 'Automaton',
  transform: [
    [ envify, env ],
    [ babelify, { presets: 'env' } ],
    [ uglifyify, { global: true } ]
  ]
} ).plugin( banner, { file: './src/-banner-min' } );

gulp.task( 'script-build', () => {
  debugBro.bundle()
  .on( 'error', ( _error ) => console.error( _error ) )
  .pipe( source( debugName ) )
  .pipe( gulp.dest( './dist' ) );

  minBro.bundle()
  .on( 'error', ( _error ) => console.error( _error ) )
  .pipe( source( minName ) )
  .pipe( gulp.dest( './dist' ) );

  noguiBro.bundle()
  .on( 'error', ( _error ) => console.error( _error ) )
  .pipe( source( noguiName ) )
  .pipe( gulp.dest( './dist' ) );
} );

gulp.task( 'script-watch', () => {
  const debugWatch = watchify( debugBro );

  debugWatch.on( 'update', () => {
    console.log( '🔮 Browserify!' );
    debugWatch.bundle()
    .on( 'error', ( _error ) => console.error( _error ) )
    .pipe( source( debugName ) )
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
    startPath: './index.html'
  } );
} );

gulp.task( 'browser-reload', () => {
  browserSync.reload();
} );

gulp.task( 'browser-watch', () => {
  gulp.watch( [ './dist/**' ], [ 'browser-reload' ] );
} );

// ------

const jsdocConfig = require( './jsdoc.json' );
gulp.task( 'jsdoc-build', () => {
  gulp.src( [ 'README.md', './src/**/*.js' ], { read: false } )
  .pipe( jsdoc( jsdocConfig ) );
} );

// ------

const recursiveUnlink = ( _path ) => {
  if ( fs.existsSync( _path ) ) {
    fs.readdirSync( _path ).map( ( _file ) => {
      const filePath = _path + '/' + _file;
      if ( fs.lstatSync( filePath ).isDirectory() ) {
        recursiveUnlink( filePath );
      } else {
        fs.unlinkSync( filePath );
      }
    } );
    fs.rmdirSync( _path );
  }
};

gulp.task( 'clean', () => {
  recursiveUnlink( './dist' );
  recursiveUnlink( './docs' );
} );

// ------

gulp.task( 'watch', [
  'script-watch'
] );

gulp.task( 'build', [
  'script-build',
  'jsdoc-build'
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
