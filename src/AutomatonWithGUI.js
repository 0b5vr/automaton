import { ass } from './ass';
import compat from './compat/compat';
import { jsonCopy } from './jsonCopy';

import Param from './param-gui';

import Automaton from './Automaton';
import fxDefinitions from './fx-definitions';

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
export const AutomatonWithGUI = class extends Automaton {
  constructor( _props ) {
    const props = Object.assign( {}, _props );

    ass( !_props.onseek, 'The handler "onseek" is no longer supported. Use Automaton.on( "seek", ... ) instead.' );
    ass( !_props.onplay, 'The handler "onplay" is no longer supported. Use Automaton.on( "play", ... ) instead.' );
    ass( !_props.onpause, 'The handler "onpause" is no longer supported. Use Automaton.on( "pause", ... ) instead.' );

    super( props );

    /**
     * History stack.
     * Will be managed from {@link AutomatonWithGUI#pushHistory|pushHistory()}, navigated from {@link AutomatonWithGUI#undo|undo()} and {@link AutomatonWithGUI#redo|redo()}.
     * @type {Object[]}
     * @protected
     */
    this.__history = [];

    /**
     * Current position of history stack.
     * @type {number}
     * @protected
     */
    this.__historyIndex = 0;

    fxDefinitions.map( ( fxDef ) => {
      this.addFxDefinition( ...fxDef );
    } );

    if ( _props.gui ) { this.__prepareGUI( _props.gui ); }

    window.addEventListener( 'beforeunload', ( event ) => {
      if ( this.__historyIndex !== 0 ) {
        var confirmationMessage = 'Automaton: Did you saved your progress?';

        event.returnValue = confirmationMessage;
        return confirmationMessage;
      }
    } );
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
   * @param {string} _id Id of the fx
   * @returns {Object} Default fx params object
   */
  generateDefaultFxParams( _id ) {
    const fxDef = this.__paramFxDefs[ _id ];
    if ( !fxDef ) { throw new Error( `Fx definition called ${_id} is not defined` ); }

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
   * Since it should accessible from GUI this function is public, basically `-- DON'T TOUCH IT KIDDO --`
   * @param {string} _desc Description of the operation
   * @param {function} _do Operation
   * @param {function} _undo Operation that undoes the `_do`
   * @param {boolean} [_execute=false] _do will be executed instantly if true
   * @returns {any} any if `_execute` is true, void otherwise
   */
  pushHistory( _desc, _do, _undo, _execute ) {
    this.__history.splice( this.__historyIndex );
    this.__history.push( { desc: _desc, do: _do, undo: _undo } );
    this.__historyIndex ++;

    if ( _execute || false ) {
      return _do();
    }
  }

  /**
   * Undo the operation based on history stack.
   * Can be performed via GUI.
   * @returns {any} Result of _undo
   */
  undo() {
    if ( this.__historyIndex <= 0 ) { return; }
    this.__historyIndex --;
    return this.__history[ this.__historyIndex ].undo();
  }

  /**
   * Redo the operation based on history stack.
   * Can be performed via GUI.
   * @returns {any} Result of _do
   */
  redo() {
    if ( this.__history.length <= this.__historyIndex ) { return; }
    this.__historyIndex ++;
    return this.__history[ this.__historyIndex - 1 ].do();
  }

  /**
   * Return description of latest operation.
   * If there are no operation before the current state, it will return empty string instead.
   * @returns {string} Description of operation
   */
  getUndoDesc() {
    return this.__history[ this.__historyIndex - 1 ] ? this.__history[ this.__historyIndex - 1 ].desc : '';
  }

  /**
   * Return description of recently undo-ed operation.
   * If there are no operation after the current state, it will return empty string instead.
   * @returns {string} Description of operation
   */
  getRedoDesc() {
    return this.__history[ this.__historyIndex ] ? this.__history[ this.__historyIndex ].desc : '';
  }

  /**
   * Drop all the history. YABAI.
   */
  dropHistory() {
    this.__history.splice( 0 );
    this.__historyIndex = 0;
  }

  /**
   * Set new length for this automaton instance.
   * **Some nodes / fxs might be automatically removed / changed.**
   * Can be performed via GUI.
   * @param {number} _length New length for the automaton
   * @returns {void} void
   */
  setLength( _length ) {
    // if length is invalid then throw error
    if ( isNaN( _length ) ) {
      throw new Error( 'Automaton.setLength: _length is invalid' );
    }

    // if length is not changed then do fast-return
    if ( _length === this.length ) { return; }

    // changeLength is a good method
    for ( let paramName in this.__params ) {
      const param = this.__params[ paramName ];
      param.changeLength( _length );
    }

    // finally set the length
    this.__length = _length;

    // It's irreversible operation, sorry.
    this.dropHistory();

    // Poke vue
    this.__vue.$emit( 'changedLength' );
  }

  /**
   * Set new resolution for this automaton instance.
   * @param {number} _resolultion New resolution for the automaton lul
   * @returns {void} void
   */
  setResolution( _resolultion ) { // lul
    this.__resolution = _resolultion; // lul
    this.precalcAll();
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
   * Remove a param.
   * @param {string} _name Name of param
   * @returns {void} void
   */
  removeParam( _name ) {
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
   * Return list of id of fx definitions. Sorted.
   * @returns {Array} List of id of fx definitions
   */
  getFxDefinitionIds() {
    let arr = [];
    for ( const id in this.__paramFxDefs ) { arr.push( id ); }
    arr = arr.sort();
    return arr;
  }

  /**
   * Return display name of a fx definition.
   * @param {string} _id Id of the fx definition you want to grab
   * @returns {string} Name of the fx definition
   */
  getFxDefinitionName( _id ) {
    if ( this.__paramFxDefs[ _id ] ) {
      return this.__paramFxDefs[ _id ].name || _id;
    } else {
      return undefined;
    }
  }

  /**
   * Return description of a fx definition.
   * @param {string} _id Id of the fx definition you want to grab
   * @returns {string} Description of the fx definition
   */
  getFxDefinitionDescription( _id ) {
    if ( this.__paramFxDefs[ _id ] ) {
      return this.__paramFxDefs[ _id ].description || '';
    } else {
      return undefined;
    }
  }

  /**
   * Return params section of a fx definition.
   * @param {string} _id Id of the fx definition you want to grab
   * @returns {Object} Params section
   */
  getFxDefinitionParams( _id ) {
    if ( this.__paramFxDefs[ _id ] ) {
      return jsonCopy( this.__paramFxDefs[ _id ].params || {} );
    } else {
      return undefined;
    }
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
    param.markAsUsed();
    return param.getValue();
  }

  /**
   * Load automaton state data.
   * @param {Object} _data Object contains automaton data.
   * @returns {void} void
   */
  load( _data ) {
    let data = compat( _data );
    super.load( data );

    /**
     * GUI settings.
     * Feel free to get / set these values.
     * @type {Object}
     */
    this.guiSettings = data.guiSettings;

    // Poke vue
    if ( this.__vue ) {
      this.__vue.$emit( 'loaded' );
    }

    // Bye history
    if ( this.__history ) {
      this.dropHistory();
    }
  }

  /**
   * Export current state as JSON.
   * @returns {string} Saved object as JSON
   * @example
   * あとでやる
   * @todo はい
   */
  save() {
    const ret = {
      v: this.version,
      length: this.length,
      resolution: this.resolution,
      params: {}, // will be filled later
      guiSettings: this.guiSettings
    };

    ret.params = {};
    for ( let name in this.__params ) {
      const param = this.__params[ name ];
      ret.params[ name ] = {
        nodes: param.dumpNodesWithoutId(),
        fxs: param.dumpFxsWithoutId()
      };
    }

    return JSON.stringify( ret );
  }

  /**
   * Poke the vue renderer.
   * @returns {void} void
   */
  pokeRenderer() {
    if ( this.__vue ) {
      this.__vue.$emit( 'poke' );
    }
  }
};

export default AutomatonWithGUI;
