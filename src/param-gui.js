import jsonCopy from './json-copy';
import ass from './ass';

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
  }

  /**
   * If the index of node is invalid, throw an error.
   * @param {number} _index Index of node
   * @protected
   */
  __validateNodeIndex( _index ) {
    ass(
      0 <= _index && _index < this.__nodes.length,
      'Invalid node index: ' + _index
    );
  }

  /**
   * Sort nodes by time.
   * @protected
   */
  __sortNodes() {
    this.__nodes = this.__nodes.sort( ( a, b ) => a.time - b.time );
  }

  /**
   * Set a property to an object / array;
   * @param {Object|Array} _target Target object / array
   * @param {number|string} _key Key
   * @param {any} _value Value
   * @protected
   */
  __set( _target, _key, _value ) {
    Vue.set( _target, _key, _value );
  }

  /**
   * Return how many node the param currently have.
   */
  getNumNode() {
    return this.__nodes.length;
  }

  /**
   * Precalculate values.
   */
  precalc() {
    super.precalc();

    if ( this.__automaton.__vue ) {
      this.__automaton.__vue.$emit( 'precalc' );
    }
  }

  /**
   * Dump data of a node.
   * @param {number} _index Index of a node you want to dump
   * @returns {object} Data of the node
   */
  dumpNode( _index ) {
    return jsonCopy( this.__nodes[ _index ] );
  }

  /**
   * Create a node.
   * @param {number} _time Time of new node
   * @param {number} _value Value of new node
   * @returns {number} Index of the new node
   */
  createNode( _time, _value ) {
    const data = {
      time: _time,
      value: _value,
      in: { time: -ParamWithGUI.DEFAULT_HANDLE_LENGTH, value: 0.0 },
      out: { time: ParamWithGUI.DEFAULT_HANDLE_LENGTH, value: 0.0 }
    };
    this.__nodes.push( data );
    this.__sortNodes();

    this.precalc();

    return this.__nodes.indexOf( data );
  }

  /**
   * Create a node from dumped data.
   * @param {object} _obj Dumped node data
   */
  createNodeFromData( _obj ) {
    this.__nodes.push( jsonCopy( _obj ) );
    this.__sortNodes();

    this.precalc();
  }

  /**
   * Remove a node.
   * @param {number} _index Index of node
   */
  removeNode( _index ) {
    this.__validateNodeIndex( _index );

    this.__nodes.splice( _index, 1 );

    this.precalc();
  }

  /**
   * Move a node.
   * @param {number} _index Index of node
   * @param {number} _time Time
   * @param {number} _value Value
   */
  moveNode( _index, _time, _value ) {
    this.__validateNodeIndex( _index );

    const node = this.__nodes[ _index ];

    let time = typeof _time === 'number' ? _time : node.time;
    if ( _index === 0 ) {
      time = 0;
    } else if ( _index === this.__nodes.length - 1 ) {
      time = this.__automaton.length;
    } else {
      time = Math.min( Math.max( time, this.__nodes[ _index - 1 ].time ), this.__nodes[ _index + 1 ].time );
    }
    node.time = time;

    node.value = typeof _value === 'number' ? _value : node.value;

    this.precalc();
  }

  /**
   * Move a handle of a node.
   * @param {number} _index Index of node
   * @param {boolean} _isOut Input handle if false, output handle if true
   * @param {number} _time Time
   * @param {number} _value Value
   */
  moveHandle( _index, _isOut, _time, _value ) {
    this.__validateNodeIndex( _index );

    if (
      ( _index === 0 && ( !_isOut ) ) ||
      ( _index === ( this.getNumNode() - 1 ) && _isOut )
    ) { return; }

    const node = this.__nodes[ _index ];
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
   * @param {number} _index Index of node
   * @param {boolean} _isOut Input handle if false, output handle if true
   */
  resetHandle( _index, _isOut ) {
    this.__validateNodeIndex( _index );

    if (
      ( _index === 0 && ( !_isOut ) ) ||
      ( _index === ( this.getNumNode() - 1 ) && _isOut )
    ) { return; }

    const node = this.__nodes[ _index ];
    const handle = _isOut ? node.out : node.in;

    handle.time = ( _isOut ? 1.0 : -1.0 ) * ParamWithGUI.DEFAULT_HANDLE_LENGTH;
    handle.value = 0.0;

    this.precalc();
  }

  /**
   * If the index of fx is invalid, throw an error.
   * @param {number} _index Index of fx
   * @protected
   */
  __validateFxIndex( _index ) {
    ass(
      0 <= _index && _index < this.__fxs.length,
      'Invalid fx index: ' + _index
    );
  }

  /**
   * Sort nodes by time.
   * @protected
   */
  __sortFxs() {
    this.__fxs = this.__fxs.sort( ( a, b ) => a.time - b.time ).sort( ( a, b ) => a.row - b.row );
  }

  /**
   * Dump data of a fx.
   * @param {number} _index Index of a fx you want to dump
   * @returns {object} Data of the fx
   */
  dumpFx( _index ) {
    return jsonCopy( this.__fxs[ _index ] );
  }

  /**
   * Remove a fx.
   * @param {number} _index Index of node
   */
  removeFx( _index ) {
    this.__validateFxIndex( _index );

    this.__fxs.splice( _index, 1 );

    this.precalc();
  }

  /**
   * Move a fx.
   * @param {number} _index Index of node
   * @param {number} _time Beginning time
   */
  moveFx( _index, _time ) {
    this.__validateFxIndex( _index );

    const fx = this.__fxs[ _index ];

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
   * CAUTION! Index can be changed after perform this method!
   * @param {number} _index Index of node
   * @param {number} _row Row
   * @returns {number} New index
   */
  changeFxRow( _index, _row ) {
    this.__validateFxIndex( _index );
    if ( _row < 0 || 4 < _row ) { return _index; }

    const fx = this.__fxs[ _index ];
    if ( fx.row === _row ) { return _index; }

    const sameRow = this.__fxs.filter( ( fxOp ) => fxOp.row === _row );
    const isValid = sameRow.every( ( fxOp ) => (
      !( fxOp.time < fx.time && fx.time < ( fxOp.time + fxOp.length ) ) &&
      !( fxOp.time < ( fx.time + fx.length ) && ( fx.time + fx.length ) < ( fxOp.time + fxOp.length ) ) &&
      !( fx.time < fxOp.time && fxOp.time < ( fx.time + fx.length ) ) &&
      !( fx.time < ( fxOp.time + fxOp.length ) && ( fxOp.time + fxOp.length ) < ( fx.time + fx.length ) )
    ) );

    if ( !isValid ) { return _index; }

    fx.row = _row;
    this.__sortFxs();

    this.precalc();
    return this.__fxs.indexOf( fx );
  }

  /**
   * Move a fx --force.
   * @param {number} _index Index of node
   * @param {number} _time Beginning time
   * @param {number} _row Row
   * @returns {number} New index
   */
  forceMoveFx( _index, _time, _row ) {
    this.__validateFxIndex( _index );

    const fx = this.__fxs[ _index ];

    fx.time = _time;
    fx.row = _row;
    this.__sortFxs();

    this.precalc();
    return this.__fxs.indexOf( fx );
  }

  /**
   * Resize a fx.
   * @param {number} _index Index of node
   * @param {number} _length Length
   */
  resizeFx( _index, _length ) {
    this.__validateFxIndex( _index );

    const fx = this.__fxs[ _index ];

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
   * @param {number} _index Index of node
   * @param {number} _length Length
   */
  resizeFxByLeft( _index, _length ) {
    this.__validateFxIndex( _index );

    const fx = this.__fxs[ _index ];
    const end = fx.time + fx.length;

    const sameRow = this.__fxs.filter( ( fxOp ) => fxOp.row === fx.row );
    const indexInRow = sameRow.indexOf( fx );
    const prev = sameRow[ indexInRow - 1 ];

    const left = prev ? ( prev.time + prev.length ) : 0.0;

    fx.length = Math.min( Math.max( _length, 0.0 ), end - left );
    fx.time = end - fx.length;

    this.precalc();
  }
};

/**
 * Handles of a new node will be created in this length.
 * @type {number}
 * @constant
 */
ParamWithGUI.DEFAULT_HANDLE_LENGTH = 0.5;

export default ParamWithGUI;