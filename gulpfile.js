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
const banner = require( 'browserify-banner' );

const browserSync = require( 'browser-sync' );

const packageJson = require( './package.json' );

// ------

let bannerSettings = {
  file: "banner"
};

let debugName = 'automaton.js';
let debugBro = browserify( './src/main.js', {
  cache: {},
  packageCache: {},
  fullPaths: true,
  debug: true,
  standalone: 'Automaton',
  transform: [
    [ envify, { GUI: true, VERSION: packageJson.version } ],
    vueify,
    imgurify,
    [ babelify, { presets: 'env' } ],
  ]
} ).plugin( banner, { file: "banner" } );

let minName = 'automaton.min.js';
let minBro = browserify( './src/main.js', {
  cache: {},
  packageCache: {},
  standalone: 'Automaton',
  transform: [
    [ envify, { GUI: true, VERSION: packageJson.version } ],
    vueify,
    imgurify,
    [ babelify, { presets: 'env' } ],
    [ uglifyify, { global: true } ]
  ]
} ).plugin( banner, { file: "banner-min" } );

let noguiName = 'automaton.nogui.js';
let noguiBro = browserify( './src/main.js', {
  cache: {},
  packageCache: {},
  standalone: 'Automaton',
  transform: [
    [ envify, { GUI: false, VERSION: packageJson.version } ],
    [ babelify, { presets: 'env' } ],
    [ uglifyify, { global: true } ]
  ]
} ).plugin( banner, { file: "banner-min" } );

gulp.task( 'script-build', () => {
  debugBro.bundle()
  .on( 'error', _error => console.error( _error ) )
  .pipe( source( debugName ) )
  .pipe( gulp.dest( './dist' ) );

  minBro.bundle()
  .on( 'error', _error => console.error( _error ) )
  .pipe( source( minName ) )
  .pipe( gulp.dest( './dist' ) );

  noguiBro.bundle()
  .on( 'error', _error => console.error( _error ) )
  .pipe( source( noguiName ) )
  .pipe( gulp.dest( './dist' ) );
} );

gulp.task( 'script-watch', () => {
  let debugWatch = watchify( debugBro );

  debugWatch.on( 'update', () => {
    console.log( '🔮 Browserify!' );
    debugWatch.bundle()
    .on( 'error', _error => console.error( _error ) )
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
