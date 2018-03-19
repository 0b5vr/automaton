/**
 * Class that deals with time.
 * In this base class, you need to set time manually at update call.
 * @param {Automaton} _automaton Parent automaton object
 */
let AutomatonClock = class {
  constructor( _automaton ) {
    this.automaton = _automaton;

    this.time = 0.0;
    this.deltaTime = 0.0;
    this.isPlaying = true;
  }

  /**
   * Update the clock.
   * @param {number} _time Time. You need to set manually
   */
  update( _time ) {
    let prevTime = this.time;
    this.time = _time;
    this.deltaTime = this.time - prevTime;
  }

  /**
   * Start the clock.
   */
  play() {
    this.isPlaying = true;
  }

  /**
   * Stop the clock.
   */
  pause() {
    this.isPlaying = false;
  }

  /**
   * Set the time manually.
   * @param {number} _time Time
   */
  setTime( _time ) {
    this.time = _time;
  }
};

export default AutomatonClock;