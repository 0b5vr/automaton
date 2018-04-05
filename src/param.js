import Interpolator from "./interpolator";

// 🔥 あとでDocs書く

// 🔥 あとでAssignに変える
let cloneObj = ( _obj ) => {
  if ( typeof _obj !== "object" ) { return _obj; }
  let obj = {};
  for ( let key in _obj ) {
    obj[ key ] = _obj[ key ];
  }
  return obj;
}

/**
 * Param of Automaton. 🔥 DOCS: WIP 🔥
 * @param {Automaton} _automaton Parent automaton object
 */
let Param = class {
  constructor( _automaton ) {
    this.automaton = _automaton;

    this.values = [];
    let arrayLength = Math.ceil( this.automaton.data.resolution * this.automaton.data.length ) + 1;
    for ( let i = 0; i < arrayLength; i ++ ) {
      this.values[ i ] = 0.0;
    }
    this.nodes = [];

    this.addNode( 0.0, 0.0 );
    this.addNode( this.automaton.data.length, 0.0 );

    this.currentValue = 0.0;

    this.render();
  }

  /**
   * If the index of node is invalid, throw an error.
   * @param {number} _index Index of node
   */
  validateNodeIndex( _index ) {
    if ( _index < 0 || this.nodes.length <= _index ) {
      throw "Automaton: invalid index of the parameter";
    }

  }

  load( _data ) {
    this.nodes = _data;
    this.render();
  }

  sortNodes() {
    this.nodes.sort( ( a, b ) => a.time - b.time );
  }

  render() {
    this.values = [];

    for ( let i = 1; i < this.nodes.length; i ++ ) {
      let startt = this.nodes[ i - 1 ].time;
      let starti = Math.floor( startt * this.automaton.data.resolution );

      let endt = this.nodes[ i ].time;
      let endi = Math.floor( endt * this.automaton.data.resolution );

      let reset = i === 1 || this.nodes[ i ].mods[ Interpolator.MOD_RESET ];
      let resetVel = this.nodes[ i ].mods[ Interpolator.MOD_RESET ] ? this.nodes[ i ].mods[ Interpolator.MOD_RESET ].velocity : 0.0;
      let deltaTime = 1.0 / this.automaton.data.resolution;

      let iparam = {
        mode: this.nodes[ i ].mode,
        start: reset ? this.nodes[ i - 1 ].value : this.values[ starti ],
        end: this.nodes[ i ].value,
        deltaTime: deltaTime,
        length: endi - starti + 1,
        vel: ( !reset && 2 < this.values.length ) ? ( this.values[ this.values.length - 1 ] - this.values[ this.values.length - 2 ] ) / deltaTime : resetVel,
        mods: this.nodes[ i ].mods
      };
      for ( let key in this.nodes[ i ].params ) {
        iparam[ key ] = this.nodes[ i ].params[ key ];
      }

      let arr = Interpolator.generate( iparam );
      this.values.pop();

      this.values = this.values.concat( arr );
    }
  }

  addNode( _time, _value ) {
    let next = this.nodes.filter( node => _time < node.time )[ 0 ];
    if ( !next ) {
      next = {
        mode: Interpolator.MODE_LINEAR,
        params: {},
        mods: []
      };
      for ( let i = 0; i < Interpolator.MODS; i ++ ) {
        next.mods[ i ] = false;
      }
    }

    let node = {
      time: _time,
      value: _value,
      mode: next.mode,
      params: cloneObj( next.params ),
      mods: next.mods.map( _obj => cloneObj( _obj ) )
    };
    this.nodes.push( node );

    this.sortNodes();
    this.render();

    return node;
  }

  setTime( _index, _time ) {
    this.validateNodeIndex( _index );

    if ( _index !== 0 && this.nodes.length - 1 !== _index ) {
      this.nodes[ _index ].time = Math.min(
        Math.max(
          _time,
          this.nodes[ _index - 1 ].time + 1.0 / this.automaton.data.resolution
        ),
        this.nodes[ _index + 1 ].time - 1.0 / this.automaton.data.resolution
      );
      this.render();
    }

    return this.nodes[ _index ].time;
  }

  setValue( _index, _value ) {
    this.validateNodeIndex( _index );

    this.nodes[ _index ].value = _value;

    this.render();

    return this.nodes[ _index ].value;
  }

  copyProps( _index, _node ) {
    this.validateNodeIndex( _index );

    let node = this.nodes[ _index ];
    node.mode = _node.mode;
    node.params = cloneObj( _node.params );
    node.mods = _node.mods.map( _obj => cloneObj( _obj ) );

    this.render();
  }

  setMode( _index, _mode ) {
    this.validateNodeIndex( _index );

    let node = this.nodes[ _index ];
    node.mode = _mode;
    if ( _mode === Interpolator.MODE_HOLD ) {
      node.params = {};
    } else if ( _mode === Interpolator.MODE_LINEAR ) {
      node.params = {};
    } else if ( _mode === Interpolator.MODE_SMOOTH ) {
      node.params = {};
    } else if ( _mode === Interpolator.MODE_EXP ) {
      node.params = {
        factor: 10.0
      };
    } else if ( _mode === Interpolator.MODE_SPRING ) {
      node.params = {
        rate: 500.0,
        damp: 1.0
      };
    } else if ( _mode === Interpolator.MODE_GRAVITY ) {
      node.params = {
        gravity: 70.0,
        bounce: 0.3
      };
    }

    this.render();
  }

  setParam( _index, _key, _value ) {
    this.validateNodeIndex( _index );

    this.nodes[ _index ].params[ _key ] = _value;

    this.render();
  }

  setParams( _index, _params ) {
    this.validateNodeIndex( _index );

    for ( let key in _params ) {
      this.nodes[ _index ].params[ key ] = _params[ key ];
    }

    this.render();
  }

  activeModParams( _index, _mod, _active ) {
    this.validateNodeIndex( _index );
    if ( _mod < 0 || Interpolator.MODS <= _mod ) { return; }

    if ( _active ) {
      this.nodes[ _index ].mods[ _mod ] = {};

      let params;
      if ( _mod === Interpolator.MOD_RESET ) {
        params = {
          velocity: 0.0
        };
      } else if ( _mod === Interpolator.MOD_SIN ) {
        params = {
          freq: 5.0,
          amp: 0.1,
          phase: 0.0
        };
      } else if ( _mod === Interpolator.MOD_NOISE ) {
        params = {
          freq: 1.0,
          amp: 0.2,
          reso: 8.0,
          recursion: 4.0,
          seed: 1.0
        };
      } else if ( _mod === Interpolator.MOD_LOFI ) {
        params = {
          freq: 10.0
        };
      }
      this.setModParams( _index, _mod, params );
    } else {
      this.nodes[ _index ].mods[ _mod ] = false;
      this.render();
    }
  }

  toggleMod( _index, _mod ) {
    this.validateNodeIndex( _index );
    if ( _mod < 0 || Interpolator.MODS <= _mod ) { return; }

    this.activeModParams( _index, _mod, !( this.nodes[ _index ].mods[ _mod ] ) );	
  }

  setModParam( _index, _mod, _key, _value ) {
    this.validateNodeIndex( _index );
    if ( _mod < 0 || Interpolator.MODS <= _mod ) { return; }

    this.nodes[ _index ].mods[ _mod ][ _key ] = _value;

    this.render();
  }

  setModParams( _index, _mod, _params ) {
    this.validateNodeIndex( _index );
    if ( _mod < 0 || Interpolator.MODS <= _mod ) { return; }

    for ( let key in _params ) {
      this.nodes[ _index ].mods[ _mod ][ key ] = _params[ key ];
    }

    this.render();
  }

  removeNode( _index ) {
    this.validateNodeIndex( _index );

    let node = this.nodes.splice( _index, 1 );

    this.render();

    return node;
  }

  getValue( _time ) {
    if ( typeof _time !== "number" ) { return this.currentValue; }
    let time = _time;

    if ( time <= 0.0 ) {
      return this.values[ 0 ];
    } else if ( this.automaton.data.length <= time ) {
      return this.values[ this.values.length - 1 ];
    } else {
      let index = time * this.automaton.data.resolution;
      let indexi = Math.floor( index );
      let indexf = index % 1.0;

      let pv = this.values[ indexi ];
      let fv = this.values[ indexi + 1 ];

      let v = pv + ( fv - pv ) * indexf;

      return v;
    }
  }
};

// ------

export default Param;