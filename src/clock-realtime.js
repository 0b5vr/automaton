import AutomatonClock from "./clock";

/**
 * Class that deals with time.
 * This is "realtime" type clock, the time is going on as real world.
 * @param {Automaton} _automaton Parent automaton object
 */
let AutomatonClockRealtime = class extends AutomatonClock {
  constructor( _automaton ) {
    super( _automaton );

    this.rtTime = 0.0;
    this.rtDate = +new Date();
  }

  /**
   * Update the clock. Time is calculated based on time in real world.
   */
  update() {
    if ( this.isPlaying ) {
      let prevTime = this.time;
      let now = Date.now();
      let deltaDate = ( now - this.rtDate );
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
   */
  setTime( _time ) {
    this.time = _time;
    this.rtTime = this.time;
    this.rtDate = +new Date();
  }
};

export default AutomatonClockRealtime;