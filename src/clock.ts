/**
 * Class that deals with time.
 * In this base class, you need to set time manually from `Automaton.update()`.
 * Best for sync with external clock stuff.
 */
export class Clock {
  /**
   * Its current time.
   */
  protected __time: number = 0.0;

  /**
   * Its deltaTime of last update.
   */
  protected __deltaTime: number = 0.0;

  /**
   * Whether its currently playing or not.
   */
  protected __isPlaying: boolean = true;

  /**
   * Its current time.
   */
  public get time(): number { return this.__time; }

  /**
   * Its deltaTime of last update.
   */
  public get deltaTime(): number { return this.__deltaTime; }

  /**
   * Whether its currently playing or not.
   */
  public get isPlaying(): boolean { return this.__isPlaying; }

  /**
   * Update the clock.
   * @param time Time. You need to set manually
   */
  public update( time: number ): void {
    const prevTime = this.__time;
    this.__time = time;
    this.__deltaTime = this.__time - prevTime;
  }

  /**
   * Start the clock.
   */
  public play(): void {
    this.__isPlaying = true;
  }

  /**
   * Stop the clock.
   */
  public pause(): void {
    this.__isPlaying = false;
  }

  /**
   * Set the time manually.
   * @param time Time
   */
  public setTime( time: number ): void {
    this.__time = time;
  }
}
