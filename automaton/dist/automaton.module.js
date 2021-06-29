/*!
 * @fms-cat/automaton v4.2.0
 * Animation engine for creative coding
 *
 * Copyright (c) 2017-2020 FMS_Cat
 * @fms-cat/automaton is distributed under MIT License
 * https://github.com/FMS-Cat/automaton/blob/master/LICENSE
 */
const NEWTON_ITER = 4;
const NEWTON_EPSILON = 0.001;
const SUBDIV_ITER = 10;
const SUBDIV_EPSILON = 0.000001;
const TABLE_SIZE = 21;
const __cache = [];
function clamp(x, min, max) {
    return Math.min(Math.max(x, min), max);
}
/*
 * (1-t)(1-t)(1-t) a0 = (1-2t+tt)(1-t) a0
 *                    = (1-t-2t+2tt+tt-ttt) a0
 *                    = (1-3t+3tt-ttt) a0
 *
 * 3(1-t)(1-t)t a1 = 3(1-2t+tt)t a1
 *                 = (3t-6tt+3ttt) a1
 *
 * 3(1-t)tt a2 = (3tt-3ttt) a2
 *
 * ttt a3
 *
 * (a3-3a2+3a1-a0) ttt + (3a2-6a1+3a0) tt + (3a1-3a0) t + a0
 */
function A(cps) {
    return cps.p3 - 3.0 * cps.p2 + 3.0 * cps.p1 - cps.p0;
}
function B(cps) {
    return 3.0 * cps.p2 - 6.0 * cps.p1 + 3.0 * cps.p0;
}
function C(cps) {
    return 3.0 * cps.p1 - 3.0 * cps.p0;
}
function cubicBezier(t, cps) {
    return ((A(cps) * t + B(cps)) * t + C(cps)) * t + cps.p0;
}
function deltaCubicBezier(t, cps) {
    return (3.0 * A(cps) * t + 2.0 * B(cps)) * t + C(cps);
}
function subdiv(x, a, b, cps) {
    let candidateX = 0;
    let t = 0;
    for (let i = 0; i < SUBDIV_ITER; i++) {
        t = a + (b - a) / 2.0;
        candidateX = cubicBezier(t, cps) - x;
        (0.0 < candidateX) ? (b = t) : (a = t);
        if (SUBDIV_EPSILON < Math.abs(candidateX)) {
            break;
        }
    }
    return t;
}
function newton(x, t, cps) {
    for (let i = 0; i < NEWTON_ITER; i++) {
        const d = deltaCubicBezier(t, cps);
        if (d === 0.0) {
            return t;
        }
        const cx = cubicBezier(t, cps) - x;
        t -= cx / d;
    }
    return t;
}
function rawBezierEasing(cpsx, cpsy, x) {
    if (x <= cpsx.p0) {
        return cpsy.p0;
    } // clamped
    if (cpsx.p3 <= x) {
        return cpsy.p3;
    } // clamped
    cpsx.p1 = clamp(cpsx.p1, cpsx.p0, cpsx.p3);
    cpsx.p2 = clamp(cpsx.p2, cpsx.p0, cpsx.p3);
    for (let i = 0; i < TABLE_SIZE; i++) {
        __cache[i] = cubicBezier(i / (TABLE_SIZE - 1.0), cpsx);
    }
    let sample = 0;
    for (let i = 1; i < TABLE_SIZE; i++) {
        sample = i - 1;
        if (x < __cache[i]) {
            break;
        }
    }
    const dist = (x - __cache[sample]) / (__cache[sample + 1] - __cache[sample]);
    let t = (sample + dist) / (TABLE_SIZE - 1);
    const d = deltaCubicBezier(t, cpsx) / (cpsx.p3 - cpsx.p0);
    if (NEWTON_EPSILON <= d) {
        t = newton(x, t, cpsx);
    }
    else if (d !== 0.0) {
        t = subdiv(x, (sample) / (TABLE_SIZE - 1), (sample + 1.0) / (TABLE_SIZE - 1), cpsx);
    }
    return cubicBezier(t, cpsy);
}
function bezierEasing(node0, node1, time) {
    return rawBezierEasing({
        p0: node0.time,
        p1: node0.time + node0.outTime,
        p2: node1.time + node1.inTime,
        p3: node1.time
    }, {
        p0: node0.value,
        p1: node0.value + node0.outValue,
        p2: node1.value + node1.inValue,
        p3: node1.value
    }, time);
}

// https://github.com/FMS-Cat/experimental-npm/blob/cf685846488ed3765e0abf68c8f6cd4916049cfa/src/algorithm/binarySearch.ts
function binarySearch(array, elementOrCompare) {
    if (typeof elementOrCompare !== 'function') {
        return binarySearch(array, (element) => (element < elementOrCompare));
    }
    const compare = elementOrCompare;
    let start = 0;
    let end = array.length;
    while (start < end) {
        const center = (start + end) >> 1;
        const centerElement = array[center];
        const compareResult = compare(centerElement);
        if (compareResult) {
            start = center + 1;
        }
        else {
            end = center;
        }
    }
    return start;
}

/**
 * Represents an item of a [[Channel]].
 */
class ChannelItem {
    /**
     * Constructor of the [[ChannelItem]].
     * @param automaton Parent automaton
     * @param data Data of the item
     */
    constructor(automaton, data) {
        this.__automaton = automaton;
        this.deserialize(data);
    }
    /**
     * Ending timepoint of the item.
     */
    get end() {
        return this.time + this.length;
    }
    getValue(time) {
        if (this.reset && this.length <= time) {
            return 0.0;
        }
        if (this.curve) {
            const t = this.offset + time * this.speed;
            return this.value + this.amp * this.curve.getValue(t);
        }
        else {
            return this.value;
        }
    }
    /**
     * Deserialize a serialized data of item from [[SerializedChannelItem]].
     * @param data A serialized item.
     */
    deserialize(data) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        this.time = (_a = data.time) !== null && _a !== void 0 ? _a : 0.0;
        this.length = (_b = data.length) !== null && _b !== void 0 ? _b : 0.0;
        this.value = (_c = data.value) !== null && _c !== void 0 ? _c : 0.0;
        this.offset = (_d = data.offset) !== null && _d !== void 0 ? _d : 0.0;
        this.speed = (_e = data.speed) !== null && _e !== void 0 ? _e : 1.0;
        this.amp = (_f = data.amp) !== null && _f !== void 0 ? _f : 1.0;
        this.reset = data.reset;
        if (data.curve != null) {
            this.curve = this.__automaton.getCurve(data.curve);
            this.length = (_h = (_g = data.length) !== null && _g !== void 0 ? _g : this.curve.length) !== null && _h !== void 0 ? _h : 0.0;
        }
    }
}

/**
 * It represents a channel of Automaton.
 */
class Channel {
    /**
     * Constructor of the [[Channel]].
     * @param automaton Parent automaton
     * @param data Data of the channel
     */
    constructor(automaton, data) {
        /**
         * List of channel items.
         */
        this.__items = [];
        /**
         * A cache of last calculated value.
         */
        this.__value = 0.0;
        /**
         * The time that was used for the calculation of [[__lastValue]].
         */
        this.__time = -Infinity;
        /**
         * The index of [[__items]] it should evaluate next.
         */
        this.__head = 0;
        /**
         * An array of listeners.
         */
        this.__listeners = [];
        this.__automaton = automaton;
        this.deserialize(data);
    }
    /**
     * A cache of last calculated value.
     */
    get currentValue() { return this.__value; }
    /**
     * The time that was used for the calculation of [[__lastValue]].
     */
    get currentTime() { return this.__time; }
    /**
     * Load a serialized data of a channel.
     * @param data Data of a channel
     */
    deserialize(data) {
        var _a, _b;
        this.__items = (_b = (_a = data.items) === null || _a === void 0 ? void 0 : _a.map((item) => new ChannelItem(this.__automaton, item))) !== null && _b !== void 0 ? _b : [];
    }
    /**
     * Reset the internal states.
     * Call this method when you seek the time.
     */
    reset() {
        this.__time = -Infinity;
        this.__value = 0;
        this.__head = 0;
    }
    /**
     * Add a new listener that receives a [[ChannelUpdateEvent]] when an update is happened.
     * @param listener A subscribing listener
     */
    subscribe(listener) {
        this.__listeners.push(listener);
    }
    /**
     * Return the value of specified time point.
     * @param time Time at the point you want to grab the value.
     * @returns Result value
     */
    getValue(time) {
        // no items??? damn
        if (this.__items.length === 0) {
            return 0.0;
        }
        const next = binarySearch(this.__items, (item) => (item.time < time));
        // it's the first one!
        if (next === 0) {
            return 0.0;
        }
        const item = this.__items[next - 1];
        if (item.end < time) {
            return item.getValue(item.length);
        }
        else {
            return item.getValue(time - item.time);
        }
    }
    /**
     * This method is intended to be used by [[Automaton.update]].
     * Consume and return items.
     * @param time The current time of the parent [[Automaton]]
     * @returns Array of tuples, [ timing of the event, a function that execute the event ]
     */
    consume(time) {
        const ret = [];
        const prevTime = this.__time;
        for (let i = this.__head; i < this.__items.length; i++) {
            const item = this.__items[i];
            const { time: begin, end, length } = item;
            let elapsed = time - begin;
            if (elapsed < 0.0) {
                break;
            }
            else {
                let progress;
                let init;
                let uninit;
                if (length <= elapsed) {
                    elapsed = length;
                    progress = 1.0;
                    uninit = true;
                    if (i === this.__head) {
                        this.__head++;
                    }
                }
                else {
                    progress = length !== 0.0
                        ? elapsed / length
                        : 1.0;
                }
                if (prevTime < begin) {
                    init = true;
                }
                ret.push([begin + elapsed, () => {
                        this.__value = item.getValue(elapsed);
                        this.__listeners.forEach((listener) => listener({
                            time,
                            elapsed,
                            begin,
                            end,
                            length,
                            value: this.__value,
                            progress,
                            init,
                            uninit,
                        }));
                    }]);
            }
        }
        this.__time = time;
        return ret;
    }
}

/**
 * It represents a curve of Automaton.
 */
class Curve {
    /**
     * Constructor of a [[Curve]].
     * @param automaton Parent automaton
     * @param data Data of the curve
     */
    constructor(automaton, data) {
        /**
         * List of bezier node.
         */
        this.__nodes = [];
        /**
         * List of fx sections.
         */
        this.__fxs = [];
        this.__automaton = automaton;
        this.deserialize(data);
    }
    /**
     * The length of this curve.
     */
    get length() {
        return this.__nodes[this.__nodes.length - 1].time;
    }
    /**
     * Load a serialized data of a curve.
     * @param data Data of a curve
     */
    deserialize(data) {
        var _a;
        this.__nodes = data.nodes.map((node) => {
            var _a, _b, _c, _d, _e, _f;
            return ({
                time: (_a = node[0]) !== null && _a !== void 0 ? _a : 0.0,
                value: (_b = node[1]) !== null && _b !== void 0 ? _b : 0.0,
                inTime: (_c = node[2]) !== null && _c !== void 0 ? _c : 0.0,
                inValue: (_d = node[3]) !== null && _d !== void 0 ? _d : 0.0,
                outTime: (_e = node[4]) !== null && _e !== void 0 ? _e : 0.0,
                outValue: (_f = node[5]) !== null && _f !== void 0 ? _f : 0.0,
            });
        });
        this.__fxs = [];
        (_a = data.fxs) === null || _a === void 0 ? void 0 : _a.forEach((fx) => {
            var _a, _b, _c;
            if (fx.bypass) {
                return;
            }
            this.__fxs.push({
                time: (_a = fx.time) !== null && _a !== void 0 ? _a : 0.0,
                length: (_b = fx.length) !== null && _b !== void 0 ? _b : 0.0,
                row: (_c = fx.row) !== null && _c !== void 0 ? _c : 0,
                def: fx.def,
                params: fx.params
            });
        });
        this.precalc();
    }
    /**
     * Precalculate value of samples.
     */
    precalc() {
        const valuesLength = Math.ceil(this.__automaton.resolution * this.length) + 1;
        this.__values = new Float32Array(valuesLength);
        this.__shouldNotInterpolate = new Uint8Array(valuesLength);
        this.__generateCurve();
        this.__applyFxs();
    }
    /**
     * Return the value of specified time point.
     * @param time Time at the point you want to grab the value.
     * @returns Result value
     */
    getValue(time) {
        if (time < 0.0) {
            // clamp left
            return this.__values[0];
        }
        else if (this.length <= time) {
            // clamp right
            return this.__values[this.__values.length - 1];
        }
        else {
            // fetch two values then do the linear interpolation
            const index = time * this.__automaton.resolution;
            const indexi = Math.floor(index);
            const indexf = index % 1.0;
            const v0 = this.__values[indexi];
            let v1 = this.__values[indexi + 1];
            if (this.__shouldNotInterpolate[indexi]) {
                // continue  the previous delta
                const vp = this.__values[Math.max(indexi - 1, 0)];
                v1 = 2.0 * v0 - vp; // v0 + ( v0 - vp );
            }
            const v = v0 + (v1 - v0) * indexf;
            return v;
        }
    }
    /**
     * The first step of {@link precalc}: generate a curve out of nodes.
     */
    __generateCurve() {
        let nodeTail = this.__nodes[0];
        let iTail = 0;
        for (let iNode = 0; iNode < this.__nodes.length - 1; iNode++) {
            const node0 = nodeTail;
            nodeTail = this.__nodes[iNode + 1];
            const i0 = iTail;
            iTail = Math.floor(nodeTail.time * this.__automaton.resolution);
            this.__values[i0] = node0.value;
            if (i0 === iTail && iTail !== 0) {
                this.__shouldNotInterpolate[iTail - 1] = 1;
            }
            else {
                for (let i = i0 + 1; i <= iTail; i++) {
                    const time = i / this.__automaton.resolution;
                    const value = bezierEasing(node0, nodeTail, time);
                    this.__values[i] = value;
                }
            }
        }
        for (let i = iTail + 1; i < this.__values.length; i++) {
            this.__values[i] = nodeTail.value;
        }
    }
    /**
     * The second step of {@link precalc}: apply fxs to the generated curves.
     */
    __applyFxs() {
        for (let iFx = 0; iFx < this.__fxs.length; iFx++) {
            const fx = this.__fxs[iFx];
            const fxDef = this.__automaton.getFxDefinition(fx.def);
            if (!fxDef) {
                {
                    console.warn(`No such fx definition: ${fx.def}`);
                }
                continue;
            }
            const availableEnd = Math.min(this.length, fx.time + fx.length);
            const i0 = Math.ceil(this.__automaton.resolution * fx.time);
            const i1 = Math.floor(this.__automaton.resolution * availableEnd);
            if (i1 <= i0) {
                {
                    console.error('Length of the fx section is being negative');
                }
                continue;
            }
            const tempLength = i1 - i0 + 1;
            const tempValues = new Float32Array(tempLength);
            const context = {
                index: i0,
                i0,
                i1,
                time: fx.time,
                t0: fx.time,
                t1: fx.time + fx.length,
                deltaTime: 1.0 / this.__automaton.resolution,
                value: 0.0,
                progress: 0.0,
                elapsed: 0.0,
                resolution: this.__automaton.resolution,
                length: fx.length,
                params: fx.params,
                array: this.__values,
                shouldNotInterpolate: this.__shouldNotInterpolate[i0] === 1,
                setShouldNotInterpolate: (shouldNotInterpolate) => {
                    this.__shouldNotInterpolate[context.index] = shouldNotInterpolate ? 1 : 0;
                },
                getValue: this.getValue.bind(this),
                init: true,
                state: {},
            };
            for (let i = 0; i < tempLength; i++) {
                context.index = i + i0;
                context.time = context.index / this.__automaton.resolution;
                context.value = this.__values[i + i0];
                context.elapsed = context.time - fx.time;
                context.progress = context.elapsed / fx.length;
                context.shouldNotInterpolate = this.__shouldNotInterpolate[i + i0] === 1;
                tempValues[i] = fxDef.func(context);
                context.init = false;
            }
            this.__values.set(tempValues, i0);
        }
    }
}

/**
 * IT'S AUTOMATON!
 * @param data Serialized data of the automaton
 * @param options Options for this Automaton instance
 */
class Automaton {
    constructor(data, options = {}) {
        /**
         * It returns the current value of the [[Channel]] called `name`.
         * If the `name` is an array, it returns a set of name : channel as an object instead.
         * You can also give a listener which will be executed when the channel changes its value (optional).
         * @param name The name of the channel
         * @param listener A function that will be executed when the channel changes its value
         * @returns Current value of the channel
         */
        this.auto = this.__auto.bind(this);
        /**
         * Curves of the automaton.
         */
        this.curves = [];
        /**
         * Channels of the timeline.
         */
        this.channels = [];
        /**
         * Map of channels, name vs. channel itself.
         */
        this.mapNameToChannel = new Map();
        /**
         * Current time of the automaton.
         * Can be set by [[update]], be retrieved by [[get time]], be used by [[auto]]
         */
        this.__time = 0.0;
        /**
         * Version of the automaton.
         */
        this.__version = '4.2.0';
        /**
         * Resolution of the timeline.
         */
        this.__resolution = 1000;
        /**
         * A map of fx definitions.
         */
        this.__fxDefinitions = {};
        options.fxDefinitions && this.addFxDefinitions(options.fxDefinitions);
        this.deserialize(data);
    }
    /**
     * Current time of the automaton, that is set via [[update]].
     */
    get time() { return this.__time; }
    /**
     * Version of the automaton.
     */
    get version() { return this.__version; }
    /**
     * Resolution = Sampling point per second.
     */
    get resolution() { return this.__resolution; }
    /**
     * Load serialized automaton data.
     * @param data Serialized object contains automaton data.
     */
    deserialize(data) {
        this.__resolution = data.resolution;
        this.curves.splice(0);
        this.curves.push(...data.curves.map((data) => new Curve(this, data)));
        this.mapNameToChannel.clear();
        this.channels.splice(0);
        this.channels.push(...data.channels.map(([name, data]) => {
            const channel = new Channel(this, data);
            {
                if (this.mapNameToChannel.has(name)) {
                    console.warn(`Duplicated channel: ${name}`);
                }
            }
            this.mapNameToChannel.set(name, channel);
            return channel;
        }));
    }
    /**
     * Add fx definitions.
     * @param fxDefinitions A map of id - fx definition
     */
    addFxDefinitions(fxDefinitions) {
        Object.entries(fxDefinitions).forEach(([id, fxDef]) => {
            if (typeof fxDef.func === 'function') { // ignore unrelated entries
                {
                    if (this.__fxDefinitions[id] != null) {
                        console.warn(`Overwriting the existing fx definition: ${id}`);
                    }
                }
                this.__fxDefinitions[id] = fxDef;
            }
        });
        this.precalcAll();
    }
    /**
     * Get a fx definition.
     * If it can't find the definition, it returns `null` instead.
     * @param id Unique id for the Fx definition
     */
    getFxDefinition(id) {
        return this.__fxDefinitions[id] || null;
    }
    /**
     * Get a curve.
     * @param index An index of the curve
     */
    getCurve(index) {
        return this.curves[index] || null;
    }
    /**
     * Precalculate all curves.
     */
    precalcAll() {
        Object.values(this.curves).forEach((curve) => curve.precalc());
    }
    /**
     * Reset the internal states of channels.
     * **Call this method when you seek the time.**
     */
    reset() {
        Object.values(this.channels).forEach((channel) => channel.reset());
    }
    /**
     * Update the entire automaton.
     * **You may want to call this in your update loop.**
     * @param time Current time
     */
    update(time) {
        const t = Math.max(time, 0.0);
        // cache the time
        this.__time = t;
        // update channels
        const array = this.channels.map((channel) => channel.consume(this.__time)).flat(1);
        array.sort(([a], [b]) => a - b).forEach(([_, func]) => func());
    }
    /**
     * Assigned to {@link Automaton#auto} on its initialize phase.
     * @param name The name of the channel
     * @param listener A function that will be executed when the channel changes its value
     * @returns Current value of the channel
     */
    __auto(name, listener) {
        const channel = this.mapNameToChannel.get(name);
        {
            if (!channel) {
                throw new Error(`No such channel: ${name}`);
            }
        }
        if (listener) {
            channel.subscribe(listener);
        }
        return channel.currentValue;
    }
}

export { Automaton, Channel, ChannelItem, Curve, bezierEasing, binarySearch };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b21hdG9uLm1vZHVsZS5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL3V0aWxzL2JlemllckVhc2luZy50cyIsIi4uL3NyYy91dGlscy9iaW5hcnlTZWFyY2gudHMiLCIuLi9zcmMvQ2hhbm5lbEl0ZW0udHMiLCIuLi9zcmMvQ2hhbm5lbC50cyIsIi4uL3NyYy9DdXJ2ZS50cyIsIi4uL3NyYy9BdXRvbWF0b24udHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBCZXppZXJOb2RlIH0gZnJvbSAnLi4vdHlwZXMvQmV6aWVyTm9kZSc7XG5cbmludGVyZmFjZSBDdWJpY0JlemllckNvbnRyb2xQb2ludHMge1xuICBwMDogbnVtYmVyO1xuICBwMTogbnVtYmVyO1xuICBwMjogbnVtYmVyO1xuICBwMzogbnVtYmVyO1xufVxuXG5jb25zdCBORVdUT05fSVRFUiA9IDQ7XG5jb25zdCBORVdUT05fRVBTSUxPTiA9IDAuMDAxO1xuY29uc3QgU1VCRElWX0lURVIgPSAxMDtcbmNvbnN0IFNVQkRJVl9FUFNJTE9OID0gMC4wMDAwMDE7XG5jb25zdCBUQUJMRV9TSVpFID0gMjE7XG5cbmNvbnN0IF9fY2FjaGU6IG51bWJlcltdID0gW107XG5cbmZ1bmN0aW9uIGNsYW1wKCB4OiBudW1iZXIsIG1pbjogbnVtYmVyLCBtYXg6IG51bWJlciApOiBudW1iZXIge1xuICByZXR1cm4gTWF0aC5taW4oIE1hdGgubWF4KCB4LCBtaW4gKSwgbWF4ICk7XG59XG5cbi8qXG4gKiAoMS10KSgxLXQpKDEtdCkgYTAgPSAoMS0ydCt0dCkoMS10KSBhMFxuICogICAgICAgICAgICAgICAgICAgID0gKDEtdC0ydCsydHQrdHQtdHR0KSBhMFxuICogICAgICAgICAgICAgICAgICAgID0gKDEtM3QrM3R0LXR0dCkgYTBcbiAqXG4gKiAzKDEtdCkoMS10KXQgYTEgPSAzKDEtMnQrdHQpdCBhMVxuICogICAgICAgICAgICAgICAgID0gKDN0LTZ0dCszdHR0KSBhMVxuICpcbiAqIDMoMS10KXR0IGEyID0gKDN0dC0zdHR0KSBhMlxuICpcbiAqIHR0dCBhM1xuICpcbiAqIChhMy0zYTIrM2ExLWEwKSB0dHQgKyAoM2EyLTZhMSszYTApIHR0ICsgKDNhMS0zYTApIHQgKyBhMFxuICovXG5cbmZ1bmN0aW9uIEEoIGNwczogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzICk6IG51bWJlciB7XG4gIHJldHVybiBjcHMucDMgLSAzLjAgKiBjcHMucDIgKyAzLjAgKiBjcHMucDEgLSBjcHMucDA7XG59XG5cbmZ1bmN0aW9uIEIoIGNwczogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzICk6IG51bWJlciB7XG4gIHJldHVybiAzLjAgKiBjcHMucDIgLSA2LjAgKiBjcHMucDEgKyAzLjAgKiBjcHMucDA7XG59XG5cbmZ1bmN0aW9uIEMoIGNwczogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzICk6IG51bWJlciB7XG4gIHJldHVybiAzLjAgKiBjcHMucDEgLSAzLjAgKiBjcHMucDA7XG59XG5cbmZ1bmN0aW9uIGN1YmljQmV6aWVyKCB0OiBudW1iZXIsIGNwczogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzICk6IG51bWJlciB7XG4gIHJldHVybiAoICggQSggY3BzICkgKiB0ICsgQiggY3BzICkgKSAqIHQgKyBDKCBjcHMgKSApICogdCArIGNwcy5wMDtcbn1cblxuZnVuY3Rpb24gZGVsdGFDdWJpY0JlemllciggdDogbnVtYmVyLCBjcHM6IEN1YmljQmV6aWVyQ29udHJvbFBvaW50cyApOiBudW1iZXIge1xuICByZXR1cm4gKCAzLjAgKiBBKCBjcHMgKSAqIHQgKyAyLjAgKiBCKCBjcHMgKSApICogdCArIEMoIGNwcyApO1xufVxuXG5mdW5jdGlvbiBzdWJkaXYoIHg6IG51bWJlciwgYTogbnVtYmVyLCBiOiBudW1iZXIsIGNwczogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzICk6IG51bWJlciB7XG4gIGxldCBjYW5kaWRhdGVYID0gMDtcbiAgbGV0IHQgPSAwO1xuXG4gIGZvciAoIGxldCBpID0gMDsgaSA8IFNVQkRJVl9JVEVSOyBpICsrICkge1xuICAgIHQgPSBhICsgKCBiIC0gYSApIC8gMi4wO1xuICAgIGNhbmRpZGF0ZVggPSBjdWJpY0JlemllciggdCwgY3BzICkgLSB4O1xuICAgICggMC4wIDwgY2FuZGlkYXRlWCApID8gKCBiID0gdCApIDogKCBhID0gdCApO1xuICAgIGlmICggU1VCRElWX0VQU0lMT04gPCBNYXRoLmFicyggY2FuZGlkYXRlWCApICkgeyBicmVhazsgfVxuICB9XG5cbiAgcmV0dXJuIHQ7XG59XG5cbmZ1bmN0aW9uIG5ld3RvbiggeDogbnVtYmVyLCB0OiBudW1iZXIsIGNwczogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzICk6IG51bWJlciB7XG4gIGZvciAoIGxldCBpID0gMDsgaSA8IE5FV1RPTl9JVEVSOyBpICsrICkge1xuICAgIGNvbnN0IGQgPSBkZWx0YUN1YmljQmV6aWVyKCB0LCBjcHMgKTtcbiAgICBpZiAoIGQgPT09IDAuMCApIHsgcmV0dXJuIHQ7IH1cbiAgICBjb25zdCBjeCA9IGN1YmljQmV6aWVyKCB0LCBjcHMgKSAtIHg7XG4gICAgdCAtPSBjeCAvIGQ7XG4gIH1cblxuICByZXR1cm4gdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJhd0JlemllckVhc2luZyhcbiAgY3BzeDogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzLFxuICBjcHN5OiBDdWJpY0JlemllckNvbnRyb2xQb2ludHMsXG4gIHg6IG51bWJlclxuKTogbnVtYmVyIHtcbiAgaWYgKCB4IDw9IGNwc3gucDAgKSB7IHJldHVybiBjcHN5LnAwOyB9IC8vIGNsYW1wZWRcbiAgaWYgKCBjcHN4LnAzIDw9IHggKSB7IHJldHVybiBjcHN5LnAzOyB9IC8vIGNsYW1wZWRcblxuICBjcHN4LnAxID0gY2xhbXAoIGNwc3gucDEsIGNwc3gucDAsIGNwc3gucDMgKTtcbiAgY3BzeC5wMiA9IGNsYW1wKCBjcHN4LnAyLCBjcHN4LnAwLCBjcHN4LnAzICk7XG5cbiAgZm9yICggbGV0IGkgPSAwOyBpIDwgVEFCTEVfU0laRTsgaSArKyApIHtcbiAgICBfX2NhY2hlWyBpIF0gPSBjdWJpY0JlemllciggaSAvICggVEFCTEVfU0laRSAtIDEuMCApLCBjcHN4ICk7XG4gIH1cblxuICBsZXQgc2FtcGxlID0gMDtcbiAgZm9yICggbGV0IGkgPSAxOyBpIDwgVEFCTEVfU0laRTsgaSArKyApIHtcbiAgICBzYW1wbGUgPSBpIC0gMTtcbiAgICBpZiAoIHggPCBfX2NhY2hlWyBpIF0gKSB7IGJyZWFrOyB9XG4gIH1cblxuICBjb25zdCBkaXN0ID0gKCB4IC0gX19jYWNoZVsgc2FtcGxlIF0gKSAvICggX19jYWNoZVsgc2FtcGxlICsgMSBdIC0gX19jYWNoZVsgc2FtcGxlIF0gKTtcbiAgbGV0IHQgPSAoIHNhbXBsZSArIGRpc3QgKSAvICggVEFCTEVfU0laRSAtIDEgKTtcbiAgY29uc3QgZCA9IGRlbHRhQ3ViaWNCZXppZXIoIHQsIGNwc3ggKSAvICggY3BzeC5wMyAtIGNwc3gucDAgKTtcblxuICBpZiAoIE5FV1RPTl9FUFNJTE9OIDw9IGQgKSB7XG4gICAgdCA9IG5ld3RvbiggeCwgdCwgY3BzeCApO1xuICB9IGVsc2UgaWYgKCBkICE9PSAwLjAgKSB7XG4gICAgdCA9IHN1YmRpdiggeCwgKCBzYW1wbGUgKSAvICggVEFCTEVfU0laRSAtIDEgKSwgKCBzYW1wbGUgKyAxLjAgKSAvICggVEFCTEVfU0laRSAtIDEgKSwgY3BzeCApO1xuICB9XG5cbiAgcmV0dXJuIGN1YmljQmV6aWVyKCB0LCBjcHN5ICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBiZXppZXJFYXNpbmcoIG5vZGUwOiBCZXppZXJOb2RlLCBub2RlMTogQmV6aWVyTm9kZSwgdGltZTogbnVtYmVyICk6IG51bWJlciB7XG4gIHJldHVybiByYXdCZXppZXJFYXNpbmcoXG4gICAge1xuICAgICAgcDA6IG5vZGUwLnRpbWUsXG4gICAgICBwMTogbm9kZTAudGltZSArIG5vZGUwLm91dFRpbWUsXG4gICAgICBwMjogbm9kZTEudGltZSArIG5vZGUxLmluVGltZSxcbiAgICAgIHAzOiBub2RlMS50aW1lXG4gICAgfSxcbiAgICB7XG4gICAgICBwMDogbm9kZTAudmFsdWUsXG4gICAgICBwMTogbm9kZTAudmFsdWUgKyBub2RlMC5vdXRWYWx1ZSxcbiAgICAgIHAyOiBub2RlMS52YWx1ZSArIG5vZGUxLmluVmFsdWUsXG4gICAgICBwMzogbm9kZTEudmFsdWVcbiAgICB9LFxuICAgIHRpbWVcbiAgKTtcbn1cbiIsIi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9GTVMtQ2F0L2V4cGVyaW1lbnRhbC1ucG0vYmxvYi9jZjY4NTg0NjQ4OGVkMzc2NWUwYWJmNjhjOGY2Y2Q0OTE2MDQ5Y2ZhL3NyYy9hbGdvcml0aG0vYmluYXJ5U2VhcmNoLnRzXG5cbi8qKlxuICogTG9vayBmb3IgYW4gaW5kZXggZnJvbSBhIHNvcnRlZCBsaXN0IHVzaW5nIGJpbmFyeSBzZWFyY2guXG4gKlxuICogSWYgeW91IGRvbid0IHByb3ZpZGUgYSBjb21wYXJlIGZ1bmN0aW9uLCBpdCB3aWxsIGxvb2sgZm9yICoqdGhlIGZpcnN0IHNhbWUgdmFsdWUqKiBpdCBjYW4gZmluZC5cbiAqIElmIGl0IGNhbm5vdCBmaW5kIGFuIGV4YWN0bHkgbWF0Y2hpbmcgdmFsdWUsIGl0IGNhbiByZXR1cm4gTiB3aGVyZSB0aGUgbGVuZ3RoIG9mIGdpdmVuIGFycmF5IGlzIE4uXG4gKlxuICogQHBhcmFtIGFycmF5IEEgc29ydGVkIGFycmF5XG4gKiBAcGFyYW0gY29tcGFyZSBNYWtlIHRoaXMgZnVuY3Rpb24gcmV0dXJuIGBmYWxzZWAgaWYgeW91IHdhbnQgdG8gcG9pbnQgcmlnaHQgc2lkZSBvZiBnaXZlbiBlbGVtZW50LCBgdHJ1ZWAgaWYgeW91IHdhbnQgdG8gcG9pbnQgbGVmdCBzaWRlIG9mIGdpdmVuIGVsZW1lbnQuXG4gKiBAcmV0dXJucyBBbiBpbmRleCBmb3VuZFxuICovXG5leHBvcnQgZnVuY3Rpb24gYmluYXJ5U2VhcmNoPFQ+KCBhcnJheTogQXJyYXlMaWtlPFQ+LCBlbGVtZW50OiBUICk6IG51bWJlcjtcbmV4cG9ydCBmdW5jdGlvbiBiaW5hcnlTZWFyY2g8VD4oIGFycmF5OiBBcnJheUxpa2U8VD4sIGNvbXBhcmU6ICggZWxlbWVudDogVCApID0+IGJvb2xlYW4gKTogbnVtYmVyO1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmFyeVNlYXJjaDxUPihcbiAgYXJyYXk6IEFycmF5TGlrZTxUPixcbiAgZWxlbWVudE9yQ29tcGFyZTogVCB8ICggKCBlbGVtZW50OiBUICkgPT4gYm9vbGVhbiApLFxuKTogbnVtYmVyIHtcbiAgaWYgKCB0eXBlb2YgZWxlbWVudE9yQ29tcGFyZSAhPT0gJ2Z1bmN0aW9uJyApIHtcbiAgICByZXR1cm4gYmluYXJ5U2VhcmNoKCBhcnJheSwgKCBlbGVtZW50ICkgPT4gKCBlbGVtZW50IDwgZWxlbWVudE9yQ29tcGFyZSApICk7XG4gIH1cbiAgY29uc3QgY29tcGFyZSA9IGVsZW1lbnRPckNvbXBhcmUgYXMgKCBlbGVtZW50OiBUICkgPT4gYm9vbGVhbjtcblxuICBsZXQgc3RhcnQgPSAwO1xuICBsZXQgZW5kID0gYXJyYXkubGVuZ3RoO1xuXG4gIHdoaWxlICggc3RhcnQgPCBlbmQgKSB7XG4gICAgY29uc3QgY2VudGVyID0gKCBzdGFydCArIGVuZCApID4+IDE7XG4gICAgY29uc3QgY2VudGVyRWxlbWVudCA9IGFycmF5WyBjZW50ZXIgXTtcblxuICAgIGNvbnN0IGNvbXBhcmVSZXN1bHQgPSBjb21wYXJlKCBjZW50ZXJFbGVtZW50ICk7XG5cbiAgICBpZiAoIGNvbXBhcmVSZXN1bHQgKSB7XG4gICAgICBzdGFydCA9IGNlbnRlciArIDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVuZCA9IGNlbnRlcjtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gc3RhcnQ7XG59XG4iLCJpbXBvcnQgeyBBdXRvbWF0b24sIEN1cnZlIH0gZnJvbSAnLic7XG5pbXBvcnQgdHlwZSB7IFNlcmlhbGl6ZWRDaGFubmVsSXRlbSB9IGZyb20gJy4vdHlwZXMvU2VyaWFsaXplZENoYW5uZWxJdGVtJztcblxuLyoqXG4gKiBSZXByZXNlbnRzIGFuIGl0ZW0gb2YgYSBbW0NoYW5uZWxdXS5cbiAqL1xuZXhwb3J0IGNsYXNzIENoYW5uZWxJdGVtIHtcbiAgLyoqXG4gICAqIFRoZSBwYXJlbnQgYXV0b21hdG9uLlxuICAgKi9cbiAgcHJvdGVjdGVkIHJlYWRvbmx5IF9fYXV0b21hdG9uOiBBdXRvbWF0b247XG5cbiAgLyoqXG4gICAqIEJlZ2lubmluZyB0aW1lcG9pbnQgb2YgdGhlIGl0ZW0uXG4gICAqL1xuICBwdWJsaWMgdGltZSE6IG51bWJlcjtcblxuICAvKipcbiAgICogTGVuZ3RoIG9mIHRoZSBpdGVtLlxuICAgKi9cbiAgcHVibGljIGxlbmd0aCE6IG51bWJlcjtcblxuICAvKipcbiAgICogVmFsdWUgb2YgdGhlIGl0ZW0uXG4gICAqL1xuICBwdWJsaWMgdmFsdWUhOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgcmVzZXQgY2hhbm5lbHMgdmFsdWUgdG8gemVybyBhdCB0aGUgZW5kIG9mIHRoaXMgaXRlbSBvciBub3QuXG4gICAqL1xuICBwdWJsaWMgcmVzZXQ/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBUaGlzIHdpbGwgb25seSBtYWtlIHNlbnNlIHdoZW4ge0BsaW5rIGN1cnZlfSBpcyBzcGVjaWZpZWQuXG4gICAqIFRoZSB0aW1lIG9mZnNldCBvZiB0aGUgaXRlbS5cbiAgICovXG4gIHB1YmxpYyBvZmZzZXQhOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoaXMgd2lsbCBvbmx5IG1ha2Ugc2Vuc2Ugd2hlbiB7QGxpbmsgY3VydmV9IGlzIHNwZWNpZmllZC5cbiAgICogVGhlIHNwZWVkIHJhdGUgb2YgdGhlIGl0ZW0uXG4gICAqL1xuICBwdWJsaWMgc3BlZWQhOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoaXMgd2lsbCBvbmx5IG1ha2Ugc2Vuc2Ugd2hlbiB7QGxpbmsgY3VydmV9IGlzIHNwZWNpZmllZC5cbiAgICogVGhlIHNjYWxlIG9mIHRoZSBpdGVtIGluIHRoZSB2YWx1ZSBheGlzLlxuICAgKi9cbiAgcHVibGljIGFtcCE6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIGN1cnZlIG9mIHRoZSBpdGVtLlxuICAgKi9cbiAgcHVibGljIGN1cnZlPzogQ3VydmU7XG5cbiAgLyoqXG4gICAqIEVuZGluZyB0aW1lcG9pbnQgb2YgdGhlIGl0ZW0uXG4gICAqL1xuICBwdWJsaWMgZ2V0IGVuZCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLnRpbWUgKyB0aGlzLmxlbmd0aDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RvciBvZiB0aGUgW1tDaGFubmVsSXRlbV1dLlxuICAgKiBAcGFyYW0gYXV0b21hdG9uIFBhcmVudCBhdXRvbWF0b25cbiAgICogQHBhcmFtIGRhdGEgRGF0YSBvZiB0aGUgaXRlbVxuICAgKi9cbiAgcHVibGljIGNvbnN0cnVjdG9yKCBhdXRvbWF0b246IEF1dG9tYXRvbiwgZGF0YTogU2VyaWFsaXplZENoYW5uZWxJdGVtICkge1xuICAgIHRoaXMuX19hdXRvbWF0b24gPSBhdXRvbWF0b247XG5cbiAgICB0aGlzLmRlc2VyaWFsaXplKCBkYXRhICk7XG4gIH1cblxuICBwdWJsaWMgZ2V0VmFsdWUoIHRpbWU6IG51bWJlciApOiBudW1iZXIge1xuICAgIGlmICggdGhpcy5yZXNldCAmJiB0aGlzLmxlbmd0aCA8PSB0aW1lICkge1xuICAgICAgcmV0dXJuIDAuMDtcbiAgICB9XG5cbiAgICBpZiAoIHRoaXMuY3VydmUgKSB7XG4gICAgICBjb25zdCB0ID0gdGhpcy5vZmZzZXQhICsgdGltZSAqIHRoaXMuc3BlZWQhO1xuICAgICAgcmV0dXJuIHRoaXMudmFsdWUgKyB0aGlzLmFtcCAqIHRoaXMuY3VydmUuZ2V0VmFsdWUoIHQgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMudmFsdWU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERlc2VyaWFsaXplIGEgc2VyaWFsaXplZCBkYXRhIG9mIGl0ZW0gZnJvbSBbW1NlcmlhbGl6ZWRDaGFubmVsSXRlbV1dLlxuICAgKiBAcGFyYW0gZGF0YSBBIHNlcmlhbGl6ZWQgaXRlbS5cbiAgICovXG4gIHB1YmxpYyBkZXNlcmlhbGl6ZSggZGF0YTogU2VyaWFsaXplZENoYW5uZWxJdGVtICk6IHZvaWQge1xuICAgIHRoaXMudGltZSA9IGRhdGEudGltZSA/PyAwLjA7XG4gICAgdGhpcy5sZW5ndGggPSBkYXRhLmxlbmd0aCA/PyAwLjA7XG4gICAgdGhpcy52YWx1ZSA9IGRhdGEudmFsdWUgPz8gMC4wO1xuICAgIHRoaXMub2Zmc2V0ID0gZGF0YS5vZmZzZXQgPz8gMC4wO1xuICAgIHRoaXMuc3BlZWQgPSBkYXRhLnNwZWVkID8/IDEuMDtcbiAgICB0aGlzLmFtcCA9IGRhdGEuYW1wID8/IDEuMDtcbiAgICB0aGlzLnJlc2V0ID0gZGF0YS5yZXNldDtcbiAgICBpZiAoIGRhdGEuY3VydmUgIT0gbnVsbCApIHtcbiAgICAgIHRoaXMuY3VydmUgPSB0aGlzLl9fYXV0b21hdG9uLmdldEN1cnZlKCBkYXRhLmN1cnZlICkhO1xuICAgICAgdGhpcy5sZW5ndGggPSBkYXRhLmxlbmd0aCA/PyB0aGlzLmN1cnZlLmxlbmd0aCA/PyAwLjA7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBBdXRvbWF0b24gfSBmcm9tICcuL0F1dG9tYXRvbic7XG5pbXBvcnQgeyBDaGFubmVsSXRlbSB9IGZyb20gJy4vQ2hhbm5lbEl0ZW0nO1xuaW1wb3J0IHsgYmluYXJ5U2VhcmNoIH0gZnJvbSAnLi91dGlscy9iaW5hcnlTZWFyY2gnO1xuaW1wb3J0IHR5cGUgeyBDaGFubmVsVXBkYXRlRXZlbnQgfSBmcm9tICcuL3R5cGVzL0NoYW5uZWxVcGRhdGVFdmVudCc7XG5pbXBvcnQgdHlwZSB7IFNlcmlhbGl6ZWRDaGFubmVsIH0gZnJvbSAnLi90eXBlcy9TZXJpYWxpemVkQ2hhbm5lbCc7XG5cbi8qKlxuICogSXQgcmVwcmVzZW50cyBhIGNoYW5uZWwgb2YgQXV0b21hdG9uLlxuICovXG5leHBvcnQgY2xhc3MgQ2hhbm5lbCB7XG4gIC8qKlxuICAgKiBUaGUgcGFyZW50IGF1dG9tYXRvbi5cbiAgICovXG4gIHByb3RlY3RlZCBfX2F1dG9tYXRvbjogQXV0b21hdG9uO1xuXG4gIC8qKlxuICAgKiBMaXN0IG9mIGNoYW5uZWwgaXRlbXMuXG4gICAqL1xuICBwcm90ZWN0ZWQgX19pdGVtczogQ2hhbm5lbEl0ZW1bXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBBIGNhY2hlIG9mIGxhc3QgY2FsY3VsYXRlZCB2YWx1ZS5cbiAgICovXG4gIHByb3RlY3RlZCBfX3ZhbHVlOiBudW1iZXIgPSAwLjA7XG5cbiAgLyoqXG4gICAqIFRoZSB0aW1lIHRoYXQgd2FzIHVzZWQgZm9yIHRoZSBjYWxjdWxhdGlvbiBvZiBbW19fbGFzdFZhbHVlXV0uXG4gICAqL1xuICBwcm90ZWN0ZWQgX190aW1lOiBudW1iZXIgPSAtSW5maW5pdHk7XG5cbiAgLyoqXG4gICAqIFRoZSBpbmRleCBvZiBbW19faXRlbXNdXSBpdCBzaG91bGQgZXZhbHVhdGUgbmV4dC5cbiAgICovXG4gIHByb3RlY3RlZCBfX2hlYWQ6IG51bWJlciA9IDA7XG5cbiAgLyoqXG4gICAqIEFuIGFycmF5IG9mIGxpc3RlbmVycy5cbiAgICovXG4gIHByb3RlY3RlZCBfX2xpc3RlbmVyczogQXJyYXk8KCBldmVudDogQ2hhbm5lbFVwZGF0ZUV2ZW50ICkgPT4gdm9pZD4gPSBbXTtcblxuICAvKipcbiAgICogQ29uc3RydWN0b3Igb2YgdGhlIFtbQ2hhbm5lbF1dLlxuICAgKiBAcGFyYW0gYXV0b21hdG9uIFBhcmVudCBhdXRvbWF0b25cbiAgICogQHBhcmFtIGRhdGEgRGF0YSBvZiB0aGUgY2hhbm5lbFxuICAgKi9cbiAgcHVibGljIGNvbnN0cnVjdG9yKCBhdXRvbWF0b246IEF1dG9tYXRvbiwgZGF0YTogU2VyaWFsaXplZENoYW5uZWwgKSB7XG4gICAgdGhpcy5fX2F1dG9tYXRvbiA9IGF1dG9tYXRvbjtcblxuICAgIHRoaXMuZGVzZXJpYWxpemUoIGRhdGEgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIGNhY2hlIG9mIGxhc3QgY2FsY3VsYXRlZCB2YWx1ZS5cbiAgICovXG4gIHB1YmxpYyBnZXQgY3VycmVudFZhbHVlKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9fdmFsdWU7IH1cblxuICAvKipcbiAgICogVGhlIHRpbWUgdGhhdCB3YXMgdXNlZCBmb3IgdGhlIGNhbGN1bGF0aW9uIG9mIFtbX19sYXN0VmFsdWVdXS5cbiAgICovXG4gIHB1YmxpYyBnZXQgY3VycmVudFRpbWUoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX190aW1lOyB9XG5cbiAgLyoqXG4gICAqIExvYWQgYSBzZXJpYWxpemVkIGRhdGEgb2YgYSBjaGFubmVsLlxuICAgKiBAcGFyYW0gZGF0YSBEYXRhIG9mIGEgY2hhbm5lbFxuICAgKi9cbiAgcHVibGljIGRlc2VyaWFsaXplKCBkYXRhOiBTZXJpYWxpemVkQ2hhbm5lbCApOiB2b2lkIHtcbiAgICB0aGlzLl9faXRlbXMgPSBkYXRhLml0ZW1zPy5tYXAoICggaXRlbSApID0+IG5ldyBDaGFubmVsSXRlbSggdGhpcy5fX2F1dG9tYXRvbiwgaXRlbSApICkgPz8gW107XG4gIH1cblxuICAvKipcbiAgICogUmVzZXQgdGhlIGludGVybmFsIHN0YXRlcy5cbiAgICogQ2FsbCB0aGlzIG1ldGhvZCB3aGVuIHlvdSBzZWVrIHRoZSB0aW1lLlxuICAgKi9cbiAgcHVibGljIHJlc2V0KCk6IHZvaWQge1xuICAgIHRoaXMuX190aW1lID0gLUluZmluaXR5O1xuICAgIHRoaXMuX192YWx1ZSA9IDA7XG4gICAgdGhpcy5fX2hlYWQgPSAwO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIG5ldyBsaXN0ZW5lciB0aGF0IHJlY2VpdmVzIGEgW1tDaGFubmVsVXBkYXRlRXZlbnRdXSB3aGVuIGFuIHVwZGF0ZSBpcyBoYXBwZW5lZC5cbiAgICogQHBhcmFtIGxpc3RlbmVyIEEgc3Vic2NyaWJpbmcgbGlzdGVuZXJcbiAgICovXG4gIHB1YmxpYyBzdWJzY3JpYmUoIGxpc3RlbmVyOiAoIGV2ZW50OiBDaGFubmVsVXBkYXRlRXZlbnQgKSA9PiB2b2lkICk6IHZvaWQge1xuICAgIHRoaXMuX19saXN0ZW5lcnMucHVzaCggbGlzdGVuZXIgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIHZhbHVlIG9mIHNwZWNpZmllZCB0aW1lIHBvaW50LlxuICAgKiBAcGFyYW0gdGltZSBUaW1lIGF0IHRoZSBwb2ludCB5b3Ugd2FudCB0byBncmFiIHRoZSB2YWx1ZS5cbiAgICogQHJldHVybnMgUmVzdWx0IHZhbHVlXG4gICAqL1xuICBwdWJsaWMgZ2V0VmFsdWUoIHRpbWU6IG51bWJlciApOiBudW1iZXIge1xuICAgIC8vIG5vIGl0ZW1zPz8/IGRhbW5cbiAgICBpZiAoIHRoaXMuX19pdGVtcy5sZW5ndGggPT09IDAgKSB7XG4gICAgICByZXR1cm4gMC4wO1xuICAgIH1cblxuICAgIGNvbnN0IG5leHQgPSBiaW5hcnlTZWFyY2goIHRoaXMuX19pdGVtcywgKCBpdGVtICkgPT4gKCBpdGVtLnRpbWUgPCB0aW1lICkgKTtcblxuICAgIC8vIGl0J3MgdGhlIGZpcnN0IG9uZSFcbiAgICBpZiAoIG5leHQgPT09IDAgKSB7XG4gICAgICByZXR1cm4gMC4wO1xuICAgIH1cblxuICAgIGNvbnN0IGl0ZW0gPSB0aGlzLl9faXRlbXNbIG5leHQgLSAxIF07XG4gICAgaWYgKCBpdGVtLmVuZCA8IHRpbWUgKSB7XG4gICAgICByZXR1cm4gaXRlbS5nZXRWYWx1ZSggaXRlbS5sZW5ndGggKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGl0ZW0uZ2V0VmFsdWUoIHRpbWUgLSBpdGVtLnRpbWUgKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVGhpcyBtZXRob2QgaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBieSBbW0F1dG9tYXRvbi51cGRhdGVdXS5cbiAgICogQ29uc3VtZSBhbmQgcmV0dXJuIGl0ZW1zLlxuICAgKiBAcGFyYW0gdGltZSBUaGUgY3VycmVudCB0aW1lIG9mIHRoZSBwYXJlbnQgW1tBdXRvbWF0b25dXVxuICAgKiBAcmV0dXJucyBBcnJheSBvZiB0dXBsZXMsIFsgdGltaW5nIG9mIHRoZSBldmVudCwgYSBmdW5jdGlvbiB0aGF0IGV4ZWN1dGUgdGhlIGV2ZW50IF1cbiAgICovXG4gIHB1YmxpYyBjb25zdW1lKCB0aW1lOiBudW1iZXIgKTogWyB0aW1lOiBudW1iZXIsIHVwZGF0ZTogKCkgPT4gdm9pZCBdW10ge1xuICAgIGNvbnN0IHJldDogWyBudW1iZXIsICgpID0+IHZvaWQgXVtdID0gW107XG5cbiAgICBjb25zdCBwcmV2VGltZSA9IHRoaXMuX190aW1lO1xuXG4gICAgZm9yICggbGV0IGkgPSB0aGlzLl9faGVhZDsgaSA8IHRoaXMuX19pdGVtcy5sZW5ndGg7IGkgKysgKSB7XG4gICAgICBjb25zdCBpdGVtID0gdGhpcy5fX2l0ZW1zWyBpIF07XG4gICAgICBjb25zdCB7IHRpbWU6IGJlZ2luLCBlbmQsIGxlbmd0aCB9ID0gaXRlbTtcbiAgICAgIGxldCBlbGFwc2VkID0gdGltZSAtIGJlZ2luO1xuXG4gICAgICBpZiAoIGVsYXBzZWQgPCAwLjAgKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IHByb2dyZXNzOiBudW1iZXI7XG4gICAgICAgIGxldCBpbml0OiB0cnVlIHwgdW5kZWZpbmVkO1xuICAgICAgICBsZXQgdW5pbml0OiB0cnVlIHwgdW5kZWZpbmVkO1xuXG4gICAgICAgIGlmICggbGVuZ3RoIDw9IGVsYXBzZWQgKSB7XG4gICAgICAgICAgZWxhcHNlZCA9IGxlbmd0aDtcbiAgICAgICAgICBwcm9ncmVzcyA9IDEuMDtcbiAgICAgICAgICB1bmluaXQgPSB0cnVlO1xuXG4gICAgICAgICAgaWYgKCBpID09PSB0aGlzLl9faGVhZCApIHtcbiAgICAgICAgICAgIHRoaXMuX19oZWFkICsrO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwcm9ncmVzcyA9IGxlbmd0aCAhPT0gMC4wXG4gICAgICAgICAgICA/IGVsYXBzZWQgLyBsZW5ndGhcbiAgICAgICAgICAgIDogMS4wO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBwcmV2VGltZSA8IGJlZ2luICkge1xuICAgICAgICAgIGluaXQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0LnB1c2goIFsgYmVnaW4gKyBlbGFwc2VkLCAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5fX3ZhbHVlID0gaXRlbS5nZXRWYWx1ZSggZWxhcHNlZCApO1xuXG4gICAgICAgICAgdGhpcy5fX2xpc3RlbmVycy5mb3JFYWNoKCAoIGxpc3RlbmVyICkgPT4gbGlzdGVuZXIoIHtcbiAgICAgICAgICAgIHRpbWUsXG4gICAgICAgICAgICBlbGFwc2VkLFxuICAgICAgICAgICAgYmVnaW4sXG4gICAgICAgICAgICBlbmQsXG4gICAgICAgICAgICBsZW5ndGgsXG4gICAgICAgICAgICB2YWx1ZTogdGhpcy5fX3ZhbHVlLFxuICAgICAgICAgICAgcHJvZ3Jlc3MsXG4gICAgICAgICAgICBpbml0LFxuICAgICAgICAgICAgdW5pbml0LFxuICAgICAgICAgIH0gKSApO1xuICAgICAgICB9IF0gKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl9fdGltZSA9IHRpbWU7XG5cbiAgICByZXR1cm4gcmV0O1xuICB9XG59XG4iLCJpbXBvcnQgeyBBdXRvbWF0b24gfSBmcm9tICcuL0F1dG9tYXRvbic7XG5pbXBvcnQgeyBiZXppZXJFYXNpbmcgfSBmcm9tICcuL3V0aWxzL2JlemllckVhc2luZyc7XG5pbXBvcnQgdHlwZSB7IEJlemllck5vZGUgfSBmcm9tICcuL3R5cGVzL0Jlemllck5vZGUnO1xuaW1wb3J0IHR5cGUgeyBGeENvbnRleHQgfSBmcm9tICcuL3R5cGVzL0Z4Q29udGV4dCc7XG5pbXBvcnQgdHlwZSB7IEZ4U2VjdGlvbiB9IGZyb20gJy4vdHlwZXMvRnhTZWN0aW9uJztcbmltcG9ydCB0eXBlIHsgU2VyaWFsaXplZEN1cnZlIH0gZnJvbSAnLi90eXBlcy9TZXJpYWxpemVkQ3VydmUnO1xuXG4vKipcbiAqIEl0IHJlcHJlc2VudHMgYSBjdXJ2ZSBvZiBBdXRvbWF0b24uXG4gKi9cbmV4cG9ydCBjbGFzcyBDdXJ2ZSB7XG4gIC8qKlxuICAgKiBUaGUgcGFyZW50IGF1dG9tYXRvbi5cbiAgICovXG4gIHByb3RlY3RlZCBfX2F1dG9tYXRvbjogQXV0b21hdG9uO1xuXG4gIC8qKlxuICAgKiBBbiBhcnJheSBvZiBwcmVjYWxjdWxhdGVkIHZhbHVlLlxuICAgKiBJdHMgbGVuZ3RoIGlzIHNhbWUgYXMgYGN1cnZlLl9fYXV0b21hdG9uLnJlc29sdXRpb24gKiBjdXJ2ZS5fX2F1dG9tYXRvbi5sZW5ndGggKyAxYC5cbiAgKi9cbiAgcHJvdGVjdGVkIF9fdmFsdWVzITogRmxvYXQzMkFycmF5O1xuXG4gIC8qKlxuICAgKiBBbiBhcnJheSBvZiBib29sIHdoZXJlIHlvdSBkbyBub3Qgd2FudCB0byBpbnRlcnBvbGF0ZSB0aGUgdmFsdWUuXG4gICAqIEl0cyBsZW5ndGggaXMgc2FtZSBhcyBgY3VydmUuX19hdXRvbWF0b24ucmVzb2x1dGlvbiAqIGN1cnZlLl9fYXV0b21hdG9uLmxlbmd0aCArIDFgLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fc2hvdWxkTm90SW50ZXJwb2xhdGUhOiBVaW50OEFycmF5O1xuXG4gIC8qKlxuICAgKiBMaXN0IG9mIGJlemllciBub2RlLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fbm9kZXM6IEJlemllck5vZGVbXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBMaXN0IG9mIGZ4IHNlY3Rpb25zLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fZnhzOiBGeFNlY3Rpb25bXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBUaGUgbGVuZ3RoIG9mIHRoaXMgY3VydmUuXG4gICAqL1xuICBwdWJsaWMgZ2V0IGxlbmd0aCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9fbm9kZXNbIHRoaXMuX19ub2Rlcy5sZW5ndGggLSAxIF0udGltZTtcbiAgfVxuXG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yIG9mIGEgW1tDdXJ2ZV1dLlxuICAgKiBAcGFyYW0gYXV0b21hdG9uIFBhcmVudCBhdXRvbWF0b25cbiAgICogQHBhcmFtIGRhdGEgRGF0YSBvZiB0aGUgY3VydmVcbiAgICovXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggYXV0b21hdG9uOiBBdXRvbWF0b24sIGRhdGE6IFNlcmlhbGl6ZWRDdXJ2ZSApIHtcbiAgICB0aGlzLl9fYXV0b21hdG9uID0gYXV0b21hdG9uO1xuXG4gICAgdGhpcy5kZXNlcmlhbGl6ZSggZGF0YSApO1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWQgYSBzZXJpYWxpemVkIGRhdGEgb2YgYSBjdXJ2ZS5cbiAgICogQHBhcmFtIGRhdGEgRGF0YSBvZiBhIGN1cnZlXG4gICAqL1xuICBwdWJsaWMgZGVzZXJpYWxpemUoIGRhdGE6IFNlcmlhbGl6ZWRDdXJ2ZSApOiB2b2lkIHtcbiAgICB0aGlzLl9fbm9kZXMgPSBkYXRhLm5vZGVzLm1hcCggKCBub2RlICkgPT4gKCB7XG4gICAgICB0aW1lOiBub2RlWyAwIF0gPz8gMC4wLFxuICAgICAgdmFsdWU6IG5vZGVbIDEgXSA/PyAwLjAsXG4gICAgICBpblRpbWU6IG5vZGVbIDIgXSA/PyAwLjAsXG4gICAgICBpblZhbHVlOiBub2RlWyAzIF0gPz8gMC4wLFxuICAgICAgb3V0VGltZTogbm9kZVsgNCBdID8/IDAuMCxcbiAgICAgIG91dFZhbHVlOiBub2RlWyA1IF0gPz8gMC4wLFxuICAgIH0gKSApO1xuXG4gICAgdGhpcy5fX2Z4cyA9IFtdO1xuICAgIGRhdGEuZnhzPy5mb3JFYWNoKCAoIGZ4ICkgPT4ge1xuICAgICAgaWYgKCBmeC5ieXBhc3MgKSB7IHJldHVybjsgfVxuICAgICAgdGhpcy5fX2Z4cy5wdXNoKCB7XG4gICAgICAgIHRpbWU6IGZ4LnRpbWUgPz8gMC4wLFxuICAgICAgICBsZW5ndGg6IGZ4Lmxlbmd0aCA/PyAwLjAsXG4gICAgICAgIHJvdzogZngucm93ID8/IDAsXG4gICAgICAgIGRlZjogZnguZGVmLFxuICAgICAgICBwYXJhbXM6IGZ4LnBhcmFtc1xuICAgICAgfSApO1xuICAgIH0gKTtcblxuICAgIHRoaXMucHJlY2FsYygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFByZWNhbGN1bGF0ZSB2YWx1ZSBvZiBzYW1wbGVzLlxuICAgKi9cbiAgcHVibGljIHByZWNhbGMoKTogdm9pZCB7XG4gICAgY29uc3QgdmFsdWVzTGVuZ3RoID0gTWF0aC5jZWlsKCB0aGlzLl9fYXV0b21hdG9uLnJlc29sdXRpb24gKiB0aGlzLmxlbmd0aCApICsgMTtcblxuICAgIHRoaXMuX192YWx1ZXMgPSBuZXcgRmxvYXQzMkFycmF5KCB2YWx1ZXNMZW5ndGggKTtcbiAgICB0aGlzLl9fc2hvdWxkTm90SW50ZXJwb2xhdGUgPSBuZXcgVWludDhBcnJheSggdmFsdWVzTGVuZ3RoICk7XG5cbiAgICB0aGlzLl9fZ2VuZXJhdGVDdXJ2ZSgpO1xuICAgIHRoaXMuX19hcHBseUZ4cygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiB0aGUgdmFsdWUgb2Ygc3BlY2lmaWVkIHRpbWUgcG9pbnQuXG4gICAqIEBwYXJhbSB0aW1lIFRpbWUgYXQgdGhlIHBvaW50IHlvdSB3YW50IHRvIGdyYWIgdGhlIHZhbHVlLlxuICAgKiBAcmV0dXJucyBSZXN1bHQgdmFsdWVcbiAgICovXG4gIHB1YmxpYyBnZXRWYWx1ZSggdGltZTogbnVtYmVyICk6IG51bWJlciB7XG4gICAgaWYgKCB0aW1lIDwgMC4wICkge1xuICAgICAgLy8gY2xhbXAgbGVmdFxuICAgICAgcmV0dXJuIHRoaXMuX192YWx1ZXNbIDAgXTtcblxuICAgIH0gZWxzZSBpZiAoIHRoaXMubGVuZ3RoIDw9IHRpbWUgKSB7XG4gICAgICAvLyBjbGFtcCByaWdodFxuICAgICAgcmV0dXJuIHRoaXMuX192YWx1ZXNbIHRoaXMuX192YWx1ZXMubGVuZ3RoIC0gMSBdO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGZldGNoIHR3byB2YWx1ZXMgdGhlbiBkbyB0aGUgbGluZWFyIGludGVycG9sYXRpb25cbiAgICAgIGNvbnN0IGluZGV4ID0gdGltZSAqIHRoaXMuX19hdXRvbWF0b24ucmVzb2x1dGlvbjtcbiAgICAgIGNvbnN0IGluZGV4aSA9IE1hdGguZmxvb3IoIGluZGV4ICk7XG4gICAgICBjb25zdCBpbmRleGYgPSBpbmRleCAlIDEuMDtcblxuICAgICAgY29uc3QgdjAgPSB0aGlzLl9fdmFsdWVzWyBpbmRleGkgXTtcbiAgICAgIGxldCB2MSA9IHRoaXMuX192YWx1ZXNbIGluZGV4aSArIDEgXTtcblxuICAgICAgaWYgKCB0aGlzLl9fc2hvdWxkTm90SW50ZXJwb2xhdGVbIGluZGV4aSBdICkge1xuICAgICAgICAvLyBjb250aW51ZSAgdGhlIHByZXZpb3VzIGRlbHRhXG4gICAgICAgIGNvbnN0IHZwID0gdGhpcy5fX3ZhbHVlc1sgTWF0aC5tYXgoIGluZGV4aSAtIDEsIDAgKSBdO1xuICAgICAgICB2MSA9IDIuMCAqIHYwIC0gdnA7IC8vIHYwICsgKCB2MCAtIHZwICk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHYgPSB2MCArICggdjEgLSB2MCApICogaW5kZXhmO1xuXG4gICAgICByZXR1cm4gdjtcblxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgZmlyc3Qgc3RlcCBvZiB7QGxpbmsgcHJlY2FsY306IGdlbmVyYXRlIGEgY3VydmUgb3V0IG9mIG5vZGVzLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fZ2VuZXJhdGVDdXJ2ZSgpOiB2b2lkIHtcbiAgICBsZXQgbm9kZVRhaWwgPSB0aGlzLl9fbm9kZXNbIDAgXTtcbiAgICBsZXQgaVRhaWwgPSAwO1xuICAgIGZvciAoIGxldCBpTm9kZSA9IDA7IGlOb2RlIDwgdGhpcy5fX25vZGVzLmxlbmd0aCAtIDE7IGlOb2RlICsrICkge1xuICAgICAgY29uc3Qgbm9kZTAgPSBub2RlVGFpbDtcbiAgICAgIG5vZGVUYWlsID0gdGhpcy5fX25vZGVzWyBpTm9kZSArIDEgXTtcbiAgICAgIGNvbnN0IGkwID0gaVRhaWw7XG4gICAgICBpVGFpbCA9IE1hdGguZmxvb3IoIG5vZGVUYWlsLnRpbWUgKiB0aGlzLl9fYXV0b21hdG9uLnJlc29sdXRpb24gKTtcblxuICAgICAgdGhpcy5fX3ZhbHVlc1sgaTAgXSA9IG5vZGUwLnZhbHVlO1xuXG4gICAgICBpZiAoIGkwID09PSBpVGFpbCAmJiBpVGFpbCAhPT0gMCApIHtcbiAgICAgICAgdGhpcy5fX3Nob3VsZE5vdEludGVycG9sYXRlWyBpVGFpbCAtIDEgXSA9IDE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKCBsZXQgaSA9IGkwICsgMTsgaSA8PSBpVGFpbDsgaSArKyApIHtcbiAgICAgICAgICBjb25zdCB0aW1lID0gaSAvIHRoaXMuX19hdXRvbWF0b24ucmVzb2x1dGlvbjtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IGJlemllckVhc2luZyggbm9kZTAsIG5vZGVUYWlsLCB0aW1lICk7XG4gICAgICAgICAgdGhpcy5fX3ZhbHVlc1sgaSBdID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKCBsZXQgaSA9IGlUYWlsICsgMTsgaSA8IHRoaXMuX192YWx1ZXMubGVuZ3RoOyBpICsrICkge1xuICAgICAgdGhpcy5fX3ZhbHVlc1sgaSBdID0gbm9kZVRhaWwudmFsdWU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBzZWNvbmQgc3RlcCBvZiB7QGxpbmsgcHJlY2FsY306IGFwcGx5IGZ4cyB0byB0aGUgZ2VuZXJhdGVkIGN1cnZlcy5cbiAgICovXG4gIHByb3RlY3RlZCBfX2FwcGx5RnhzKCk6IHZvaWQge1xuICAgIGZvciAoIGxldCBpRnggPSAwOyBpRnggPCB0aGlzLl9fZnhzLmxlbmd0aDsgaUZ4ICsrICkge1xuICAgICAgY29uc3QgZnggPSB0aGlzLl9fZnhzWyBpRnggXTtcbiAgICAgIGNvbnN0IGZ4RGVmID0gdGhpcy5fX2F1dG9tYXRvbi5nZXRGeERlZmluaXRpb24oIGZ4LmRlZiApO1xuICAgICAgaWYgKCAhZnhEZWYgKSB7XG4gICAgICAgIGlmICggcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdkZXZlbG9wbWVudCcgKSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKCBgTm8gc3VjaCBmeCBkZWZpbml0aW9uOiAkeyBmeC5kZWYgfWAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBhdmFpbGFibGVFbmQgPSBNYXRoLm1pbiggdGhpcy5sZW5ndGgsIGZ4LnRpbWUgKyBmeC5sZW5ndGggKTtcbiAgICAgIGNvbnN0IGkwID0gTWF0aC5jZWlsKCB0aGlzLl9fYXV0b21hdG9uLnJlc29sdXRpb24gKiBmeC50aW1lICk7XG4gICAgICBjb25zdCBpMSA9IE1hdGguZmxvb3IoIHRoaXMuX19hdXRvbWF0b24ucmVzb2x1dGlvbiAqIGF2YWlsYWJsZUVuZCApO1xuICAgICAgaWYgKCBpMSA8PSBpMCApIHtcbiAgICAgICAgaWYgKCBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50JyApIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCAnTGVuZ3RoIG9mIHRoZSBmeCBzZWN0aW9uIGlzIGJlaW5nIG5lZ2F0aXZlJyApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHRlbXBMZW5ndGggPSBpMSAtIGkwICsgMTtcbiAgICAgIGNvbnN0IHRlbXBWYWx1ZXMgPSBuZXcgRmxvYXQzMkFycmF5KCB0ZW1wTGVuZ3RoICk7XG5cbiAgICAgIGNvbnN0IGNvbnRleHQ6IEZ4Q29udGV4dCA9IHtcbiAgICAgICAgaW5kZXg6IGkwLFxuICAgICAgICBpMCxcbiAgICAgICAgaTEsXG4gICAgICAgIHRpbWU6IGZ4LnRpbWUsXG4gICAgICAgIHQwOiBmeC50aW1lLFxuICAgICAgICB0MTogZngudGltZSArIGZ4Lmxlbmd0aCxcbiAgICAgICAgZGVsdGFUaW1lOiAxLjAgLyB0aGlzLl9fYXV0b21hdG9uLnJlc29sdXRpb24sXG4gICAgICAgIHZhbHVlOiAwLjAsXG4gICAgICAgIHByb2dyZXNzOiAwLjAsXG4gICAgICAgIGVsYXBzZWQ6IDAuMCxcbiAgICAgICAgcmVzb2x1dGlvbjogdGhpcy5fX2F1dG9tYXRvbi5yZXNvbHV0aW9uLFxuICAgICAgICBsZW5ndGg6IGZ4Lmxlbmd0aCxcbiAgICAgICAgcGFyYW1zOiBmeC5wYXJhbXMsXG4gICAgICAgIGFycmF5OiB0aGlzLl9fdmFsdWVzLFxuICAgICAgICBzaG91bGROb3RJbnRlcnBvbGF0ZTogdGhpcy5fX3Nob3VsZE5vdEludGVycG9sYXRlWyBpMCBdID09PSAxLFxuICAgICAgICBzZXRTaG91bGROb3RJbnRlcnBvbGF0ZTogKCBzaG91bGROb3RJbnRlcnBvbGF0ZTogYm9vbGVhbiApID0+IHtcbiAgICAgICAgICB0aGlzLl9fc2hvdWxkTm90SW50ZXJwb2xhdGVbIGNvbnRleHQuaW5kZXggXSA9IHNob3VsZE5vdEludGVycG9sYXRlID8gMSA6IDA7XG4gICAgICAgIH0sXG4gICAgICAgIGdldFZhbHVlOiB0aGlzLmdldFZhbHVlLmJpbmQoIHRoaXMgKSxcbiAgICAgICAgaW5pdDogdHJ1ZSxcbiAgICAgICAgc3RhdGU6IHt9LFxuICAgICAgfTtcblxuICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGVtcExlbmd0aDsgaSArKyApIHtcbiAgICAgICAgY29udGV4dC5pbmRleCA9IGkgKyBpMDtcbiAgICAgICAgY29udGV4dC50aW1lID0gY29udGV4dC5pbmRleCAvIHRoaXMuX19hdXRvbWF0b24ucmVzb2x1dGlvbjtcbiAgICAgICAgY29udGV4dC52YWx1ZSA9IHRoaXMuX192YWx1ZXNbIGkgKyBpMCBdO1xuICAgICAgICBjb250ZXh0LmVsYXBzZWQgPSBjb250ZXh0LnRpbWUgLSBmeC50aW1lO1xuICAgICAgICBjb250ZXh0LnByb2dyZXNzID0gY29udGV4dC5lbGFwc2VkIC8gZngubGVuZ3RoO1xuICAgICAgICBjb250ZXh0LnNob3VsZE5vdEludGVycG9sYXRlID0gdGhpcy5fX3Nob3VsZE5vdEludGVycG9sYXRlWyBpICsgaTAgXSA9PT0gMTtcbiAgICAgICAgdGVtcFZhbHVlc1sgaSBdID0gZnhEZWYuZnVuYyggY29udGV4dCApO1xuXG4gICAgICAgIGNvbnRleHQuaW5pdCA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9fdmFsdWVzLnNldCggdGVtcFZhbHVlcywgaTAgKTtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IENoYW5uZWwgfSBmcm9tICcuL0NoYW5uZWwnO1xuaW1wb3J0IHsgQ3VydmUgfSBmcm9tICcuL0N1cnZlJztcbmltcG9ydCB0eXBlIHsgQXV0b21hdG9uT3B0aW9ucyB9IGZyb20gJy4vdHlwZXMvQXV0b21hdG9uT3B0aW9ucyc7XG5pbXBvcnQgdHlwZSB7IENoYW5uZWxVcGRhdGVFdmVudCB9IGZyb20gJy4vdHlwZXMvQ2hhbm5lbFVwZGF0ZUV2ZW50JztcbmltcG9ydCB0eXBlIHsgRnhEZWZpbml0aW9uIH0gZnJvbSAnLi90eXBlcy9GeERlZmluaXRpb24nO1xuaW1wb3J0IHR5cGUgeyBTZXJpYWxpemVkQXV0b21hdG9uIH0gZnJvbSAnLi90eXBlcy9TZXJpYWxpemVkQXV0b21hdG9uJztcblxuLyoqXG4gKiBJVCdTIEFVVE9NQVRPTiFcbiAqIEBwYXJhbSBkYXRhIFNlcmlhbGl6ZWQgZGF0YSBvZiB0aGUgYXV0b21hdG9uXG4gKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25zIGZvciB0aGlzIEF1dG9tYXRvbiBpbnN0YW5jZVxuICovXG5leHBvcnQgY2xhc3MgQXV0b21hdG9uIHtcbiAgLyoqXG4gICAqIEl0IHJldHVybnMgdGhlIGN1cnJlbnQgdmFsdWUgb2YgdGhlIFtbQ2hhbm5lbF1dIGNhbGxlZCBgbmFtZWAuXG4gICAqIElmIHRoZSBgbmFtZWAgaXMgYW4gYXJyYXksIGl0IHJldHVybnMgYSBzZXQgb2YgbmFtZSA6IGNoYW5uZWwgYXMgYW4gb2JqZWN0IGluc3RlYWQuXG4gICAqIFlvdSBjYW4gYWxzbyBnaXZlIGEgbGlzdGVuZXIgd2hpY2ggd2lsbCBiZSBleGVjdXRlZCB3aGVuIHRoZSBjaGFubmVsIGNoYW5nZXMgaXRzIHZhbHVlIChvcHRpb25hbCkuXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBjaGFubmVsXG4gICAqIEBwYXJhbSBsaXN0ZW5lciBBIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBleGVjdXRlZCB3aGVuIHRoZSBjaGFubmVsIGNoYW5nZXMgaXRzIHZhbHVlXG4gICAqIEByZXR1cm5zIEN1cnJlbnQgdmFsdWUgb2YgdGhlIGNoYW5uZWxcbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBhdXRvOiBBdXRvbWF0b25bICdfX2F1dG8nIF0gPSB0aGlzLl9fYXV0by5iaW5kKCB0aGlzICk7XG5cbiAgLyoqXG4gICAqIEN1cnZlcyBvZiB0aGUgYXV0b21hdG9uLlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IGN1cnZlczogQ3VydmVbXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBDaGFubmVscyBvZiB0aGUgdGltZWxpbmUuXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgY2hhbm5lbHM6IENoYW5uZWxbXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBNYXAgb2YgY2hhbm5lbHMsIG5hbWUgdnMuIGNoYW5uZWwgaXRzZWxmLlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IG1hcE5hbWVUb0NoYW5uZWwgPSBuZXcgTWFwPHN0cmluZywgQ2hhbm5lbD4oKTtcblxuICAvKipcbiAgICogQ3VycmVudCB0aW1lIG9mIHRoZSBhdXRvbWF0b24uXG4gICAqIENhbiBiZSBzZXQgYnkgW1t1cGRhdGVdXSwgYmUgcmV0cmlldmVkIGJ5IFtbZ2V0IHRpbWVdXSwgYmUgdXNlZCBieSBbW2F1dG9dXVxuICAgKi9cbiAgcHJvdGVjdGVkIF9fdGltZTogbnVtYmVyID0gMC4wO1xuXG4gIC8qKlxuICAgKiBWZXJzaW9uIG9mIHRoZSBhdXRvbWF0b24uXG4gICAqL1xuICBwcm90ZWN0ZWQgX192ZXJzaW9uOiBzdHJpbmcgPSBwcm9jZXNzLmVudi5WRVJTSU9OITtcblxuICAvKipcbiAgICogUmVzb2x1dGlvbiBvZiB0aGUgdGltZWxpbmUuXG4gICAqL1xuICBwcm90ZWN0ZWQgX19yZXNvbHV0aW9uOiBudW1iZXIgPSAxMDAwO1xuXG4gIC8qKlxuICAgKiBBIG1hcCBvZiBmeCBkZWZpbml0aW9ucy5cbiAgICovXG4gIHByb3RlY3RlZCBfX2Z4RGVmaW5pdGlvbnM6IHsgWyBuYW1lOiBzdHJpbmcgXTogRnhEZWZpbml0aW9uIH0gPSB7fTtcblxuICBwdWJsaWMgY29uc3RydWN0b3IoXG4gICAgZGF0YTogU2VyaWFsaXplZEF1dG9tYXRvbixcbiAgICBvcHRpb25zOiBBdXRvbWF0b25PcHRpb25zID0ge31cbiAgKSB7XG4gICAgb3B0aW9ucy5meERlZmluaXRpb25zICYmIHRoaXMuYWRkRnhEZWZpbml0aW9ucyggb3B0aW9ucy5meERlZmluaXRpb25zICk7XG4gICAgdGhpcy5kZXNlcmlhbGl6ZSggZGF0YSApO1xuICB9XG5cbiAgLyoqXG4gICAqIEN1cnJlbnQgdGltZSBvZiB0aGUgYXV0b21hdG9uLCB0aGF0IGlzIHNldCB2aWEgW1t1cGRhdGVdXS5cbiAgICovXG4gIHB1YmxpYyBnZXQgdGltZSgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fX3RpbWU7IH1cblxuICAvKipcbiAgICogVmVyc2lvbiBvZiB0aGUgYXV0b21hdG9uLlxuICAgKi9cbiAgcHVibGljIGdldCB2ZXJzaW9uKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLl9fdmVyc2lvbjsgfVxuXG4gIC8qKlxuICAgKiBSZXNvbHV0aW9uID0gU2FtcGxpbmcgcG9pbnQgcGVyIHNlY29uZC5cbiAgICovXG4gIHB1YmxpYyBnZXQgcmVzb2x1dGlvbigpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fX3Jlc29sdXRpb247IH1cblxuICAvKipcbiAgICogTG9hZCBzZXJpYWxpemVkIGF1dG9tYXRvbiBkYXRhLlxuICAgKiBAcGFyYW0gZGF0YSBTZXJpYWxpemVkIG9iamVjdCBjb250YWlucyBhdXRvbWF0b24gZGF0YS5cbiAgICovXG4gIHB1YmxpYyBkZXNlcmlhbGl6ZSggZGF0YTogU2VyaWFsaXplZEF1dG9tYXRvbiApOiB2b2lkIHtcbiAgICB0aGlzLl9fcmVzb2x1dGlvbiA9IGRhdGEucmVzb2x1dGlvbjtcblxuICAgIHRoaXMuY3VydmVzLnNwbGljZSggMCApO1xuICAgIHRoaXMuY3VydmVzLnB1c2goXG4gICAgICAuLi5kYXRhLmN1cnZlcy5tYXAoICggZGF0YSApID0+IG5ldyBDdXJ2ZSggdGhpcywgZGF0YSApIClcbiAgICApO1xuXG4gICAgdGhpcy5tYXBOYW1lVG9DaGFubmVsLmNsZWFyKCk7XG5cbiAgICB0aGlzLmNoYW5uZWxzLnNwbGljZSggMCApO1xuICAgIHRoaXMuY2hhbm5lbHMucHVzaChcbiAgICAgIC4uLmRhdGEuY2hhbm5lbHMubWFwKCAoIFsgbmFtZSwgZGF0YSBdICkgPT4ge1xuICAgICAgICBjb25zdCBjaGFubmVsID0gbmV3IENoYW5uZWwoIHRoaXMsIGRhdGEgKTtcblxuICAgICAgICBpZiAoIHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAnZGV2ZWxvcG1lbnQnICkge1xuICAgICAgICAgIGlmICggdGhpcy5tYXBOYW1lVG9DaGFubmVsLmhhcyggbmFtZSApICkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCBgRHVwbGljYXRlZCBjaGFubmVsOiAkeyBuYW1lIH1gICk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5tYXBOYW1lVG9DaGFubmVsLnNldCggbmFtZSwgY2hhbm5lbCApO1xuICAgICAgICByZXR1cm4gY2hhbm5lbDtcbiAgICAgIH0gKVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGZ4IGRlZmluaXRpb25zLlxuICAgKiBAcGFyYW0gZnhEZWZpbml0aW9ucyBBIG1hcCBvZiBpZCAtIGZ4IGRlZmluaXRpb25cbiAgICovXG4gIHB1YmxpYyBhZGRGeERlZmluaXRpb25zKCBmeERlZmluaXRpb25zOiB7IFsgaWQ6IHN0cmluZyBdOiBGeERlZmluaXRpb24gfSApOiB2b2lkIHtcbiAgICBPYmplY3QuZW50cmllcyggZnhEZWZpbml0aW9ucyApLmZvckVhY2goICggWyBpZCwgZnhEZWYgXSApID0+IHtcbiAgICAgIGlmICggdHlwZW9mIGZ4RGVmLmZ1bmMgPT09ICdmdW5jdGlvbicgKSB7IC8vIGlnbm9yZSB1bnJlbGF0ZWQgZW50cmllc1xuICAgICAgICBpZiAoIHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAnZGV2ZWxvcG1lbnQnICkge1xuICAgICAgICAgIGlmICggdGhpcy5fX2Z4RGVmaW5pdGlvbnNbIGlkIF0gIT0gbnVsbCApIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybiggYE92ZXJ3cml0aW5nIHRoZSBleGlzdGluZyBmeCBkZWZpbml0aW9uOiAkeyBpZCB9YCApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX19meERlZmluaXRpb25zWyBpZCBdID0gZnhEZWY7XG4gICAgICB9XG4gICAgfSApO1xuXG4gICAgdGhpcy5wcmVjYWxjQWxsKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgZnggZGVmaW5pdGlvbi5cbiAgICogSWYgaXQgY2FuJ3QgZmluZCB0aGUgZGVmaW5pdGlvbiwgaXQgcmV0dXJucyBgbnVsbGAgaW5zdGVhZC5cbiAgICogQHBhcmFtIGlkIFVuaXF1ZSBpZCBmb3IgdGhlIEZ4IGRlZmluaXRpb25cbiAgICovXG4gIHB1YmxpYyBnZXRGeERlZmluaXRpb24oIGlkOiBzdHJpbmcgKTogRnhEZWZpbml0aW9uIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuX19meERlZmluaXRpb25zWyBpZCBdIHx8IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgY3VydmUuXG4gICAqIEBwYXJhbSBpbmRleCBBbiBpbmRleCBvZiB0aGUgY3VydmVcbiAgICovXG4gIHB1YmxpYyBnZXRDdXJ2ZSggaW5kZXg6IG51bWJlciApOiBDdXJ2ZSB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLmN1cnZlc1sgaW5kZXggXSB8fCBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFByZWNhbGN1bGF0ZSBhbGwgY3VydmVzLlxuICAgKi9cbiAgcHVibGljIHByZWNhbGNBbGwoKTogdm9pZCB7XG4gICAgT2JqZWN0LnZhbHVlcyggdGhpcy5jdXJ2ZXMgKS5mb3JFYWNoKCAoIGN1cnZlICkgPT4gY3VydmUucHJlY2FsYygpICk7XG4gIH1cblxuICAvKipcbiAgICogUmVzZXQgdGhlIGludGVybmFsIHN0YXRlcyBvZiBjaGFubmVscy5cbiAgICogKipDYWxsIHRoaXMgbWV0aG9kIHdoZW4geW91IHNlZWsgdGhlIHRpbWUuKipcbiAgICovXG4gIHB1YmxpYyByZXNldCgpOiB2b2lkIHtcbiAgICBPYmplY3QudmFsdWVzKCB0aGlzLmNoYW5uZWxzICkuZm9yRWFjaCggKCBjaGFubmVsICkgPT4gY2hhbm5lbC5yZXNldCgpICk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBlbnRpcmUgYXV0b21hdG9uLlxuICAgKiAqKllvdSBtYXkgd2FudCB0byBjYWxsIHRoaXMgaW4geW91ciB1cGRhdGUgbG9vcC4qKlxuICAgKiBAcGFyYW0gdGltZSBDdXJyZW50IHRpbWVcbiAgICovXG4gIHB1YmxpYyB1cGRhdGUoIHRpbWU6IG51bWJlciApOiB2b2lkIHtcbiAgICBjb25zdCB0ID0gTWF0aC5tYXgoIHRpbWUsIDAuMCApO1xuXG4gICAgLy8gY2FjaGUgdGhlIHRpbWVcbiAgICB0aGlzLl9fdGltZSA9IHQ7XG5cbiAgICAvLyB1cGRhdGUgY2hhbm5lbHNcbiAgICBjb25zdCBhcnJheSA9IHRoaXMuY2hhbm5lbHMubWFwKCAoIGNoYW5uZWwgKSA9PiBjaGFubmVsLmNvbnN1bWUoIHRoaXMuX190aW1lICkgKS5mbGF0KCAxICk7XG4gICAgYXJyYXkuc29ydCggKCBbIGEgXSwgWyBiIF0gKSA9PiBhIC0gYiApLmZvckVhY2goICggWyBfLCBmdW5jIF0gKSA9PiBmdW5jKCkgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NpZ25lZCB0byB7QGxpbmsgQXV0b21hdG9uI2F1dG99IG9uIGl0cyBpbml0aWFsaXplIHBoYXNlLlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbmFtZSBvZiB0aGUgY2hhbm5lbFxuICAgKiBAcGFyYW0gbGlzdGVuZXIgQSBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgZXhlY3V0ZWQgd2hlbiB0aGUgY2hhbm5lbCBjaGFuZ2VzIGl0cyB2YWx1ZVxuICAgKiBAcmV0dXJucyBDdXJyZW50IHZhbHVlIG9mIHRoZSBjaGFubmVsXG4gICAqL1xuICBwcm90ZWN0ZWQgX19hdXRvKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBsaXN0ZW5lcj86ICggZXZlbnQ6IENoYW5uZWxVcGRhdGVFdmVudCApID0+IHZvaWRcbiAgKTogbnVtYmVyIHtcbiAgICBjb25zdCBjaGFubmVsID0gdGhpcy5tYXBOYW1lVG9DaGFubmVsLmdldCggbmFtZSApO1xuXG4gICAgaWYgKCBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50JyApIHtcbiAgICAgIGlmICggIWNoYW5uZWwgKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvciggYE5vIHN1Y2ggY2hhbm5lbDogJHsgbmFtZSB9YCApO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICggbGlzdGVuZXIgKSB7XG4gICAgICBjaGFubmVsIS5zdWJzY3JpYmUoIGxpc3RlbmVyICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNoYW5uZWwhLmN1cnJlbnRWYWx1ZTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBU0EsTUFBTSxXQUFXLEdBQUcsQ0FBQyxDQUFDO0FBQ3RCLE1BQU0sY0FBYyxHQUFHLEtBQUssQ0FBQztBQUM3QixNQUFNLFdBQVcsR0FBRyxFQUFFLENBQUM7QUFDdkIsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDO0FBQ2hDLE1BQU0sVUFBVSxHQUFHLEVBQUUsQ0FBQztBQUV0QixNQUFN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
