import Clock from './clock';

/**
 * **Usually you don't need to know about this class.**
 * Class that deals with time.
 * This is "frame" type clock, the frame increases every update call.
 * @extends Clock
 * @param {Automaton} _automaton Parent automaton object
 * @param {number} _fps Frames per second
 */
let ClockFrame = class extends Clock {
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
      this.time = this.frame / this.fps;
      this.deltaTime = 1.0 / this.fps;
      this.frame ++;
    } else {
      this.deltaTime = 0.0;
    }
  }
};

export default ClockFrame;