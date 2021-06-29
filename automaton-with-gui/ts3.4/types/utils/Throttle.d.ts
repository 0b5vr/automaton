export declare class Throttle<T = void> {
    /**
     * Rate, in ms.
     */
    rate: number;
    private __currentPromise;
    private __latest;
    private __lastTime;
    constructor(rate?: number);
    do(func: () => T): Promise<T>;
}
