import { Clock } from './Clock';
/**
 * Class that deals with time.
 * This is "realtime" type clock, the time goes on as real world.
 */
export declare class ClockRealtime extends Clock {
    /**
     * "You set the time manually to `__rtTime` when it's `__rtDate`."
     */
    private __rtTime;
    /**
     * "You set the time manually to `__rtTime` when it's `__rtDate`."
     */
    private __rtDate;
    /**
     * The clock is realtime. yeah.
     */
    readonly isRealtime: boolean;
    /**
     * Update the clock. Time is calculated based on time in real world.
     */
    update(): void;
    /**
     * Set the time manually.
     * @param time Time
     */
    setTime(time: number): void;
}
