import ass from './ass';

import Automaton from './main-gui';
import Param from './param';

// 🔥 あとでAssignに変える
let cloneObj = ( _obj ) => {
  if ( typeof _obj !== 'object' ) { return _obj; }
  let obj = {};
  for ( let key in _obj ) {
    obj[ key ] = _obj[ key ];
  }
  return obj;
};

/**
 * It represents a param of Automaton.
 * It's `automaton.js` and `automaton.min.js` version.
 * It has even more pretty APIs yay
 * @param {Object} _props
 * @param {Automaton} _props.automaton Parent automaton
 * @param {Object} [_props.data] Data of the param. Don't worry, I can generate an initial data for you!
 */
let ParamWithGUI = class extends Param {
  constructor( _props ) {
    let props = Object.assign( {}, _props );
    props.data = props.data ? props.data : {
      nodes: [
        { time: 0.0, value: 0.0, out: { time: 0.0, value: 0.0 } },
        { time: _props.automaton.length, value: 0.0, in: { time: 0.0, value: 0.0 } }
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
      0 < _index && _index < this.__nodes.length,
      'Invalid node index'
    );
  }

  /**
   * Sort nodes by time.
   * @protected
   */
  __sortNodes() {
    this.__nodes.sort( ( a, b ) => a.time - b.time );
  }
};

// ------

export default ParamWithGUI;