import { Clock } from './Clock';

/**
 * Class that deals with time.
 * This is "realtime" type clock, the time goes on as real world.
 */
export class ClockRealtime extends Clock {
  /**
   * "You set the time manually to `__rtTime` when it's `__rtDate`."
   */
  private __rtTime: number = 0.0;

  /**
   * "You set the time manually to `__rtTime` when it's `__rtDate`."
   */
  private __rtDate: number = performance.now();

  /**
   * The clock is realtime. yeah.
   */
  public get isRealtime(): boolean { return true; }

  /**
   * Update the clock. Time is calculated based on time in real world.
   */
  public update(): void {
    const now = performance.now();

    if ( this.__isPlaying ) {
      const prevTime = this.__time;
      const deltaDate = ( now - this.__rtDate );
      this.__time = this.__rtTime + deltaDate / 1000.0;
      this.__deltaTime = this.time - prevTime;
    } else {
      this.__rtTime = this.time;
      this.__rtDate = now;
      this.__deltaTime = 0.0;
    }
  }

  /**
   * Set the time manually.
   * @param time Time
   */
  public setTime( time: number ): void {
    this.__time = time;
    this.__rtTime = this.time;
    this.__rtDate = performance.now();
  }
}
