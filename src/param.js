import cubicBezier from './cubic-bezier';

import Automaton from './main';

/**
 * It represents a param of Automaton.
 * It's `automaton.nogui.js` version and also base class for {@link ParamWithGUI}
 * @param {Object} _props
 * @param {Automaton} _props.automaton Parent automaton
 * @param {Object} [_props.data] Data of the param. **Required in noGUI mode**
 */
const Param = class {
  constructor( _props ) {
    /**
     * The parent automaton.
     * @type {Automaton}
     * @protected
     */
    this.__automaton = _props.automaton;

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
    this.__fxs = [ // 🔥
      {
        name: 'Add',
        row: 0,
        time: 0.1,
        length: 0.5,
        params: {
          value: 1.0
        }
      },
      {
        name: 'Lo-Fi',
        row: 0,
        time: 1.0,
        length: 0.7,
        params: {
          resolution: 10.0
        }
      }
    ];

    this.precalc();
  }

  /**
   * Precalculate values.
   */
  precalc() {
    /**
     * An array of precalculated value.
     * Its length is same as `param.automaton.data.resolution * param.automaton.data.length + 1`.
     * @type {number[]}
     * @protected
     */
    this.__values = [];

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
      const fxDef = this.__automaton.__paramFxs[ fx.name ];
      if ( !fxDef ) { continue; }

      const i0 = Math.floor( this.__automaton.resolution * fx.time );
      const i1 = Math.floor( this.__automaton.resolution * ( fx.time + fx.length ) );

      let context = {
        i: i0,
        t: fx.time,
        params: fx.params,
        array: this.__values,
        getValue: this.getValue.bind( this )
      };

      for ( let i = i0; i < i1; i ++ ) {
        context.i = i;
        context.t = i / this.__automaton.resolution;
        this.__values[ i ] = fxDef.func( context );
      }
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

// ------

export default Param;