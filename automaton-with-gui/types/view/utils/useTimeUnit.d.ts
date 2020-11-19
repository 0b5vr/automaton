export declare function useTimeUnit(): {
    beatToTime: (beat: number, isAbsolute?: boolean) => number;
    timeToBeat: (time: number, isAbsolute?: boolean) => number;
    displayToTime: (value: number, isAbsolute?: boolean) => number;
    timeToDisplay: (time: number, isAbsolute?: boolean) => number;
};
