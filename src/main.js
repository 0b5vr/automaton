import Clock from './clock';
import ClockFrame from './clock-frame';
import ClockRealtime from './clock-realtime';

import Param from './param';

/**
 * IT'S AUTOMATON!
 * It's `automaton.nogui.js` version and also base class for {@link AutomatonWithGUI}.
 * @param {Object} _props
 * @param {boolean} [_props.loop] Whether let the time loop or not
 * @param {number} [_props.fps] If this is set, the clock will become frame mode
 * @param {boolean} [_props.realtime] If this is true, the clock will become realtime mode
 * @param {Object} _props.data Data of the automaton. **Required in noGUI mode**
 */
let Automaton = class {
  constructor( _props ) {
    /**
     * Version of the automaton.
     * @type {number}
     * @protected
     */
    this.__version = process.env.VERSION;

    /**
     * Whether the animation will be looped or not.
     * @type {boolean}
     */
    this.loop = _props.loop || false;

    /**
     * Clock of the automaton.
     * @type {Clock}
     * @protected
     */
    this.__clock = (
      _props.fps ? new ClockFrame( this, _props.fps ) :
      _props.realtime ? new ClockRealtime( this ) :
      new Clock( this )
    );

    const data = _props.data;
    this.load( data );

    /**
     * **THE MIGHTY `auto()` FUNCTION!! GRAB IT**
     * It creates a new param automatically if there are no param called `_name` (GUI mode only).
     * Otherwise it returns current value of the param called `_name`.
     * @param {string} _name name of the param
     * @returns {number} Current value of the param
     */
    this.auto = ( _name ) => this.__auto( _name );

    /**
     * A list of param fxs.
     * @type {Fx[]}
     * @protected
     */
    this.__paramFxs = {};

    /**
     * List of event listeners.
     * @type {Object.<string, function[]>}
     */
    this.__listeners = {};
  }

  /**
   * Version of the automaton.
   * @type {number}
   * @readonly
   */
  get version() { return this.__version; }

  /**
   * Current time. Same as `automaton.__clock.time`.
   * @type {number}
   * @readonly
   */
  get time() { return this.__clock.time; }

  /**
   * Total length of animation in seconds.
   * @type {number}
   * @readonly
   */
  get length() { return this.__length; }

  /**
   * Resolution = Sampling point per second.
   * @type {number}
   * @readonly
   */
  get resolution() { return this.__resolution; }

  /**
   * Delta of time between now and previous update call.
   * @type {number}
   * @readonly
   */
  get deltaTime() { return this.__clock.deltaTime; }

  /**
   * Whether it's playing or not.
   * @type {boolean}
   * @readonly
   */
  get isPlaying() { return this.__clock.isPlaying; }

  /**
   * Current progress by whole length. Might NOT be [0-1] unless `_props.loop` (see constructor) is true.
   * @type {number}
   * @readonly
   */
  get progress() { return this.time / this.length; }

  /**
   * Frame per second. If the clock type is not fps, it will return `0` instead.
   * @type {number}
   * @readonly
   */
  get fps() { return this.__clock.fps ? this.__clock.fps : 0; }

  /**
   * Boolean that represents whether the clock is based on realtime or not.
   * @type {boolean}
   * @readonly
   */
  get realtime() { return Boolean( this.__clock.realtime ); }

  /**
   * Load automaton state data.
   * @param {Object} _data Object contains automaton data.
   */
  load( _data ) {
    /**
     * Total length of animation in seconds.
     * @type {number}
     * @protected
     */
    this.__length = _data.length;

    /**
     * Resolution = Sampling point per second.
     * @type {number}
     * @protected
     */
    this.__resolution = _data.resolution;

    /**
     * List of Param.
     * @type {Object.<string, Param>}
     * @protected
     */
    this.__params = {};
    for ( const name in _data.params ) {
      let param = new Param( {
        automaton: this,
        data: _data.params[ name ]
      } );
      this.__params[ name ] = param;
    }
  }

  /**
   * Seek the timeline.
   * Can be performed via GUI.
   * @param {number} _time Time
   */
  seek( _time ) {
    this.__clock.setTime( _time );
    this.__emit( 'seek' );
  }

  /**
   * Play the timeline.
   * @todo SHOULD be performed via GUI.
   */
  play() {
    this.__clock.play();
    this.__emit( 'play' );
  }

  /**
   * Pause the timeline.
   * @todo SHOULD be performed via GUI.
   */
  pause() {
    this.__clock.pause();
    this.__emit( 'pause' );
  }

  /**
   * Add a fx.
   * @param {Fx} _fx Fx object
   */
  addFx( _fx ) {
    this.__paramFxs[ _fx.name ] = _fx;
  }

  /**
   * Emit an event.
   * @param {string} _event Event name
   * @param {...any} _arg Arguments passed to listeners
   * @protected
   */
  __emit( _event, ..._arg ) {
    if ( !this.__listeners[ _event ] ) { return; }
    this.__listeners[ _event ].map( ( listener ) => listener( ..._arg ) );
  }

  /**
   * Register a listener function.
   * @param {string} _event Event name
   * @param {function} _func Listener function
   */
  on( _event, _func ) {
    if ( !this.__listeners[ _event ] ) {
      this.__listeners[ _event ] = [];
    }
    this.__listeners[ _event ].push( _func );
  }

  /**
   * Precalculate all params.
   */
  precalcAll() {
    for ( const name in this.__params ) {
      this.__params[ name ].precalc();
    }
  }

  /**
   * Update the entire automaton.
   * **You may want to call this in your update loop.**
   * @param {number} [_time] Current time, **Required if the clock mode is manual**
   */
  update( _time ) {
    // update the clock
    this.__clock.update( _time );

    // if loop is enabled, loop the time
    if ( this.loop && this.length < this.time ) {
      this.__clock.setTime( this.time - Math.floor( this.time / this.length ) * this.length );
    }

    // grab current value for each param
    for ( let name in this.__params ) {
      this.__params[ name ].getValue();
    }
  }

  /**
   * Assigned to Automaton.auto at constructor.
   * @param {string} _name name of the param
   * @returns {number} Current value of the param
   * @protected
   */
  __auto( _name ) {
    return this.params[ _name ].__currentValue;
  }
};

module.exports = Automaton;
Automaton.default = Automaton;