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
const globalName = 'AUTOMATON_FXS';
const filename = 'dev/automaton-fxs';

// == envs =========================================================================================
const DEV = process.env.NODE_ENV === 'development';
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
function createOutputOptions( { esm } ) {
  let file = filename;
  file += esm ? '.module' : '';
  file += DEV ? '' : '.min';
  file += '.js';

  return {
    file,
    format: esm ? 'esm' : 'umd',
    name: esm ? undefined : globalName,
    banner: DEV ? bannerTextDev : bannerTextProd,
    sourcemap: DEV ? 'inline' : false,
    plugins: [
      ...( DEV ? [] : [
        terser(),
      ] ),
      ...( WATCH ? [
        serve( serveOptions )
      ] : [] ),
    ],
  };
}

function createConfig( output ) {
  return {
    input: 'src/index.ts',
    output,
    plugins: [
      typescript(),
      replace( {
        'process.env.VERSION': `'${ packageJson.version }'`,
        'process.env.DEV': `'${ DEV }'`,
      } ),
    ],
  };
};

// == output =======================================================================================
const buildConfig = [
  createConfig( [
    createOutputOptions( {} ),
    createOutputOptions( { esm: true } ),
  ] ),
];

const watchConfig = createConfig( [
  createOutputOptions( { esm: true } ),
] );

export default WATCH ? watchConfig : buildConfig;
