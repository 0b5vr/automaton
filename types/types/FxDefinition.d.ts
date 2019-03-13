export interface FxParam {
    name?: string;
    type: 'float' | 'int' | 'boolean';
    default: any;
    min?: number;
    max?: number;
}
export interface FxContext {
    /**
     * Index value of the current sample.
     */
    i: number;
    /**
     * Index value of the current sample.
     */
    index: number;
    /**
     * Index value of the first sample of the fx section.
     */
    i0: number;
    /**
     * Index value of the last sample of the fx section.
     */
    i1: number;
    /**
     * Time of the current point.
     */
    t: number;
    /**
     * Time of the current point.
     */
    time: number;
    /**
     * Time of the beginning point of the fx section.
     */
    t0: number;
    /**
     * Time of the ending point of the fx section.
     */
    t1: number;
    /**
     * DeltaTime between current sample and previous sample.
     */
    dt: number;
    /**
     * DeltaTime between current sample and previous sample.
     */
    deltaTime: number;
    /**
     * Progress of current position of the fx section, in [0-1].
     */
    p: number;
    /**
     * Progress of current position of the fx section, in [0-1].
     */
    progress: number;
    /**
     * Resolution of the automaton.
     */
    resolution: number;
    /**
     * Length of the fx section.
     */
    length: number;
    /**
     * Params of the fx section.
     */
    params: {
        [key: string]: any;
    };
    /**
     * Array of the input samples.
     */
    array: Float32Array;
    /**
     * {@link Param#getValue} of the current param.
     */
    getValue: (time: number) => number;
    /**
     * Whether the sample is initial point of the fx section or not.
     */
    init: boolean;
    /**
     * Current input value.
     */
    v: number;
    /**
     * Current input value.
     */
    value: number;
    /**
     * You can store anything in the field.
     */
    state: {
        [key: string]: any;
    };
}
export interface FxDefinition {
    name?: string;
    description?: string;
    params: {
        [key: string]: FxParam;
    };
    func: (context: FxContext) => number;
}
