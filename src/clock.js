/**
 * **Usually you don't need to know about this class.**
 * Class that deals with time.
 * In this base class, you need to set time manually from `Automaton.update()`.
 * Best for sync with external clock stuff.
 * @param {Automaton} _automaton Parent automaton object
 */
const Clock = class {
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
    const prevTime = this.time;
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

export default Clock;