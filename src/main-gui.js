import compat from "./compat";

import AutomatonClock from "./clock";
import AutomatonClockFrame from "./clock-frame";
import AutomatonClockRealtime from "./clock-realtime";

import AutomatonParam from "./param";

import Automaton from "./main.js";

import Vue from "vue";
import GUI from "./gui.vue";

/**
 * IT'S AUTOMATON!
 * @param {object} [_props]
 * @param {boolean} [_props.loop] Whether let the time loop or not
 * @param {number} ]_props.fps] If this is set, the clock will become frame mode
 * @param {boolean} [_props.realtime] If this is true, the clock will become realtime mode
 * @param {function} [_props.onSeek] Will call when the method seek() is called
 * @param {function} [_props.onPlay] Will call when the method play() is called
 * @param {function} [_props.onPause] Will call when the method pause() is called
 * @param {DOM} [_props.gui] DOM element where you want to attach the Automaton GUI
 * @param {string} [_props.data] Data of the automaton in JSON format. Required in noGUI mode
 */
let AutomatonWithGUI = class extends Automaton {
  constructor( _props ) {
    super( _props || {} );

    this.history = [];
    this.historyIndex = 0;

    if ( this.props.gui ) { this.prepareGUI( this.props.gui ); }
  }

  /**
   * Load props object.
   * @param {object} _props Props object of constructor
   */
  loadProps( _props ) {
    this.props = _props;
    this.data = compat( this.props.data ); // with compatibility check

    this.clock = (
      this.props.fps ? new AutomatonClockFrame( this, fps ) :
      this.props.realtime ? new AutomatonClockRealtime( this ) :
      new AutomatonClock( this )
    );

    // loads params from data
    this.params = {};
    for ( let name in this.data.params ) {
      let param = new AutomatonParam( this );
      param.load( this.data.params[ name ] );
      this.params[ name ] = param;
    }
  }

  /**
   * Prepare GUI.
   * @param {DOM} _target DOM element where you want to attach the Automaton GUI
   */
  prepareGUI( _target ) {
    let el = document.createElement( "div" );
    _target.appendChild( el );
    this.vue = new Vue( {
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

  // ------
  
  /**
   * Operate something and put the operation into the history stack.
   * @param {string} _desc Description of the operation
   * @param {function} _do Operation
   * @param {function} _undo Operation that undoes the _do
   * @returns {any} Result of _do
   */
  operate( _desc, _do, _undo ) {
    this.history.splice( this.historyIndex );
    this.history.push( { do: _do, undo: _undo } );
    this.historyIndex ++;
    return _do();
  }

  /**
   * Undo the operation based on history
   * @returns {any} Result of _undo
   */
  undo() {
    if ( this.historyIndex <= 0 ) { return; }
    this.historyIndex --;
    return this.history[ this.historyIndex ].undo();
  }

  /**
   * Redo the operation based on history
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

  // ------

  /**
   * Set new length.
   * Some nodes might be automatically removed.
   * @param {number} _len new length
   */
  setLength( _len ) {
    // if len is invalid then throw error
    if ( isNaN( _len ) ) {
      throw "Automaton.setLength: _len is invalid"
    }

    for ( let paramName in this.params ) {
      let param = this.params[ paramName ];

      // remove loose ends
      for ( let iNode = param.nodes.length - 1; 0 < iNode; iNode -- ) {
        let node = param.nodes[ iNode ];
        if ( _len < node.time ) {
          param.nodes.splice( iNode, 1 );
        }
      }

      // generate a new end
      let lastNode = param.nodes[ param.nodes.length - 1 ];
      if ( lastNode.time !== _len ) {
        param.addNode( _len, 0.0 );
      }
    }

    // finally set the length
    this.length = _len;

    // It's irreversible operation, sorry.
    this.dropHistory();
  }

  // ------
  
  /**
   * Create a new param.
   * @param {string} _name Name of param
   * @returns {AutomatonParam} Created param
   */
  createParam( _name ) {
    let param = new AutomatonParam( this );
    Vue.set( this.params, _name, param );
    return param;
  }

  /**
   * Delete a param.
   * @param {string} _name Name of param
   */
  deleteParam ( _name ) {
    Vue.delete( this.params, _name );
  }

  /**
   * Return list of name of params. Sorted.
   * @returns {Array} List of name of params
   */
  getParamNames() {
    let arr = [];
    for ( let name in this.params ) { arr.push( name ); }
    arr = arr.sort();
    return arr;
  };

  /**
   * Return count of params.
   * @returns {number} Count of params
   */
  countParams() {
    let sum = 0;
    for ( let name in this.params ) { sum ++; }
    return sum;
  };

  // ------

  /**
   * Render all params.
   */
  renderAll() {
    for ( let name in this.params ) { this.params[ name ].render(); }
  };

  /**
   * Assigned to Automaton.auto at constructor.
   * It's mighty auto function!
   * It creates a new param automatically if there are no param called _name.
   * Otherwise it returns current value of the param called _name.
   * @param {string} _name name of the param
   * @returns {number} Current value of the param
   */
  __auto( _name ) {
    let param = this.params[ _name ];
    if ( !param ) { param = this.createParam( _name ); }
    param.used = true;
    return param.currentValue;
  };

  // ------

  /**
   * Export current state as object.
   * @returns {object} Saved object
   */
  save() {
    let obj = this.data;

    obj.params = {};
    for ( let name in this.params ) {
      let param = this.params[ name ];
      obj.params[ name ] = param.nodes;
    }

    return JSON.parse( JSON.stringify( obj ) );
  }
};

module.exports = AutomatonWithGUI;
AutomatonWithGUI.default = AutomatonWithGUI;