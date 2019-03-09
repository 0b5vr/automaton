import { cubicBezier } from './cubic-bezier';

import Automaton from './Automaton';

/**
 * It represents a param of Automaton.
 * It's `automaton.nogui.js` version and also base class for {@link ParamWithGUI}
 * @param {Object} _props
 * @param {Automaton} _props.automaton Parent automaton
 * @param {Object} [_props.data] Data of the param. **Required in noGUI mode**
 */
export const Param = class {
  constructor( _props ) {
    /**
     * The parent automaton.
     * @type {Automaton}
     * @protected
     */
    this.__automaton = _props.automaton;

    /**
     * An array of precalculated value.
     * Its length is same as `param.__automaton.resolution * param.__automaton.length + 1`.
     * @type {number[]}
     * @protected
     */
    this.__values = new Float32Array( this.__automaton.resolution * this.__automaton.length + 1 );

    this.load( _props.data );

    /**
     * A buffer of last calculated value.
     * @type {number}
     * @protected
     */
    this.__lastValue = 0.0;

    /**
     * Will be used for calculation of `param.__lastValue`.
     * @type {number}
     * @protected
     */
    this.__lastTime = 0.0;
  }

  /**
   * Load a param data.
   * @param {object} _data Data of param
   * @returns {void} void
   */
  load( _data ) {
    /**
     * List of node.
     * @type {ParamNode[]}
     * @protected
     */
    this.__nodes = _data.nodes;

    /**
     * List of fx.
     * @type {ParamFxStrip[]}
     * @protected
     */
    this.__fxs = _data.fxs;

    this.precalc();
  }

  /**
   * Precalculate value of a sample.
   * @returns {void} void
   */
  precalc() {
    for ( let iNode = 0; iNode < this.__nodes.length - 1; iNode ++ ) {
      const node0 = this.__nodes[ iNode ];
      const node1 = this.__nodes[ iNode + 1 ];
      const i0 = Math.floor( node0.time * this.__automaton.resolution );
      const i1 = Math.floor( node1.time * this.__automaton.resolution );

      this.__values[ i0 ] = node0.value;
      for ( let i = i0 + 1; i <= i1; i ++ ) {
        const time = i / this.__automaton.resolution;
        const value = cubicBezier( node0, node1, time );
        this.__values[ i ] = value;
      }
    }

    for ( let iFx = 0; iFx < this.__fxs.length; iFx ++ ) {
      const fx = this.__fxs[ iFx ];
      if ( fx.bypass ) { continue; }
      const fxDef = this.__automaton.getFxDefinition( fx.def );
      if ( !fxDef ) { continue; }

      const i0 = Math.ceil( this.__automaton.resolution * fx.time );
      const i1 = Math.floor( this.__automaton.resolution * ( fx.time + fx.length ) );

      const tempValues = new Float32Array( i1 - i0 );
      const tempLength = tempValues.length;

      let context = {
        i0: i0,
        i1: i1,
        t0: fx.time,
        t1: fx.time + fx.length,
        deltaTime: 1.0 / this.__automaton.resolution,
        dt: 1.0 / this.__automaton.resolution,
        resolution: this.__automaton.resolution,
        length: fx.length,
        params: fx.params,
        array: this.__values,
        getValue: this.getValue.bind( this ),
        init: true
      };

      for ( let i = 0; i < tempLength; i ++ ) {
        context.i = context.index = i + i0;
        context.t = context.time = context.i / this.__automaton.resolution;
        context.v = context.value = this.__values[ i + i0 ];
        context.p = context.progress = ( context.t - fx.time ) / fx.length;
        tempValues[ i ] = fxDef.func( context );

        context.init = false;
      }

      this.__values.set( tempValues, i0 );
    }
  }

  /**
   * Return the value of specified time point.
   * @param {number} {_time} Time at the point you want to grab the value.
   * If it is not given, use current time of parent automaton instead
   * @returns {number} Result value
   */

  getValue( _time ) {
    let time = _time;
    if ( typeof time !== 'number' ) { // use parent automaton time instead
      time = this.__automaton.time;
    }

    if ( time === this.__lastTime ) { // use the buffer!
      return this.__lastValue;
    }

    if ( this.__automaton.loop ) {
      time = time - Math.floor( time / this.__automaton.length ) * this.__automaton.length;
    }

    if ( time <= 0.0 ) { // left clamp
      return this.__values[ 0 ];

    } else if ( this.__automaton.length <= time ) { // right clamp
      return this.__values[ this.__values.length - 1 ];

    } else { // fetch two value then do linear interpolation
      const index = time * this.__automaton.resolution;
      const indexi = Math.floor( index );
      const indexf = index % 1.0;

      const v0 = this.__values[ indexi ];
      const v1 = this.__values[ indexi + 1 ];

      const v = v0 + ( v1 - v0 ) * indexf;

      // store lastValue
      this.__lastTime = time;
      this.__lastValue = v;

      return v;
    }
  }
};

export default Param;
