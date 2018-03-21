import deprec from "./utils/deprec";

import Clock from "./clock";
import ClockFrame from "./clock-frame";
import ClockRealtime from "./clock-realtime";

import Param from "./param";

// ------

/**
 * IT'S AUTOMATON!  
 * It's `automaton.nogui.js` version and also base class for {@link AutomatonWithGUI}.
 * @param {object} _props
 * @param {boolean} [_props.loop] Whether let the time loop or not
 * @param {number} [_props.fps] If this is set, the clock will become frame mode
 * @param {boolean} [_props.realtime] If this is true, the clock will become realtime mode
 * @param {function} [_props.onSeek] Will call when the method `seek()` is called
 * @param {function} [_props.onPlay] Will call when the method `play()` is called
 * @param {function} [_props.onPause] Will call when the method `pause()` is called
 * @param {string} _props.data Data of the automaton in JSON format. <b>Required in noGUI mode</b>
 */
let Automaton = class {
  constructor( _props ) {
    this.version = process.env.VERSION;
    this.__loadProps( _props );

    /**
     * **THE MIGHTY `auto()` FUNCTION!! GRAB IT**  
     * It creates a new param automatically if there are no param called `_name` (GUI mode only).  
     * Otherwise it returns current value of the param called `_name`.
     * @param {string} _name name of the param
     * @returns {number} Current value of the param
     */
    this.auto = ( _name ) => this.__auto( _name );
  }

  /**
   * Load props object.
   * @param {object} _props Props object from constructor
   * @protected
   */
  __loadProps( _props ) {
    this.props = _props;
    this.data = JSON.parse( this.props.data ); // without compatibility check

    this.clock = (
      this.props.fps ? new ClockFrame( this, fps ) :
      this.props.realtime ? new ClockRealtime( this ) :
      new Clock( this )
    );

    // load params from data
    this.params = {};
    for ( let name in this.data.params ) {
      let param = new Param( this );
      param.load( this.data.params[ name ] );
      this.params[ name ] = param;
    }
  }

  // ------

  /**
   * Current time. Same as `automaton.clock.time`.
   * @type {number}
   * @readonly
   */
  get time() { return this.clock.time; }

  /**
   * Delta of time between now and previous update call. Same as `automaton.clock.deltaTime`.
   * @type {number}
   * @readonly
   */
  get deltaTime() { return this.clock.deltaTime; }

  /**
   * Whether it's playing or not. Same as `automaton.clock.isPlaying`.
   * @type {boolean}
   * @readonly
   */
  get isPlaying() { return this.clock.isPlaying; }

  /**
   * Current progress by whole length. Might NOT be [0-1] unless `_props.loop` (see constructor) is true.
   * @type {number}
   * @readonly
   */
  get progress() { return this.clock.time / this.data.length; }

  // ------

  /**
   * Seek the timeline.  
   * Can be performed via GUI.
   * @param {number} _time Time
   */
  seek( _time ) {
    this.clock.setTime( _time );
    if ( typeof this.props.onSeek === "function" ) { this.props.onSeek( _time ); }
    deprec.handler( this.props.onseek, "Automaton: The handler onseek", "onSeek" );
  }

  /**
   * Play the timeline.  
   * @todo SHOULD be performed via GUI.
   */
  play() {
    this.clock.play();
    if ( typeof this.props.onPlay === "function" ) { this.props.onPlay(); }
    deprec.handler( this.props.onplay, "Automaton: The handler onplay", "onPlay" );
  }

  /**
   * Pause the timeline.  
   * @todo SHOULD be performed via GUI.
   */
  pause() {
    this.clock.pause();
    if ( typeof this.props.onPause === "function" ) { this.props.onPause(); }
    deprec.handler( this.props.onpause, "Automaton: The handler onpause", "onPause" );
  }

  // ------

  /**
   * Update the entire automaton.  
   * **You may want to call this in your update loop.**
   * @param {number} [_time] Current time, **Required if the clock mode is manual**
   */
  update( _time ) {
    // update the clock
    this.clock.update( _time );

    // loop the time
    if ( this.props.loop && this.data.length < this.clock.time ) {
      this.clock.setTime( this.clock.time - Math.floor( this.clock.time / this.data.length ) * this.data.length );
    }

    // set currentValue to each params
    for ( let name in this.params ) {
      this.params[ name ].currentValue = this.params[ name ].getValue( this.clock.time );
    }
  }

  // ------

  /**
   * Assigned to Automaton.auto at constructor.
   * @param {string} _name name of the param
   * @returns {number} Current value of the param
   * @protected
   */
  __auto( _name ) {
    return this.params[ _name ].currentValue;
  }
};

module.exports = Automaton;
Automaton.default = Automaton;