interface Options {
    /**
     * Use the emergency behavior instead. Intended to be used in {@link OhShit}.
     */
    emergencyMode?: boolean;
    /**
     * Use the minimal export.
     */
    minimize?: boolean;
}
export declare function useSave(): (options?: Options) => void;
export {};
