import AutomatonClock from "./clock";

/**
 * Class that deals with time.
 * This is "frame" type clock, the frame increases every update call.
 * @param {Automaton} _automaton Parent automaton object
 * @param {number} _fps Frames per second
 */
let AutomatonClockFrame = class extends AutomatonClock {
  constructor( _automaton, _fps ) {
    super( _automaton );

    this.frame = 0.0;
    this.fps = _fps;
  }

  /**
   * Update the clock. It will increase the frame by 1.
   */
  update() {
    if ( this.isPlaying ) {
      this.frame ++;
      this.time = this.frame / this.fps;
      this.deltaTime = 1.0 / this.fps;
    } else {
      this.deltaTime = 0.0;
    }
  }
};

export default AutomatonClockFrame;