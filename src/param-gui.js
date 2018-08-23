import jsonCopy from './json-copy';
import ass from './ass';
import genId from './gen-id';
import hasOverwrap from './has-overwrap';

import Automaton from './main-gui';
import Param from './param';

import Vue from 'vue';

/**
 * It represents a param of Automaton.
 * It's `automaton.js` and `automaton.min.js` version.
 * It has even more pretty APIs yay
 * @param {Object} _props
 * @param {Automaton} _props.automaton Parent automaton
 * @param {Object} [_props.data] Data of the param. Don't worry, I can generate an initial data for you!
 */
const ParamWithGUI = class extends Param {
  constructor( _props ) {
    const props = Object.assign( {}, _props );
    const len = _props.automaton.length;
    props.data = props.data ? props.data : {
      nodes: [
        {
          time: 0.0,
          value: 0.0,
          out: { time: ParamWithGUI.DEFAULT_HANDLE_LENGTH, value: 0.0 }
        },
        {
          time: len,
          value: 0.0,
          in: { time: -ParamWithGUI.DEFAULT_HANDLE_LENGTH, value: 0.0 }
        }
      ],
      fxs: []
    };

    super( props );

    /**
     * True if the param is used once at least in current session.
     * Can be operated by {@link ParamWithGUI#markAsUsed}.
     * @type {boolean}
     * @protected
     */
    this.__isUsed = false;
  }

  /**
   * Load a param data.
   * @param {object} _data Data of param
   * @returns {void} void
   */
  load( _data ) {
    const data = jsonCopy( _data );
    super.load( data );

    this.__nodes.forEach( ( node ) => node.$id = genId() );
    this.__fxs.forEach( ( fx ) => fx.$id = genId() );
  }

  /**
   * Precalculate values.
   * @returns {void} void
   */
  precalc() {
    super.precalc();
    this.__automaton.pokeRenderer();
  }

  /**
   * Mark this param as used.
   * @returns {void} void
   */
  markAsUsed() {
    this.__isUsed = true;
  }

  /**
   * Return whether this is used param or not.
   * @returns {bool} True if the param is used at least once in current session
   */
  isUsed() {
    return this.__isUsed;
  }

  /**
   * Sort nodes by time.
   * @returns {void} void
   * @protected
   */
  __sortNodes() {
    this.__nodes = this.__nodes.sort( ( a, b ) => a.time - b.time );
  }

  /**
   * Search for node that has given id then return index of it.
   * If it couldn't find the node, it will throw an error instead.
   * @param {number} _id Id of node you want to grab
   * @protected
   */
  __getNodeIndexById( _id ) {
    const index = this.__nodes.findIndex( ( node ) => node.$id === _id );
    if ( index === -1 ) { throw new Error( `Searched for node id: ${_id} but not found` ); }
    return index;
  }

  /**
   * Return how many node the param currently have.
   * @returns {number} Nodes count
   */
  getNumNode() {
    return this.__nodes.length;
  }

  /**
   * Dump data of a node.
   * @param {string} _id Id of the node you want to dump
   * @returns {object} Data of the node
   */
  dumpNode( _id ) {
    const index = this.__getNodeIndexById( _id );
    return jsonCopy( this.__nodes[ index ] );
  }

  /**
   * Dump data of nodes.
   * @returns {object[]} Data of nodes
   */
  dumpNodes() {
    return jsonCopy( this.__nodes );
  }

  /**
   * Dump data of nodes, without `$id`.
   * @returns {object[]} Data of nodes
   */
  dumpNodesWithoutId() {
    let nodes = this.dumpNodes();
    return nodes.map( ( node ) => {
      delete node.$id;
      return node;
    } );
  }

  /**
   * Create a node.
   * @param {number} _time Time of new node
   * @param {number} _value Value of new node
   * @returns {string} Id of the new node
   */
  createNode( _time, _value ) {
    const data = {
      $id: genId(),
      time: _time,
      value: _value,
      in: { time: -ParamWithGUI.DEFAULT_HANDLE_LENGTH, value: 0.0 },
      out: { time: ParamWithGUI.DEFAULT_HANDLE_LENGTH, value: 0.0 }
    };
    this.__nodes.push( data );
    this.__sortNodes();

    this.precalc();

    return data.$id;
  }

  /**
   * Create a node from dumped data.
   * @param {object} _obj Dumped node data
   * @returns {string} Id of the new node
   */
  createNodeFromData( _obj ) {
    const data = jsonCopy( _obj );
    this.__nodes.push( data );
    this.__sortNodes();

    this.precalc();

    return data.$id;
  }

  /**
   * Remove a node.
   * @param {string} _id Id of the node you want to remove
   * @returns {void} void
   */
  removeNode( _id ) {
    const index = this.__getNodeIndexById( _id );

    this.__nodes.splice( index, 1 );

    this.precalc();
  }

  /**
   * Move a node.
   * @param {string} _id Id of the node you want to move
   * @param {number} _time Time
   * @param {number} _value Value
   * @returns {void} void
   */
  moveNode( _id, _time, _value ) {
    const index = this.__getNodeIndexById( _id );

    const node = this.__nodes[ index ];

    let time = typeof _time === 'number' ? _time : node.time;
    if ( index === 0 ) {
      time = 0;
    } else if ( index === this.__nodes.length - 1 ) {
      time = this.__automaton.length;
    } else {
      time = Math.min( Math.max( time, this.__nodes[ index - 1 ].time ), this.__nodes[ index + 1 ].time );
    }
    node.time = time;

    node.value = typeof _value === 'number' ? _value : node.value;

    this.precalc();
  }

  /**
   * Move a handle of a node.
   * @param {string} _id Id of the node you want to operate
   * @param {boolean} _isOut Input handle if false, output handle if true
   * @param {number} _time Time
   * @param {number} _value Value
   * @returns {void} void
   */
  moveHandle( _id, _isOut, _time, _value ) {
    const index = this.__getNodeIndexById( _id );

    if (
      ( index === 0 && ( !_isOut ) ) ||
      ( index === ( this.getNumNode() - 1 ) && _isOut )
    ) { return; }

    const node = this.__nodes[ index ];
    const handle = _isOut ? node.out : node.in;

    let time = typeof _time === 'number' ? _time : handle.time;
    if ( _isOut ) {
      time = Math.max( 0.0, time );
    } else {
      time = Math.min( 0.0, time );
    }
    handle.time = time;

    handle.value = typeof _value === 'number' ? _value : handle.value;

    this.precalc();
  }

  /**
   * Reset a handle of a node.
   * @param {string} _id Id of the node you want to operate
   * @param {boolean} _isOut Input handle if false, output handle if true
   * @returns {void} void
   */
  resetHandle( _id, _isOut ) {
    const index = this.__getNodeIndexById( _id );

    if (
      ( index === 0 && ( !_isOut ) ) ||
      ( index === ( this.getNumNode() - 1 ) && _isOut )
    ) { return; }

    const node = this.__nodes[ index ];
    const handle = _isOut ? node.out : node.in;

    handle.time = ( _isOut ? 1.0 : -1.0 ) * ParamWithGUI.DEFAULT_HANDLE_LENGTH;
    handle.value = 0.0;

    this.precalc();
  }

  /**
   * Sort fxs by time.
   * @returns {void} void
   * @protected
   */
  __sortFxs() {
    this.__fxs = this.__fxs.sort( ( a, b ) => a.time - b.time ).sort( ( a, b ) => a.row - b.row );
  }

  /**
   * Search for fx that has given id then return index of it.
   * If it couldn't find the fx, it will throw an error instead.
   * @param {number} _id Id of fx you want to grab
   * @protected
   */
  __getFxIndexById( _id ) {
    const index = this.__fxs.findIndex( ( fx ) => fx.$id === _id );
    if ( index === -1 ) { throw new Error( `Searched for fx id: ${_id} but not found` ); }
    return index;
  }

  /**
   * Search for vacance fx row for given time and length.
   * @param {number} _time Beginning time of fx
   * @param {number} _length Length of fx
   * @param {number} [_row=0] If given, rows lower than this value will not be searched.
   * @returns {number} Minimal free fx row
   * @protected
   */
  __getFreeRow( _time, _length, _row ) {
    let row = _row || 0;
    for ( let iFx = 0; iFx < this.__fxs.length; iFx ++ ) {
      const fx = this.__fxs[ iFx ];
      if ( fx.row < row ) { continue; }
      if ( row < fx.row ) { break; }
      if ( hasOverwrap( _time, _length, fx.time, fx.length ) ) {
        row ++;
      }
    }
    return row;
  }

  /**
   * Dump data of a fx.
   * @param {number} _id Id of a fx you want to dump
   * @returns {object} Data of the fx
   */
  dumpFx( _id ) {
    const index = this.__getFxIndexById( _id );
    return jsonCopy( this.__fxs[ index ] );
  }

  /**
   * Dump data of fxs.
   * @returns {object[]} Data of fxs
   */
  dumpFxs() {
    return jsonCopy( this.__fxs );
  }

  /**
   * Dump data of fxs, without `$id`.
   * @returns {object[]} Data of fxs
   */
  dumpFxsWithoutId() {
    let fxs = this.dumpFxs();
    return fxs.map( ( fx ) => {
      delete fx.$id;
      return fx;
    } );
  }

  /**
   * Create a fx.
   * If it couldn't create param, it will return empty string instead.
   * @param {number} _time Beginning time of new fx
   * @param {number} _length Length of new fx
   * @param {string} _def Definition id (kind) of new fx
   * @returns {string} Id of the new fx
   */
  createFx( _time, _length, _def ) {
    let row = this.__getFreeRow( _time, _length );
    if ( ParamWithGUI.FX_ROW_MAX < row ) {
      console.error( 'Too many fx stacks at here!' );
      return '';
    }

    const data = {
      $id: genId(),
      time: _time,
      length: _length,
      row: row,
      def: _def,
      params: this.__automaton.generateDefaultFxParams( _def )
    };
    this.__fxs.push( data );
    this.__sortFxs();

    this.precalc();

    return data.$id;
  }

  /**
   * Create a fx from dumped data.
   * If it couldn't create param, it will return empty string instead.
   * @param {object} _obj Dumped fx data
   * @returns {string} Id of the new fx
   */
  createFxFromData( _obj ) {
    let row = this.__getFreeRow( _obj.time, _obj.length, _obj.row );
    if ( ParamWithGUI.FX_ROW_MAX < row ) {
      console.error( 'Too many fx stacks at here!' );
      return '';
    }

    let data = jsonCopy( _obj );
    data.row = row;
    this.__fxs.push( data );
    this.__sortFxs();

    this.precalc();

    return data.$id;
  }

  /**
   * Remove a fx.
   * @param {string} _id Id of the fx you want to remove
   * @returns {void} void
   */
  removeFx( _id ) {
    const index = this.__getFxIndexById( _id );

    this.__fxs.splice( index, 1 );

    this.precalc();
  }

  /**
   * Move a fx.
   * @param {string} _id Id of the fx you want to move
   * @param {number} _time Beginning time
   * @returns {void} void
   */
  moveFx( _id, _time ) {
    const index = this.__getFxIndexById( _id );

    const fx = this.__fxs[ index ];

    const sameRow = this.__fxs.filter( ( fxOp ) => fxOp.row === fx.row );
    const indexInRow = sameRow.indexOf( fx );
    const prev = sameRow[ indexInRow - 1 ];
    const next = sameRow[ indexInRow + 1 ];

    const left = prev ? ( prev.time + prev.length ) : 0.0;
    const right = next ? next.time : this.__automaton.length;
    fx.time = Math.min( Math.max( _time, left ), right - fx.length );

    this.precalc();
  }

  /**
   * Change row of a fx.
   * @param {string} _id Id of the fx you want to move
   * @param {number} _row Row
   * @returns {void} void
   */
  changeFxRow( _id, _row ) {
    const index = this.__getFxIndexById( _id );

    if ( _row < 0 || ParamWithGUI.FX_ROW_MAX < _row ) {
      throw new Error( `Row number ${_row} is invalid` );
    }

    const fx = this.__fxs[ index ];
    if ( fx.row === _row ) { return; }

    const sameRow = this.__fxs.filter( ( fxOp ) => fxOp.row === _row );
    const isValid = sameRow.every( ( fxOp ) => (
      !( fxOp.time < fx.time && fx.time < ( fxOp.time + fxOp.length ) ) &&
      !( fxOp.time < ( fx.time + fx.length ) && ( fx.time + fx.length ) < ( fxOp.time + fxOp.length ) ) &&
      !( fx.time < fxOp.time && fxOp.time < ( fx.time + fx.length ) ) &&
      !( fx.time < ( fxOp.time + fxOp.length ) && ( fxOp.time + fxOp.length ) < ( fx.time + fx.length ) )
    ) );

    if ( !isValid ) { return; }

    fx.row = _row;
    this.__sortFxs();

    this.precalc();
  }

  /**
   * Bypass or unbypass a fx.
   * @param {string} _id Id of the fx you want to change
   * @param {boolean} _bypass If true, fx will be bypassed
   * @returns {void} void
   */
  bypassFx( _id, _bypass ) {
    const index = this.__getFxIndexById( _id );

    const fx = this.__fxs[ index ];
    Vue.set( fx, 'bypass', !!_bypass );

    this.precalc();
  }

  /**
   * Change a param of a fx.
   * @param {string} _id Id of the fx you want to change
   * @param {string} _name Name of the param you want to change
   * @param {any} _value Your desired value
   * @returns {void} void
   */
  changeFxParam( _id, _name, _value ) {
    const index = this.__getFxIndexById( _id );

    const fx = this.__fxs[ index ];
    const params = this.__automaton.getFxDefinitionParams( fx.def );

    let value = _value;
    if ( typeof params[ _name ].min === 'number' ) { value = Math.max( params[ _name ].min, value ); }
    if ( typeof params[ _name ].max === 'number' ) { value = Math.min( params[ _name ].max, value ); }
    Vue.set( fx.params, _name, value );

    this.precalc();
  }

  /**
   * Move a fx --force.
   * Best for undo-redo operation. probably.
   * @param {string} _id Id of the fx you want to move
   * @param {number} _time Beginning time
   * @param {number} _row Row
   * @returns {void} void
   */
  forceMoveFx( _id, _time, _row ) {
    const index = this.__getFxIndexById( _id );

    const fx = this.__fxs[ index ];

    fx.time = _time;
    fx.row = _row;
    this.__sortFxs();

    this.precalc();
  }

  /**
   * Resize a fx.
   * @param {string} _id Index of the fx you want to resize
   * @param {number} _length Length
   * @returns {void} void
   */
  resizeFx( _id, _length ) {
    const index = this.__getFxIndexById( _id );

    const fx = this.__fxs[ index ];

    const sameRow = this.__fxs.filter( ( fxOp ) => fxOp.row === fx.row );
    const indexInRow = sameRow.indexOf( fx );
    const next = sameRow[ indexInRow + 1 ];

    const right = next ? next.time : this.__automaton.length;

    fx.length = Math.min( Math.max( _length, 0.0 ), right - fx.time );

    this.precalc();
  }

  /**
   * Resize a fx by left side of the end.
   * It's very GUI dev friendly method. yeah.
   * @param {string} _id Index of the fx you want to resize
   * @param {number} _length Length
   * @returns {void} void
   */
  resizeFxByLeft( _id, _length ) {
    const index = this.__getFxIndexById( _id );

    const fx = this.__fxs[ index ];
    const end = fx.time + fx.length;

    const sameRow = this.__fxs.filter( ( fxOp ) => fxOp.row === fx.row );
    const indexInRow = sameRow.indexOf( fx );
    const prev = sameRow[ indexInRow - 1 ];

    const left = prev ? ( prev.time + prev.length ) : 0.0;

    fx.length = Math.min( Math.max( _length, 0.0 ), end - left );
    fx.time = end - fx.length;

    this.precalc();
  }

  /**
   * Call when you need to change automaton length.
   * This is very hardcore method. Should not be called by anywhere except {@link AutomatonWithGUI#setLength}.
   * @param {number} _length Desired length
   * @returns {void} void
   */
  changeLength( _length ) {
    for ( let i = this.__nodes.length - 1; 0 <= i; i -- ) {
      const node = this.__nodes[ i ];
      if ( _length < node.time ) {
        this.__nodes.splice( i, 1 );
      } else if ( node.time === _length ) {
        delete node.out;
        break;
      } else {
        const lastNode = this.__nodes[ this.__nodes.length - 1 ];
        if ( lastNode ) {
          lastNode.out = { time: ParamWithGUI.DEFAULT_HANDLE_LENGTH, value: 0.0 };
        }

        this.__nodes.push( {
          time: _length,
          value: 0.0,
          in: { time: -ParamWithGUI.DEFAULT_HANDLE_LENGTH, value: 0.0 }
        } );
        break;
      }
    }

    for ( let i = this.__fxs.length - 1; 0 <= i; i -- ) {
      const fx = this.__fxs[ i ];
      if ( _length < fx.time ) {
        this.__fxs.splice( i, 1 );
      } else if ( _length < fx.time + fx.length ) {
        fx.length = _length - fx.time;
      }
    }

    this.precalc();
  }
};

/**
 * Handles of a new node will be created in this length.
 * @type {number}
 * @constant
 */
ParamWithGUI.DEFAULT_HANDLE_LENGTH = 0.5;
ParamWithGUI.FX_ROW_MAX = 4;

export default ParamWithGUI;