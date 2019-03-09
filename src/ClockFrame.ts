import { Clock } from './Clock';

/**
 * Class that deals with time.
 * This is "frame" type clock, the frame increases every {@link ClockFrame#update} call.
 * @param fps Frames per second
 */
export class ClockFrame extends Clock {
  /**
   * Its current frame.
   */
  private __frame: number = 0;

  /**
   * Its fps.
   */
  private __fps: number;

  public constructor( fps: number ) {
    super();
    this.__fps = fps;
  }

  /**
   * Its current frame.
   */
  public get frame(): number { return this.__frame; }

  /**
   * Its fps.
   */
  public get fps(): number { return this.__fps; }

  /**
   * Update the clock. It will increase the frame by 1.
   */
  public update(): void {
    if ( this.__isPlaying ) {
      this.__time = this.__frame / this.__fps;
      this.__deltaTime = 1.0 / this.__fps;
      this.__frame ++;
    } else {
      this.__deltaTime = 0.0;
    }
  }

  /**
   * Set the time manually.
   * The set time will be converted into internal frame count, so the time will not be exactly same as set one.
   * @param time Time
   */
  public setTime( time: number ): void {
    this.__frame = Math.floor( this.__fps * time );
    this.__time = this.__frame / this.__fps;
  }
}
