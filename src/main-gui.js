import ass from './ass';
import compat from './compat';

import Param from './param-gui';

import Automaton from './main';

import Vue from 'vue';
import GUI from './vue/main.vue';

/**
 * IT'S AUTOMATON!
 * It's `automaton.js` and `automaton.min.js` version.
 * Since GUI stuff is pretty big for intro heh
 * @extends Automaton
 * @param {Object} [_props]
 * @param {boolean} [_props.loop] Whether let the time loop or not
 * @param {number} [_props.fps] If this is set, the clock will become frame mode
 * @param {boolean} [_props.realtime] If this is true, the clock will become realtime mode
 * @param {DOM} [_props.gui] DOM element where you want to attach the Automaton GUI
 * @param {string|Object} [_props.data] Data of the automaton. Don't worry, I can generate an initial data for you!
 */
const AutomatonWithGUI = class extends Automaton {
  constructor( _props ) {
    const props = Object.assign( {}, _props );
    props.data = compat( props.data );

    ass( !_props.onseek, 'The handler "onseek" is no longer supported. Use Automaton.on( "seek", ... ) instead.' );
    ass( !_props.onplay, 'The handler "onplay" is no longer supported. Use Automaton.on( "play", ... ) instead.' );
    ass( !_props.onpause, 'The handler "onpause" is no longer supported. Use Automaton.on( "pause", ... ) instead.' );

    super( props );

    this.history = [];
    this.historyIndex = 0;

    if ( _props.gui ) { this.__prepareGUI( _props.gui ); }
  }

  /**
   * Prepare GUI.
   * @param {DOM} _target DOM element where you want to attach the Automaton GUI
   * @returns {void} void
   * @protected
   */
  __prepareGUI( _target ) {
    const el = document.createElement( 'div' );
    _target.appendChild( el );

    /**
     * Vue instance that manages automaton gui.
     * @type {Vue}
     */
    this.__vue = new Vue( {
      el: el,
      data: {
        automaton: this
      },
      render: function( createElement ) {
        return createElement(
          GUI,
          { props: { automaton: this.automaton } }
        );
      }
    } );
  }

  /**
   * Generate default fx params object.
   * @param {string} _name Name of fx
   * @returns {Object} Default fx params object
   * @protected
   */
  __generateDefaultFxParams( _name ) {
    const fxDef = this.__paramFxDefs[ _name ];
    if ( !fxDef ) { throw new Error( `Fx definition called ${_name} is not defined` ); }

    const ret = {};
    for ( let key in fxDef.params ) {
      ret[ key ] = fxDef.params[ key ].default;
    }

    return ret;
  }

  /**
   * Toggle play / pause.
   * @returns {void} void
   */
  togglePlay() {
    if ( this.isPlaying ) { this.pause(); }
    else { this.play(); }
  }

  /**
   * Put some operation into the history stack.
   * For gui development.
   * @param {string} _desc Description of the operation
   * @param {function} _do Operation
   * @param {function} _undo Operation that undoes the `_do`
   * @returns {void} void
   * @protected
   */
  pushHistory( _desc, _do, _undo ) {
    this.history.splice( this.historyIndex );
    this.history.push( { do: _do, undo: _undo } );
    this.historyIndex ++;
  }

  /**
   * Undo the operation based on history stack.
   * Can be performed via GUI.
   * @returns {any} Result of _undo
   */
  undo() {
    if ( this.historyIndex <= 0 ) { return; }
    this.historyIndex --;
    return this.history[ this.historyIndex ].undo();
  }

  /**
   * Redo the operation based on history stack.
   * Can be performed via GUI.
   * @returns {any} Result of _do
   */
  redo() {
    if ( this.history.length <= this.historyIndex ) { return; }
    this.historyIndex ++;
    return this.history[ this.historyIndex - 1 ].do();
  }

  /**
   * Drop all the history. YABAI.
   */
  dropHistory() {
    this.history.splice( 0 );
    this.historyIndex = 0;
  }

  /**
   * Set new length.
   * **Some nodes might be automatically removed.**
   * Can be performed via GUI.
   * @param {number} _len new length
   * @returns {void} void
   */
  setLength( _len ) {
    // if len is invalid then throw error
    if ( isNaN( _len ) ) {
      throw 'Automaton.setLength: _len is invalid';
    }

    for ( let paramName in this.params ) {
      const param = this.params[ paramName ];

      // remove loose ends
      for ( let iNode = param.nodes.length - 1; 0 < iNode; iNode -- ) {
        const node = param.nodes[ iNode ];
        if ( _len < node.time ) {
          param.nodes.splice( iNode, 1 );
        }
      }

      // generate a new end
      const lastNode = param.nodes[ param.nodes.length - 1 ];
      if ( lastNode.time !== _len ) {
        param.addNode( _len, lastNode.value );
      }
    }

    // finally set the length
    this.data.length = _len;

    // It's irreversible operation, sorry.
    this.__dropHistory();
  }

  /**
   * Create a new param.
   * @param {string} _name Name of param
   * @returns {Param} Created param
   */
  createParam( _name, _data ) {
    const param = new Param( {
      automaton: this,
      data: _data
    } );
    Vue.set( this.__params, _name, param );
    return param;
  }

  /**
   * Delete a param.
   * @param {string} _name Name of param
   * @returns {void} void
   */
  deleteParam( _name ) {
    Vue.delete( this.__params, _name );
  }

  /**
   * Get a param.
   * @param {string} _name Name of the param
   * @returns {Param} Param object
   */
  getParam( _name ) {
    return this.__params[ _name ] || null;
  }

  /**
   * Return list of name of params. Sorted.
   * @returns {Array} List of name of params
   */
  getParamNames() {
    let arr = [];
    for ( const name in this.__params ) { arr.push( name ); }
    arr = arr.sort();
    return arr;
  }

  /**
   * Return count of params.
   * @returns {number} Count of params
   */
  countParams() {
    let sum = 0;
    for ( const name in this.__params ) { sum ++; }
    return sum;
  }

  /**
   * Assigned to `Automaton.auto` at constructor.
   * @param {string} _name name of the param
   * @returns {number} Current value of the param
   * @protected
   */
  __auto( _name ) {
    let param = this.__params[ _name ];
    if ( !param ) { param = this.createParam( _name ); }
    param.__used = true;
    return param.getValue();
  }

  /**
   * Export current state as object.
   * @returns {object} Saved object
   * @example
   * あとでやる
   * @todo はい
   */
  save() {
    const obj = this.data;

    obj.params = {};
    for ( let name in this.__params ) {
      const param = this.__params[ name ];
      obj.params[ name ] = param.nodes;
    }

    return JSON.parse( JSON.stringify( obj ) );
  }
};

module.exports = AutomatonWithGUI;
AutomatonWithGUI.default = AutomatonWithGUI;