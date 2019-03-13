import { Clock } from './Clock';
/**
 * Class that deals with time.
 * This is "frame" type clock, the frame increases every {@link ClockFrame#update} call.
 * @param fps Frames per second
 */
export declare class ClockFrame extends Clock {
    /**
     * Its current frame.
     */
    private __frame;
    /**
     * Its fps.
     */
    private __fps;
    constructor(fps: number);
    /**
     * Its current frame.
     */
    readonly frame: number;
    /**
     * Its fps.
     */
    readonly fps: number;
    /**
     * Update the clock. It will increase the frame by 1.
     */
    update(): void;
    /**
     * Set the time manually.
     * The set time will be converted into internal frame count, so the time will not be exactly same as set one.
     * @param time Time
     */
    setTime(time: number): void;
}
