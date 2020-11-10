/* eslint-env node */

import banner from 'rollup-plugin-banner';
import commonjs from '@rollup/plugin-commonjs';
import packageJson from './package.json';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import serve from 'rollup-plugin-serve';
import svgr from '@svgr/rollup';
import { terser } from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';

// == constants ====================================================================================
const copyright = '(c) 2017-2020 FMS_Cat';
const licenseName = 'MIT License';
const licenseUri = 'https://github.com/FMS-Cat/automaton/blob/master/LICENSE';
const globalName = 'AUTOMATON_WITH_GUI';

// == envs =========================================================================================
const NODE_ENV = process.env.NODE_ENV;
const DEV = NODE_ENV === 'development';
const SERVE = process.env.SERVE === '1';
const ESM = process.env.ESM === '1';

// == banner =======================================================================================
// uses `output.banner` in dev mode, since sourcemap matters
const bannerTextDev = `/*!
* ${ packageJson.name } v${ packageJson.version }
* ${ packageJson.description }
*
* Copyright ${ copyright }
* ${ packageJson.name } is distributed under ${ licenseName }
* ${ licenseUri }
*/`;

// uses `rollup-plugin-banner` in prod mode, since terser removes the `output.banner` one
const bannerTextProd = `${ copyright } - ${ licenseUri }`;

// == serve ========================================================================================
const serveOptions = {
  contentBase: '../..',
};

// == output =======================================================================================
export default {
  input: 'src/index.ts',
  output: {
    format: ESM ? 'esm' : 'umd',
    name: ESM ? undefined : globalName,
    banner: DEV ? bannerTextDev : null,
    sourcemap: DEV ? 'inline' : false,
  },
  plugins: [
    typescript(),
    replace( {
      'process.env.VERSION': `'${ packageJson.version }'`,
      'process.env.NODE_ENV': `'${ NODE_ENV }'`,
    } ),
    resolve(),
    commonjs(),
    svgr(),
    ...( DEV ? [] : [ terser() ] ),
    ...( SERVE ? [ serve( serveOptions ) ] : [] ),
    ...( DEV ? [] : [ banner( bannerTextProd ) ] ),
  ],
};
