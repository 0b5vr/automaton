/* eslint-env node */

import 'webpack-dev-server';
import Fiber from 'fibers';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import Sass from 'sass';
import { VueLoaderPlugin } from 'vue-loader';
import packageJson from './package.json';
import path from 'path';
import webpack from 'webpack';

export default ( env: any, argv: any ): webpack.Configuration => {
  const VERSION = packageJson.version;
  const AUTOMATON_BUILD = process.env.AUTOMATON_BUILD;
  console.info( `Webpack: Building Automaton ${VERSION} under ${AUTOMATON_BUILD} settings...` );

  const banner = argv.mode === 'production'
    ? `Automaton v${VERSION} - (c) FMS_Cat, MIT License`
    : `Automaton v${VERSION}
Animation engine with Timeline GUI for creative coding

Copyright (c) 2017-2019 FMS_Cat
Automaton is distributed under the MIT License
https://opensource.org/licenses/MIT

Repository: https://github.com/FMS-Cat/automaton`;

  return {
    entry: path.resolve(
      __dirname,
      AUTOMATON_BUILD === 'nogui' ? 'src/index.nogui.ts' : 'src/index.ts'
    ),
    output: {
      path: path.join( __dirname, 'dist' ),
      filename: AUTOMATON_BUILD === 'dev' ? 'automaton.js' : `automaton.${AUTOMATON_BUILD}.js`,
      library: 'Automaton',
      libraryExport: 'default',
      libraryTarget: 'umd',
      globalObject: 'this',
    },
    resolve: {
      extensions: [ '.js', '.json', '.ts', '.vue' ],
      alias: {
        'vue$': 'vue/dist/vue.esm.js'
      }
    },
    module: {
      rules: [
        { test: /\.(png|jpg|gif|svg|ttf|otf)$/, use: 'url-loader' },
        { test: /\.(sass|scss|css)$/, use: [ 'vue-style-loader', 'css-loader' ] },
        {
          test: /\.(sass|scss)$/,
          use: [
            {
              loader: 'sass-loader',
              options: {
                implementation: Sass,
                fiber: Fiber
              }
            }
          ]
        },
        {
          test: /\.vue$/,
          loader: 'vue-loader',
          options: {
            hotReload: false // disables Hot Reload
          }
        },
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'ts-loader',
              options: { happyPackMode: true, transpileOnly: true }
            }
          ]
        },
        { test: /\.js$/, use: 'babel-loader' },
      ],
    },
    optimization: {
      minimize: argv.mode === 'production'
    },
    devServer: {
      contentBase: path.resolve( __dirname, './' ),
      publicPath: '/dist/',
      openPage: 'index.html',
      watchContentBase: true,
      inline: true,
      hot: true
    },
    devtool: argv.mode === 'production' ? false : 'inline-source-map',
    plugins: [
      new webpack.BannerPlugin( banner ),
      new VueLoaderPlugin(),
      new webpack.DefinePlugin( {
        'process.env': {
          AUTOMATON_BUILD: `"${AUTOMATON_BUILD}"`,
          VERSION: `"${VERSION}"`
        },
      } ),
      ...( argv.mode === 'production' ? [
        // nothing
      ] : [
        new webpack.NamedModulesPlugin(),
        new ForkTsCheckerWebpackPlugin( { checkSyntacticErrors: true } ),
      ] ),
    ],
  };
};