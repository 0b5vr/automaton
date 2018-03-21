import AutomatonClock from "./clock";
import AutomatonClockFrame from "./clock-frame";
import AutomatonClockRealtime from "./clock-realtime";

import AutomatonParam from "./param";

// ------

/**
 * IT'S AUTOMATON!
 * @param {object} _props
 * @param {boolean} [_props.loop] Whether let the time loop or not
 * @param {number} [_props.fps] If this is set, the clock will become frame mode
 * @param {boolean} [_props.realtime] If this is true, the clock will become realtime mode
 * @param {function} [_props.onSeek] Will call when the method seek() is called
 * @param {function} [_props.onPlay] Will call when the method play() is called
 * @param {function} [_props.onPause] Will call when the method pause() is called
 * @param {string} _props.data Data of the automaton in JSON format. Required in noGUI mode
 */
let Automaton = class {
  constructor( _props ) {
    this.version = process.env.VERSION;
    this.loadProps( _props );
    this.auto = ( _name ) => this.__auto( _name );
  }

  /**
   * Load props object.
   * @param {object} _props Props object of constructor
   */
  loadProps( _props ) {
    this.props = _props;
    this.data = JSON.parse( this.props.data ); // without compatibility check

    this.clock = (
      this.props.fps ? new AutomatonClockFrame( this, fps ) :
      this.props.realtime ? new AutomatonClockRealtime( this ) :
      new AutomatonClock( this )
    );

    // load params from data
    this.params = {};
    for ( let name in this.data.params ) {
      let param = new AutomatonParam( this );
      param.load( this.data.params[ name ] );
      this.params[ name ] = param;
    }
  }

  // ------

  /**
   * Seek the timeline.
   * @param {number} _time Time
   */
  seek( _time ) {
    this.clock.setTime( _time );
    if ( typeof this.props.onSeek === "function" ) { this.props.onSeek( time ); }
  }

  /**
   * Play the timeline.
   */
  play() {
    this.clock.play();
    if ( typeof this.props.onPlay === "function" ) { this.props.onPlay(); }
  }

  /**
   * Pause the timeline.
   */
  pause() {
    this.clock.pause();
    if ( typeof this.props.onPause === "function" ) { this.props.onPause(); }
  }

  // ------

  /**
   * Update the entire automaton.
   * @param {number} [_time] Current time, Required if the clock mode is manual
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
   * Same as param.getValue() in noGUI mode.
   * @param {string} _name name of the param
   * @returns {number} Current value of the param
   */
  __auto( _name ) {
    return this.params[ _name ].currentValue;
  }
};

module.exports = Automaton;
Automaton.default = Automaton;