/* eslint-env node */

import packageJson from './package.json';
import replace from '@rollup/plugin-replace';
import serve from 'rollup-plugin-serve';
import { terser } from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';

// == constants ====================================================================================
const copyright = '(c) 2017-2020 FMS_Cat';
const licenseName = 'MIT License';
const licenseUri = 'https://github.com/FMS-Cat/automaton/blob/master/LICENSE';
const globalName = 'AUTOMATON';
const filename = 'automaton';

// == envs =========================================================================================
const WATCH = process.env.ROLLUP_WATCH === 'true';

// == banner =======================================================================================
const bannerTextDev = `/*!
 * ${ packageJson.name } v${ packageJson.version }
 * ${ packageJson.description }
 *
 * Copyright ${ copyright }
 * ${ packageJson.name } is distributed under ${ licenseName }
 * ${ licenseUri }
 */`;

const bannerTextProd = `/*! ${ copyright } - ${ licenseUri } */`;

// == serve ========================================================================================
const serveOptions = {
  contentBase: '.',
};

// == config =======================================================================================
function createOutputOptions( { file, dev, esm } ) {
  return {
    file,
    format: esm ? 'esm' : 'umd',
    name: esm ? undefined : globalName,
    banner: dev ? bannerTextDev : bannerTextProd,
    sourcemap: dev ? 'inline' : false,
    plugins: [
      ...( dev ? [] : [
        terser(),
      ] ),
      ...( WATCH ? [
        serve( serveOptions )
      ] : [] ),
    ],
  };
}

function createConfig( output, { dev } ) {
  return {
    input: 'src/index.ts',
    output,
    plugins: [
      typescript(),
      replace( {
        'process.env.VERSION': `'${ packageJson.version }'`,
        'process.env.DEV': `'${ dev }'`,
      } ),
    ],
  };
};

// == output =======================================================================================
const buildConfig = [
  createConfig( [
    createOutputOptions( { file: `dist/${ filename }.js`, dev: true } ),
    createOutputOptions( { file: `dist/${ filename }.module.js`, dev: true, esm: true } ),
  ], { dev: true } ),
  createConfig( [
    createOutputOptions( { file: `dist/${ filename }.min.js` } ),
    createOutputOptions( { file: `dist/${ filename }.module.min.js`, esm: true } ),
  ], { dev: false } ),
];

const watchConfig = createConfig( [
  createOutputOptions( { file: `dist/${ filename }.module.js`, dev: true, esm: true } ),
], { dev: true } );

export default WATCH ? watchConfig : buildConfig;
