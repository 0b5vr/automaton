import Clock from './clock';

/**
 * **Usually you don't need to know about this class.**
 * Class that deals with time.
 * This is "realtime" type clock, the time goes on as real world.
 * @extends Clock
 * @param {Automaton} _automaton Parent automaton object
 */
const ClockRealtime = class extends Clock {
  constructor( _automaton ) {
    super( _automaton );

    this.realtime = true;
    this.rtTime = 0.0;
    this.rtDate = +new Date();
  }

  /**
   * Update the clock. Time is calculated based on time in real world.
   * @returns {void} void
   */
  update() {
    if ( this.isPlaying ) {
      const prevTime = this.time;
      const now = Date.now();
      const deltaDate = ( now - this.rtDate );
      this.time = this.rtTime + deltaDate / 1000.0;
      this.deltaTime = this.time - prevTime;
    } else {
      this.rtTime = this.time;
      this.rtDate = +new Date();
      this.deltaTime = 0.0;
    }
  }

  /**
   * Set the time manually.
   * @param {number} _time Time
   * @returns {void} void
   */
  setTime( _time ) {
    this.time = _time;
    this.rtTime = this.time;
    this.rtDate = +new Date();
  }
};

export default ClockRealtime;