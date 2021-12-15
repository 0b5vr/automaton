/*!
 * @0b5vr/automaton v4.2.1
 * Animation engine for creative coding
 *
 * Copyright (c) 2017-2021 0b5vr
 * @0b5vr/automaton is distributed under MIT License
 * https://github.com/0b5vr/automaton/blob/master/LICENSE
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

// https://github.com/0b5vr/experimental-npm/blob/cf685846488ed3765e0abf68c8f6cd4916049cfa/src/algorithm/binarySearch.ts
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
        this.__version = '4.2.1';
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b21hdG9uLm1vZHVsZS5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL3V0aWxzL2JlemllckVhc2luZy50cyIsIi4uL3NyYy91dGlscy9iaW5hcnlTZWFyY2gudHMiLCIuLi9zcmMvQ2hhbm5lbEl0ZW0udHMiLCIuLi9zcmMvQ2hhbm5lbC50cyIsIi4uL3NyYy9DdXJ2ZS50cyIsIi4uL3NyYy9BdXRvbWF0b24udHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBCZXppZXJOb2RlIH0gZnJvbSAnLi4vdHlwZXMvQmV6aWVyTm9kZSc7XG5cbmludGVyZmFjZSBDdWJpY0JlemllckNvbnRyb2xQb2ludHMge1xuICBwMDogbnVtYmVyO1xuICBwMTogbnVtYmVyO1xuICBwMjogbnVtYmVyO1xuICBwMzogbnVtYmVyO1xufVxuXG5jb25zdCBORVdUT05fSVRFUiA9IDQ7XG5jb25zdCBORVdUT05fRVBTSUxPTiA9IDAuMDAxO1xuY29uc3QgU1VCRElWX0lURVIgPSAxMDtcbmNvbnN0IFNVQkRJVl9FUFNJTE9OID0gMC4wMDAwMDE7XG5jb25zdCBUQUJMRV9TSVpFID0gMjE7XG5cbmNvbnN0IF9fY2FjaGU6IG51bWJlcltdID0gW107XG5cbmZ1bmN0aW9uIGNsYW1wKCB4OiBudW1iZXIsIG1pbjogbnVtYmVyLCBtYXg6IG51bWJlciApOiBudW1iZXIge1xuICByZXR1cm4gTWF0aC5taW4oIE1hdGgubWF4KCB4LCBtaW4gKSwgbWF4ICk7XG59XG5cbi8qXG4gKiAoMS10KSgxLXQpKDEtdCkgYTAgPSAoMS0ydCt0dCkoMS10KSBhMFxuICogICAgICAgICAgICAgICAgICAgID0gKDEtdC0ydCsydHQrdHQtdHR0KSBhMFxuICogICAgICAgICAgICAgICAgICAgID0gKDEtM3QrM3R0LXR0dCkgYTBcbiAqXG4gKiAzKDEtdCkoMS10KXQgYTEgPSAzKDEtMnQrdHQpdCBhMVxuICogICAgICAgICAgICAgICAgID0gKDN0LTZ0dCszdHR0KSBhMVxuICpcbiAqIDMoMS10KXR0IGEyID0gKDN0dC0zdHR0KSBhMlxuICpcbiAqIHR0dCBhM1xuICpcbiAqIChhMy0zYTIrM2ExLWEwKSB0dHQgKyAoM2EyLTZhMSszYTApIHR0ICsgKDNhMS0zYTApIHQgKyBhMFxuICovXG5cbmZ1bmN0aW9uIEEoIGNwczogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzICk6IG51bWJlciB7XG4gIHJldHVybiBjcHMucDMgLSAzLjAgKiBjcHMucDIgKyAzLjAgKiBjcHMucDEgLSBjcHMucDA7XG59XG5cbmZ1bmN0aW9uIEIoIGNwczogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzICk6IG51bWJlciB7XG4gIHJldHVybiAzLjAgKiBjcHMucDIgLSA2LjAgKiBjcHMucDEgKyAzLjAgKiBjcHMucDA7XG59XG5cbmZ1bmN0aW9uIEMoIGNwczogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzICk6IG51bWJlciB7XG4gIHJldHVybiAzLjAgKiBjcHMucDEgLSAzLjAgKiBjcHMucDA7XG59XG5cbmZ1bmN0aW9uIGN1YmljQmV6aWVyKCB0OiBudW1iZXIsIGNwczogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzICk6IG51bWJlciB7XG4gIHJldHVybiAoICggQSggY3BzICkgKiB0ICsgQiggY3BzICkgKSAqIHQgKyBDKCBjcHMgKSApICogdCArIGNwcy5wMDtcbn1cblxuZnVuY3Rpb24gZGVsdGFDdWJpY0JlemllciggdDogbnVtYmVyLCBjcHM6IEN1YmljQmV6aWVyQ29udHJvbFBvaW50cyApOiBudW1iZXIge1xuICByZXR1cm4gKCAzLjAgKiBBKCBjcHMgKSAqIHQgKyAyLjAgKiBCKCBjcHMgKSApICogdCArIEMoIGNwcyApO1xufVxuXG5mdW5jdGlvbiBzdWJkaXYoIHg6IG51bWJlciwgYTogbnVtYmVyLCBiOiBudW1iZXIsIGNwczogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzICk6IG51bWJlciB7XG4gIGxldCBjYW5kaWRhdGVYID0gMDtcbiAgbGV0IHQgPSAwO1xuXG4gIGZvciAoIGxldCBpID0gMDsgaSA8IFNVQkRJVl9JVEVSOyBpICsrICkge1xuICAgIHQgPSBhICsgKCBiIC0gYSApIC8gMi4wO1xuICAgIGNhbmRpZGF0ZVggPSBjdWJpY0JlemllciggdCwgY3BzICkgLSB4O1xuICAgICggMC4wIDwgY2FuZGlkYXRlWCApID8gKCBiID0gdCApIDogKCBhID0gdCApO1xuICAgIGlmICggU1VCRElWX0VQU0lMT04gPCBNYXRoLmFicyggY2FuZGlkYXRlWCApICkgeyBicmVhazsgfVxuICB9XG5cbiAgcmV0dXJuIHQ7XG59XG5cbmZ1bmN0aW9uIG5ld3RvbiggeDogbnVtYmVyLCB0OiBudW1iZXIsIGNwczogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzICk6IG51bWJlciB7XG4gIGZvciAoIGxldCBpID0gMDsgaSA8IE5FV1RPTl9JVEVSOyBpICsrICkge1xuICAgIGNvbnN0IGQgPSBkZWx0YUN1YmljQmV6aWVyKCB0LCBjcHMgKTtcbiAgICBpZiAoIGQgPT09IDAuMCApIHsgcmV0dXJuIHQ7IH1cbiAgICBjb25zdCBjeCA9IGN1YmljQmV6aWVyKCB0LCBjcHMgKSAtIHg7XG4gICAgdCAtPSBjeCAvIGQ7XG4gIH1cblxuICByZXR1cm4gdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJhd0JlemllckVhc2luZyhcbiAgY3BzeDogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzLFxuICBjcHN5OiBDdWJpY0JlemllckNvbnRyb2xQb2ludHMsXG4gIHg6IG51bWJlclxuKTogbnVtYmVyIHtcbiAgaWYgKCB4IDw9IGNwc3gucDAgKSB7IHJldHVybiBjcHN5LnAwOyB9IC8vIGNsYW1wZWRcbiAgaWYgKCBjcHN4LnAzIDw9IHggKSB7IHJldHVybiBjcHN5LnAzOyB9IC8vIGNsYW1wZWRcblxuICBjcHN4LnAxID0gY2xhbXAoIGNwc3gucDEsIGNwc3gucDAsIGNwc3gucDMgKTtcbiAgY3BzeC5wMiA9IGNsYW1wKCBjcHN4LnAyLCBjcHN4LnAwLCBjcHN4LnAzICk7XG5cbiAgZm9yICggbGV0IGkgPSAwOyBpIDwgVEFCTEVfU0laRTsgaSArKyApIHtcbiAgICBfX2NhY2hlWyBpIF0gPSBjdWJpY0JlemllciggaSAvICggVEFCTEVfU0laRSAtIDEuMCApLCBjcHN4ICk7XG4gIH1cblxuICBsZXQgc2FtcGxlID0gMDtcbiAgZm9yICggbGV0IGkgPSAxOyBpIDwgVEFCTEVfU0laRTsgaSArKyApIHtcbiAgICBzYW1wbGUgPSBpIC0gMTtcbiAgICBpZiAoIHggPCBfX2NhY2hlWyBpIF0gKSB7IGJyZWFrOyB9XG4gIH1cblxuICBjb25zdCBkaXN0ID0gKCB4IC0gX19jYWNoZVsgc2FtcGxlIF0gKSAvICggX19jYWNoZVsgc2FtcGxlICsgMSBdIC0gX19jYWNoZVsgc2FtcGxlIF0gKTtcbiAgbGV0IHQgPSAoIHNhbXBsZSArIGRpc3QgKSAvICggVEFCTEVfU0laRSAtIDEgKTtcbiAgY29uc3QgZCA9IGRlbHRhQ3ViaWNCZXppZXIoIHQsIGNwc3ggKSAvICggY3BzeC5wMyAtIGNwc3gucDAgKTtcblxuICBpZiAoIE5FV1RPTl9FUFNJTE9OIDw9IGQgKSB7XG4gICAgdCA9IG5ld3RvbiggeCwgdCwgY3BzeCApO1xuICB9IGVsc2UgaWYgKCBkICE9PSAwLjAgKSB7XG4gICAgdCA9IHN1YmRpdiggeCwgKCBzYW1wbGUgKSAvICggVEFCTEVfU0laRSAtIDEgKSwgKCBzYW1wbGUgKyAxLjAgKSAvICggVEFCTEVfU0laRSAtIDEgKSwgY3BzeCApO1xuICB9XG5cbiAgcmV0dXJuIGN1YmljQmV6aWVyKCB0LCBjcHN5ICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBiZXppZXJFYXNpbmcoIG5vZGUwOiBCZXppZXJOb2RlLCBub2RlMTogQmV6aWVyTm9kZSwgdGltZTogbnVtYmVyICk6IG51bWJlciB7XG4gIHJldHVybiByYXdCZXppZXJFYXNpbmcoXG4gICAge1xuICAgICAgcDA6IG5vZGUwLnRpbWUsXG4gICAgICBwMTogbm9kZTAudGltZSArIG5vZGUwLm91dFRpbWUsXG4gICAgICBwMjogbm9kZTEudGltZSArIG5vZGUxLmluVGltZSxcbiAgICAgIHAzOiBub2RlMS50aW1lXG4gICAgfSxcbiAgICB7XG4gICAgICBwMDogbm9kZTAudmFsdWUsXG4gICAgICBwMTogbm9kZTAudmFsdWUgKyBub2RlMC5vdXRWYWx1ZSxcbiAgICAgIHAyOiBub2RlMS52YWx1ZSArIG5vZGUxLmluVmFsdWUsXG4gICAgICBwMzogbm9kZTEudmFsdWVcbiAgICB9LFxuICAgIHRpbWVcbiAgKTtcbn1cbiIsIi8vIGh0dHBzOi8vZ2l0aHViLmNvbS8wYjV2ci9leHBlcmltZW50YWwtbnBtL2Jsb2IvY2Y2ODU4NDY0ODhlZDM3NjVlMGFiZjY4YzhmNmNkNDkxNjA0OWNmYS9zcmMvYWxnb3JpdGhtL2JpbmFyeVNlYXJjaC50c1xuXG4vKipcbiAqIExvb2sgZm9yIGFuIGluZGV4IGZyb20gYSBzb3J0ZWQgbGlzdCB1c2luZyBiaW5hcnkgc2VhcmNoLlxuICpcbiAqIElmIHlvdSBkb24ndCBwcm92aWRlIGEgY29tcGFyZSBmdW5jdGlvbiwgaXQgd2lsbCBsb29rIGZvciAqKnRoZSBmaXJzdCBzYW1lIHZhbHVlKiogaXQgY2FuIGZpbmQuXG4gKiBJZiBpdCBjYW5ub3QgZmluZCBhbiBleGFjdGx5IG1hdGNoaW5nIHZhbHVlLCBpdCBjYW4gcmV0dXJuIE4gd2hlcmUgdGhlIGxlbmd0aCBvZiBnaXZlbiBhcnJheSBpcyBOLlxuICpcbiAqIEBwYXJhbSBhcnJheSBBIHNvcnRlZCBhcnJheVxuICogQHBhcmFtIGNvbXBhcmUgTWFrZSB0aGlzIGZ1bmN0aW9uIHJldHVybiBgZmFsc2VgIGlmIHlvdSB3YW50IHRvIHBvaW50IHJpZ2h0IHNpZGUgb2YgZ2l2ZW4gZWxlbWVudCwgYHRydWVgIGlmIHlvdSB3YW50IHRvIHBvaW50IGxlZnQgc2lkZSBvZiBnaXZlbiBlbGVtZW50LlxuICogQHJldHVybnMgQW4gaW5kZXggZm91bmRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmFyeVNlYXJjaDxUPiggYXJyYXk6IEFycmF5TGlrZTxUPiwgZWxlbWVudDogVCApOiBudW1iZXI7XG5leHBvcnQgZnVuY3Rpb24gYmluYXJ5U2VhcmNoPFQ+KCBhcnJheTogQXJyYXlMaWtlPFQ+LCBjb21wYXJlOiAoIGVsZW1lbnQ6IFQgKSA9PiBib29sZWFuICk6IG51bWJlcjtcbmV4cG9ydCBmdW5jdGlvbiBiaW5hcnlTZWFyY2g8VD4oXG4gIGFycmF5OiBBcnJheUxpa2U8VD4sXG4gIGVsZW1lbnRPckNvbXBhcmU6IFQgfCAoICggZWxlbWVudDogVCApID0+IGJvb2xlYW4gKSxcbik6IG51bWJlciB7XG4gIGlmICggdHlwZW9mIGVsZW1lbnRPckNvbXBhcmUgIT09ICdmdW5jdGlvbicgKSB7XG4gICAgcmV0dXJuIGJpbmFyeVNlYXJjaCggYXJyYXksICggZWxlbWVudCApID0+ICggZWxlbWVudCA8IGVsZW1lbnRPckNvbXBhcmUgKSApO1xuICB9XG4gIGNvbnN0IGNvbXBhcmUgPSBlbGVtZW50T3JDb21wYXJlIGFzICggZWxlbWVudDogVCApID0+IGJvb2xlYW47XG5cbiAgbGV0IHN0YXJ0ID0gMDtcbiAgbGV0IGVuZCA9IGFycmF5Lmxlbmd0aDtcblxuICB3aGlsZSAoIHN0YXJ0IDwgZW5kICkge1xuICAgIGNvbnN0IGNlbnRlciA9ICggc3RhcnQgKyBlbmQgKSA+PiAxO1xuICAgIGNvbnN0IGNlbnRlckVsZW1lbnQgPSBhcnJheVsgY2VudGVyIF07XG5cbiAgICBjb25zdCBjb21wYXJlUmVzdWx0ID0gY29tcGFyZSggY2VudGVyRWxlbWVudCApO1xuXG4gICAgaWYgKCBjb21wYXJlUmVzdWx0ICkge1xuICAgICAgc3RhcnQgPSBjZW50ZXIgKyAxO1xuICAgIH0gZWxzZSB7XG4gICAgICBlbmQgPSBjZW50ZXI7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHN0YXJ0O1xufVxuIiwiaW1wb3J0IHsgQXV0b21hdG9uLCBDdXJ2ZSB9IGZyb20gJy4nO1xuaW1wb3J0IHR5cGUgeyBTZXJpYWxpemVkQ2hhbm5lbEl0ZW0gfSBmcm9tICcuL3R5cGVzL1NlcmlhbGl6ZWRDaGFubmVsSXRlbSc7XG5cbi8qKlxuICogUmVwcmVzZW50cyBhbiBpdGVtIG9mIGEgW1tDaGFubmVsXV0uXG4gKi9cbmV4cG9ydCBjbGFzcyBDaGFubmVsSXRlbSB7XG4gIC8qKlxuICAgKiBUaGUgcGFyZW50IGF1dG9tYXRvbi5cbiAgICovXG4gIHByb3RlY3RlZCByZWFkb25seSBfX2F1dG9tYXRvbjogQXV0b21hdG9uO1xuXG4gIC8qKlxuICAgKiBCZWdpbm5pbmcgdGltZXBvaW50IG9mIHRoZSBpdGVtLlxuICAgKi9cbiAgcHVibGljIHRpbWUhOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIExlbmd0aCBvZiB0aGUgaXRlbS5cbiAgICovXG4gIHB1YmxpYyBsZW5ndGghOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFZhbHVlIG9mIHRoZSBpdGVtLlxuICAgKi9cbiAgcHVibGljIHZhbHVlITogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHJlc2V0IGNoYW5uZWxzIHZhbHVlIHRvIHplcm8gYXQgdGhlIGVuZCBvZiB0aGlzIGl0ZW0gb3Igbm90LlxuICAgKi9cbiAgcHVibGljIHJlc2V0PzogYm9vbGVhbjtcblxuICAvKipcbiAgICogVGhpcyB3aWxsIG9ubHkgbWFrZSBzZW5zZSB3aGVuIHtAbGluayBjdXJ2ZX0gaXMgc3BlY2lmaWVkLlxuICAgKiBUaGUgdGltZSBvZmZzZXQgb2YgdGhlIGl0ZW0uXG4gICAqL1xuICBwdWJsaWMgb2Zmc2V0ITogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGlzIHdpbGwgb25seSBtYWtlIHNlbnNlIHdoZW4ge0BsaW5rIGN1cnZlfSBpcyBzcGVjaWZpZWQuXG4gICAqIFRoZSBzcGVlZCByYXRlIG9mIHRoZSBpdGVtLlxuICAgKi9cbiAgcHVibGljIHNwZWVkITogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGlzIHdpbGwgb25seSBtYWtlIHNlbnNlIHdoZW4ge0BsaW5rIGN1cnZlfSBpcyBzcGVjaWZpZWQuXG4gICAqIFRoZSBzY2FsZSBvZiB0aGUgaXRlbSBpbiB0aGUgdmFsdWUgYXhpcy5cbiAgICovXG4gIHB1YmxpYyBhbXAhOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBjdXJ2ZSBvZiB0aGUgaXRlbS5cbiAgICovXG4gIHB1YmxpYyBjdXJ2ZT86IEN1cnZlO1xuXG4gIC8qKlxuICAgKiBFbmRpbmcgdGltZXBvaW50IG9mIHRoZSBpdGVtLlxuICAgKi9cbiAgcHVibGljIGdldCBlbmQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy50aW1lICsgdGhpcy5sZW5ndGg7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3Igb2YgdGhlIFtbQ2hhbm5lbEl0ZW1dXS5cbiAgICogQHBhcmFtIGF1dG9tYXRvbiBQYXJlbnQgYXV0b21hdG9uXG4gICAqIEBwYXJhbSBkYXRhIERhdGEgb2YgdGhlIGl0ZW1cbiAgICovXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggYXV0b21hdG9uOiBBdXRvbWF0b24sIGRhdGE6IFNlcmlhbGl6ZWRDaGFubmVsSXRlbSApIHtcbiAgICB0aGlzLl9fYXV0b21hdG9uID0gYXV0b21hdG9uO1xuXG4gICAgdGhpcy5kZXNlcmlhbGl6ZSggZGF0YSApO1xuICB9XG5cbiAgcHVibGljIGdldFZhbHVlKCB0aW1lOiBudW1iZXIgKTogbnVtYmVyIHtcbiAgICBpZiAoIHRoaXMucmVzZXQgJiYgdGhpcy5sZW5ndGggPD0gdGltZSApIHtcbiAgICAgIHJldHVybiAwLjA7XG4gICAgfVxuXG4gICAgaWYgKCB0aGlzLmN1cnZlICkge1xuICAgICAgY29uc3QgdCA9IHRoaXMub2Zmc2V0ISArIHRpbWUgKiB0aGlzLnNwZWVkITtcbiAgICAgIHJldHVybiB0aGlzLnZhbHVlICsgdGhpcy5hbXAgKiB0aGlzLmN1cnZlLmdldFZhbHVlKCB0ICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLnZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEZXNlcmlhbGl6ZSBhIHNlcmlhbGl6ZWQgZGF0YSBvZiBpdGVtIGZyb20gW1tTZXJpYWxpemVkQ2hhbm5lbEl0ZW1dXS5cbiAgICogQHBhcmFtIGRhdGEgQSBzZXJpYWxpemVkIGl0ZW0uXG4gICAqL1xuICBwdWJsaWMgZGVzZXJpYWxpemUoIGRhdGE6IFNlcmlhbGl6ZWRDaGFubmVsSXRlbSApOiB2b2lkIHtcbiAgICB0aGlzLnRpbWUgPSBkYXRhLnRpbWUgPz8gMC4wO1xuICAgIHRoaXMubGVuZ3RoID0gZGF0YS5sZW5ndGggPz8gMC4wO1xuICAgIHRoaXMudmFsdWUgPSBkYXRhLnZhbHVlID8/IDAuMDtcbiAgICB0aGlzLm9mZnNldCA9IGRhdGEub2Zmc2V0ID8/IDAuMDtcbiAgICB0aGlzLnNwZWVkID0gZGF0YS5zcGVlZCA/PyAxLjA7XG4gICAgdGhpcy5hbXAgPSBkYXRhLmFtcCA/PyAxLjA7XG4gICAgdGhpcy5yZXNldCA9IGRhdGEucmVzZXQ7XG4gICAgaWYgKCBkYXRhLmN1cnZlICE9IG51bGwgKSB7XG4gICAgICB0aGlzLmN1cnZlID0gdGhpcy5fX2F1dG9tYXRvbi5nZXRDdXJ2ZSggZGF0YS5jdXJ2ZSApITtcbiAgICAgIHRoaXMubGVuZ3RoID0gZGF0YS5sZW5ndGggPz8gdGhpcy5jdXJ2ZS5sZW5ndGggPz8gMC4wO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgQXV0b21hdG9uIH0gZnJvbSAnLi9BdXRvbWF0b24nO1xuaW1wb3J0IHsgQ2hhbm5lbEl0ZW0gfSBmcm9tICcuL0NoYW5uZWxJdGVtJztcbmltcG9ydCB7IGJpbmFyeVNlYXJjaCB9IGZyb20gJy4vdXRpbHMvYmluYXJ5U2VhcmNoJztcbmltcG9ydCB0eXBlIHsgQ2hhbm5lbFVwZGF0ZUV2ZW50IH0gZnJvbSAnLi90eXBlcy9DaGFubmVsVXBkYXRlRXZlbnQnO1xuaW1wb3J0IHR5cGUgeyBTZXJpYWxpemVkQ2hhbm5lbCB9IGZyb20gJy4vdHlwZXMvU2VyaWFsaXplZENoYW5uZWwnO1xuXG4vKipcbiAqIEl0IHJlcHJlc2VudHMgYSBjaGFubmVsIG9mIEF1dG9tYXRvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIENoYW5uZWwge1xuICAvKipcbiAgICogVGhlIHBhcmVudCBhdXRvbWF0b24uXG4gICAqL1xuICBwcm90ZWN0ZWQgX19hdXRvbWF0b246IEF1dG9tYXRvbjtcblxuICAvKipcbiAgICogTGlzdCBvZiBjaGFubmVsIGl0ZW1zLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9faXRlbXM6IENoYW5uZWxJdGVtW10gPSBbXTtcblxuICAvKipcbiAgICogQSBjYWNoZSBvZiBsYXN0IGNhbGN1bGF0ZWQgdmFsdWUuXG4gICAqL1xuICBwcm90ZWN0ZWQgX192YWx1ZTogbnVtYmVyID0gMC4wO1xuXG4gIC8qKlxuICAgKiBUaGUgdGltZSB0aGF0IHdhcyB1c2VkIGZvciB0aGUgY2FsY3VsYXRpb24gb2YgW1tfX2xhc3RWYWx1ZV1dLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fdGltZTogbnVtYmVyID0gLUluZmluaXR5O1xuXG4gIC8qKlxuICAgKiBUaGUgaW5kZXggb2YgW1tfX2l0ZW1zXV0gaXQgc2hvdWxkIGV2YWx1YXRlIG5leHQuXG4gICAqL1xuICBwcm90ZWN0ZWQgX19oZWFkOiBudW1iZXIgPSAwO1xuXG4gIC8qKlxuICAgKiBBbiBhcnJheSBvZiBsaXN0ZW5lcnMuXG4gICAqL1xuICBwcm90ZWN0ZWQgX19saXN0ZW5lcnM6IEFycmF5PCggZXZlbnQ6IENoYW5uZWxVcGRhdGVFdmVudCApID0+IHZvaWQ+ID0gW107XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yIG9mIHRoZSBbW0NoYW5uZWxdXS5cbiAgICogQHBhcmFtIGF1dG9tYXRvbiBQYXJlbnQgYXV0b21hdG9uXG4gICAqIEBwYXJhbSBkYXRhIERhdGEgb2YgdGhlIGNoYW5uZWxcbiAgICovXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggYXV0b21hdG9uOiBBdXRvbWF0b24sIGRhdGE6IFNlcmlhbGl6ZWRDaGFubmVsICkge1xuICAgIHRoaXMuX19hdXRvbWF0b24gPSBhdXRvbWF0b247XG5cbiAgICB0aGlzLmRlc2VyaWFsaXplKCBkYXRhICk7XG4gIH1cblxuICAvKipcbiAgICogQSBjYWNoZSBvZiBsYXN0IGNhbGN1bGF0ZWQgdmFsdWUuXG4gICAqL1xuICBwdWJsaWMgZ2V0IGN1cnJlbnRWYWx1ZSgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fX3ZhbHVlOyB9XG5cbiAgLyoqXG4gICAqIFRoZSB0aW1lIHRoYXQgd2FzIHVzZWQgZm9yIHRoZSBjYWxjdWxhdGlvbiBvZiBbW19fbGFzdFZhbHVlXV0uXG4gICAqL1xuICBwdWJsaWMgZ2V0IGN1cnJlbnRUaW1lKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9fdGltZTsgfVxuXG4gIC8qKlxuICAgKiBMb2FkIGEgc2VyaWFsaXplZCBkYXRhIG9mIGEgY2hhbm5lbC5cbiAgICogQHBhcmFtIGRhdGEgRGF0YSBvZiBhIGNoYW5uZWxcbiAgICovXG4gIHB1YmxpYyBkZXNlcmlhbGl6ZSggZGF0YTogU2VyaWFsaXplZENoYW5uZWwgKTogdm9pZCB7XG4gICAgdGhpcy5fX2l0ZW1zID0gZGF0YS5pdGVtcz8ubWFwKCAoIGl0ZW0gKSA9PiBuZXcgQ2hhbm5lbEl0ZW0oIHRoaXMuX19hdXRvbWF0b24sIGl0ZW0gKSApID8/IFtdO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0IHRoZSBpbnRlcm5hbCBzdGF0ZXMuXG4gICAqIENhbGwgdGhpcyBtZXRob2Qgd2hlbiB5b3Ugc2VlayB0aGUgdGltZS5cbiAgICovXG4gIHB1YmxpYyByZXNldCgpOiB2b2lkIHtcbiAgICB0aGlzLl9fdGltZSA9IC1JbmZpbml0eTtcbiAgICB0aGlzLl9fdmFsdWUgPSAwO1xuICAgIHRoaXMuX19oZWFkID0gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYSBuZXcgbGlzdGVuZXIgdGhhdCByZWNlaXZlcyBhIFtbQ2hhbm5lbFVwZGF0ZUV2ZW50XV0gd2hlbiBhbiB1cGRhdGUgaXMgaGFwcGVuZWQuXG4gICAqIEBwYXJhbSBsaXN0ZW5lciBBIHN1YnNjcmliaW5nIGxpc3RlbmVyXG4gICAqL1xuICBwdWJsaWMgc3Vic2NyaWJlKCBsaXN0ZW5lcjogKCBldmVudDogQ2hhbm5lbFVwZGF0ZUV2ZW50ICkgPT4gdm9pZCApOiB2b2lkIHtcbiAgICB0aGlzLl9fbGlzdGVuZXJzLnB1c2goIGxpc3RlbmVyICk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIHRoZSB2YWx1ZSBvZiBzcGVjaWZpZWQgdGltZSBwb2ludC5cbiAgICogQHBhcmFtIHRpbWUgVGltZSBhdCB0aGUgcG9pbnQgeW91IHdhbnQgdG8gZ3JhYiB0aGUgdmFsdWUuXG4gICAqIEByZXR1cm5zIFJlc3VsdCB2YWx1ZVxuICAgKi9cbiAgcHVibGljIGdldFZhbHVlKCB0aW1lOiBudW1iZXIgKTogbnVtYmVyIHtcbiAgICAvLyBubyBpdGVtcz8/PyBkYW1uXG4gICAgaWYgKCB0aGlzLl9faXRlbXMubGVuZ3RoID09PSAwICkge1xuICAgICAgcmV0dXJuIDAuMDtcbiAgICB9XG5cbiAgICBjb25zdCBuZXh0ID0gYmluYXJ5U2VhcmNoKCB0aGlzLl9faXRlbXMsICggaXRlbSApID0+ICggaXRlbS50aW1lIDwgdGltZSApICk7XG5cbiAgICAvLyBpdCdzIHRoZSBmaXJzdCBvbmUhXG4gICAgaWYgKCBuZXh0ID09PSAwICkge1xuICAgICAgcmV0dXJuIDAuMDtcbiAgICB9XG5cbiAgICBjb25zdCBpdGVtID0gdGhpcy5fX2l0ZW1zWyBuZXh0IC0gMSBdO1xuICAgIGlmICggaXRlbS5lbmQgPCB0aW1lICkge1xuICAgICAgcmV0dXJuIGl0ZW0uZ2V0VmFsdWUoIGl0ZW0ubGVuZ3RoICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBpdGVtLmdldFZhbHVlKCB0aW1lIC0gaXRlbS50aW1lICk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgbWV0aG9kIGlzIGludGVuZGVkIHRvIGJlIHVzZWQgYnkgW1tBdXRvbWF0b24udXBkYXRlXV0uXG4gICAqIENvbnN1bWUgYW5kIHJldHVybiBpdGVtcy5cbiAgICogQHBhcmFtIHRpbWUgVGhlIGN1cnJlbnQgdGltZSBvZiB0aGUgcGFyZW50IFtbQXV0b21hdG9uXV1cbiAgICogQHJldHVybnMgQXJyYXkgb2YgdHVwbGVzLCBbIHRpbWluZyBvZiB0aGUgZXZlbnQsIGEgZnVuY3Rpb24gdGhhdCBleGVjdXRlIHRoZSBldmVudCBdXG4gICAqL1xuICBwdWJsaWMgY29uc3VtZSggdGltZTogbnVtYmVyICk6IFsgdGltZTogbnVtYmVyLCB1cGRhdGU6ICgpID0+IHZvaWQgXVtdIHtcbiAgICBjb25zdCByZXQ6IFsgbnVtYmVyLCAoKSA9PiB2b2lkIF1bXSA9IFtdO1xuXG4gICAgY29uc3QgcHJldlRpbWUgPSB0aGlzLl9fdGltZTtcblxuICAgIGZvciAoIGxldCBpID0gdGhpcy5fX2hlYWQ7IGkgPCB0aGlzLl9faXRlbXMubGVuZ3RoOyBpICsrICkge1xuICAgICAgY29uc3QgaXRlbSA9IHRoaXMuX19pdGVtc1sgaSBdO1xuICAgICAgY29uc3QgeyB0aW1lOiBiZWdpbiwgZW5kLCBsZW5ndGggfSA9IGl0ZW07XG4gICAgICBsZXQgZWxhcHNlZCA9IHRpbWUgLSBiZWdpbjtcblxuICAgICAgaWYgKCBlbGFwc2VkIDwgMC4wICkge1xuICAgICAgICBicmVhaztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBwcm9ncmVzczogbnVtYmVyO1xuICAgICAgICBsZXQgaW5pdDogdHJ1ZSB8IHVuZGVmaW5lZDtcbiAgICAgICAgbGV0IHVuaW5pdDogdHJ1ZSB8IHVuZGVmaW5lZDtcblxuICAgICAgICBpZiAoIGxlbmd0aCA8PSBlbGFwc2VkICkge1xuICAgICAgICAgIGVsYXBzZWQgPSBsZW5ndGg7XG4gICAgICAgICAgcHJvZ3Jlc3MgPSAxLjA7XG4gICAgICAgICAgdW5pbml0ID0gdHJ1ZTtcblxuICAgICAgICAgIGlmICggaSA9PT0gdGhpcy5fX2hlYWQgKSB7XG4gICAgICAgICAgICB0aGlzLl9faGVhZCArKztcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcHJvZ3Jlc3MgPSBsZW5ndGggIT09IDAuMFxuICAgICAgICAgICAgPyBlbGFwc2VkIC8gbGVuZ3RoXG4gICAgICAgICAgICA6IDEuMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggcHJldlRpbWUgPCBiZWdpbiApIHtcbiAgICAgICAgICBpbml0ID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldC5wdXNoKCBbIGJlZ2luICsgZWxhcHNlZCwgKCkgPT4ge1xuICAgICAgICAgIHRoaXMuX192YWx1ZSA9IGl0ZW0uZ2V0VmFsdWUoIGVsYXBzZWQgKTtcblxuICAgICAgICAgIHRoaXMuX19saXN0ZW5lcnMuZm9yRWFjaCggKCBsaXN0ZW5lciApID0+IGxpc3RlbmVyKCB7XG4gICAgICAgICAgICB0aW1lLFxuICAgICAgICAgICAgZWxhcHNlZCxcbiAgICAgICAgICAgIGJlZ2luLFxuICAgICAgICAgICAgZW5kLFxuICAgICAgICAgICAgbGVuZ3RoLFxuICAgICAgICAgICAgdmFsdWU6IHRoaXMuX192YWx1ZSxcbiAgICAgICAgICAgIHByb2dyZXNzLFxuICAgICAgICAgICAgaW5pdCxcbiAgICAgICAgICAgIHVuaW5pdCxcbiAgICAgICAgICB9ICkgKTtcbiAgICAgICAgfSBdICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fX3RpbWUgPSB0aW1lO1xuXG4gICAgcmV0dXJuIHJldDtcbiAgfVxufVxuIiwiaW1wb3J0IHsgQXV0b21hdG9uIH0gZnJvbSAnLi9BdXRvbWF0b24nO1xuaW1wb3J0IHsgYmV6aWVyRWFzaW5nIH0gZnJvbSAnLi91dGlscy9iZXppZXJFYXNpbmcnO1xuaW1wb3J0IHR5cGUgeyBCZXppZXJOb2RlIH0gZnJvbSAnLi90eXBlcy9CZXppZXJOb2RlJztcbmltcG9ydCB0eXBlIHsgRnhDb250ZXh0IH0gZnJvbSAnLi90eXBlcy9GeENvbnRleHQnO1xuaW1wb3J0IHR5cGUgeyBGeFNlY3Rpb24gfSBmcm9tICcuL3R5cGVzL0Z4U2VjdGlvbic7XG5pbXBvcnQgdHlwZSB7IFNlcmlhbGl6ZWRDdXJ2ZSB9IGZyb20gJy4vdHlwZXMvU2VyaWFsaXplZEN1cnZlJztcblxuLyoqXG4gKiBJdCByZXByZXNlbnRzIGEgY3VydmUgb2YgQXV0b21hdG9uLlxuICovXG5leHBvcnQgY2xhc3MgQ3VydmUge1xuICAvKipcbiAgICogVGhlIHBhcmVudCBhdXRvbWF0b24uXG4gICAqL1xuICBwcm90ZWN0ZWQgX19hdXRvbWF0b246IEF1dG9tYXRvbjtcblxuICAvKipcbiAgICogQW4gYXJyYXkgb2YgcHJlY2FsY3VsYXRlZCB2YWx1ZS5cbiAgICogSXRzIGxlbmd0aCBpcyBzYW1lIGFzIGBjdXJ2ZS5fX2F1dG9tYXRvbi5yZXNvbHV0aW9uICogY3VydmUuX19hdXRvbWF0b24ubGVuZ3RoICsgMWAuXG4gICovXG4gIHByb3RlY3RlZCBfX3ZhbHVlcyE6IEZsb2F0MzJBcnJheTtcblxuICAvKipcbiAgICogQW4gYXJyYXkgb2YgYm9vbCB3aGVyZSB5b3UgZG8gbm90IHdhbnQgdG8gaW50ZXJwb2xhdGUgdGhlIHZhbHVlLlxuICAgKiBJdHMgbGVuZ3RoIGlzIHNhbWUgYXMgYGN1cnZlLl9fYXV0b21hdG9uLnJlc29sdXRpb24gKiBjdXJ2ZS5fX2F1dG9tYXRvbi5sZW5ndGggKyAxYC5cbiAgICovXG4gIHByb3RlY3RlZCBfX3Nob3VsZE5vdEludGVycG9sYXRlITogVWludDhBcnJheTtcblxuICAvKipcbiAgICogTGlzdCBvZiBiZXppZXIgbm9kZS5cbiAgICovXG4gIHByb3RlY3RlZCBfX25vZGVzOiBCZXppZXJOb2RlW10gPSBbXTtcblxuICAvKipcbiAgICogTGlzdCBvZiBmeCBzZWN0aW9ucy5cbiAgICovXG4gIHByb3RlY3RlZCBfX2Z4czogRnhTZWN0aW9uW10gPSBbXTtcblxuICAvKipcbiAgICogVGhlIGxlbmd0aCBvZiB0aGlzIGN1cnZlLlxuICAgKi9cbiAgcHVibGljIGdldCBsZW5ndGgoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fX25vZGVzWyB0aGlzLl9fbm9kZXMubGVuZ3RoIC0gMSBdLnRpbWU7XG4gIH1cblxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RvciBvZiBhIFtbQ3VydmVdXS5cbiAgICogQHBhcmFtIGF1dG9tYXRvbiBQYXJlbnQgYXV0b21hdG9uXG4gICAqIEBwYXJhbSBkYXRhIERhdGEgb2YgdGhlIGN1cnZlXG4gICAqL1xuICBwdWJsaWMgY29uc3RydWN0b3IoIGF1dG9tYXRvbjogQXV0b21hdG9uLCBkYXRhOiBTZXJpYWxpemVkQ3VydmUgKSB7XG4gICAgdGhpcy5fX2F1dG9tYXRvbiA9IGF1dG9tYXRvbjtcblxuICAgIHRoaXMuZGVzZXJpYWxpemUoIGRhdGEgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkIGEgc2VyaWFsaXplZCBkYXRhIG9mIGEgY3VydmUuXG4gICAqIEBwYXJhbSBkYXRhIERhdGEgb2YgYSBjdXJ2ZVxuICAgKi9cbiAgcHVibGljIGRlc2VyaWFsaXplKCBkYXRhOiBTZXJpYWxpemVkQ3VydmUgKTogdm9pZCB7XG4gICAgdGhpcy5fX25vZGVzID0gZGF0YS5ub2Rlcy5tYXAoICggbm9kZSApID0+ICgge1xuICAgICAgdGltZTogbm9kZVsgMCBdID8/IDAuMCxcbiAgICAgIHZhbHVlOiBub2RlWyAxIF0gPz8gMC4wLFxuICAgICAgaW5UaW1lOiBub2RlWyAyIF0gPz8gMC4wLFxuICAgICAgaW5WYWx1ZTogbm9kZVsgMyBdID8/IDAuMCxcbiAgICAgIG91dFRpbWU6IG5vZGVbIDQgXSA/PyAwLjAsXG4gICAgICBvdXRWYWx1ZTogbm9kZVsgNSBdID8/IDAuMCxcbiAgICB9ICkgKTtcblxuICAgIHRoaXMuX19meHMgPSBbXTtcbiAgICBkYXRhLmZ4cz8uZm9yRWFjaCggKCBmeCApID0+IHtcbiAgICAgIGlmICggZnguYnlwYXNzICkgeyByZXR1cm47IH1cbiAgICAgIHRoaXMuX19meHMucHVzaCgge1xuICAgICAgICB0aW1lOiBmeC50aW1lID8/IDAuMCxcbiAgICAgICAgbGVuZ3RoOiBmeC5sZW5ndGggPz8gMC4wLFxuICAgICAgICByb3c6IGZ4LnJvdyA/PyAwLFxuICAgICAgICBkZWY6IGZ4LmRlZixcbiAgICAgICAgcGFyYW1zOiBmeC5wYXJhbXNcbiAgICAgIH0gKTtcbiAgICB9ICk7XG5cbiAgICB0aGlzLnByZWNhbGMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmVjYWxjdWxhdGUgdmFsdWUgb2Ygc2FtcGxlcy5cbiAgICovXG4gIHB1YmxpYyBwcmVjYWxjKCk6IHZvaWQge1xuICAgIGNvbnN0IHZhbHVlc0xlbmd0aCA9IE1hdGguY2VpbCggdGhpcy5fX2F1dG9tYXRvbi5yZXNvbHV0aW9uICogdGhpcy5sZW5ndGggKSArIDE7XG5cbiAgICB0aGlzLl9fdmFsdWVzID0gbmV3IEZsb2F0MzJBcnJheSggdmFsdWVzTGVuZ3RoICk7XG4gICAgdGhpcy5fX3Nob3VsZE5vdEludGVycG9sYXRlID0gbmV3IFVpbnQ4QXJyYXkoIHZhbHVlc0xlbmd0aCApO1xuXG4gICAgdGhpcy5fX2dlbmVyYXRlQ3VydmUoKTtcbiAgICB0aGlzLl9fYXBwbHlGeHMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIHZhbHVlIG9mIHNwZWNpZmllZCB0aW1lIHBvaW50LlxuICAgKiBAcGFyYW0gdGltZSBUaW1lIGF0IHRoZSBwb2ludCB5b3Ugd2FudCB0byBncmFiIHRoZSB2YWx1ZS5cbiAgICogQHJldHVybnMgUmVzdWx0IHZhbHVlXG4gICAqL1xuICBwdWJsaWMgZ2V0VmFsdWUoIHRpbWU6IG51bWJlciApOiBudW1iZXIge1xuICAgIGlmICggdGltZSA8IDAuMCApIHtcbiAgICAgIC8vIGNsYW1wIGxlZnRcbiAgICAgIHJldHVybiB0aGlzLl9fdmFsdWVzWyAwIF07XG5cbiAgICB9IGVsc2UgaWYgKCB0aGlzLmxlbmd0aCA8PSB0aW1lICkge1xuICAgICAgLy8gY2xhbXAgcmlnaHRcbiAgICAgIHJldHVybiB0aGlzLl9fdmFsdWVzWyB0aGlzLl9fdmFsdWVzLmxlbmd0aCAtIDEgXTtcblxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBmZXRjaCB0d28gdmFsdWVzIHRoZW4gZG8gdGhlIGxpbmVhciBpbnRlcnBvbGF0aW9uXG4gICAgICBjb25zdCBpbmRleCA9IHRpbWUgKiB0aGlzLl9fYXV0b21hdG9uLnJlc29sdXRpb247XG4gICAgICBjb25zdCBpbmRleGkgPSBNYXRoLmZsb29yKCBpbmRleCApO1xuICAgICAgY29uc3QgaW5kZXhmID0gaW5kZXggJSAxLjA7XG5cbiAgICAgIGNvbnN0IHYwID0gdGhpcy5fX3ZhbHVlc1sgaW5kZXhpIF07XG4gICAgICBsZXQgdjEgPSB0aGlzLl9fdmFsdWVzWyBpbmRleGkgKyAxIF07XG5cbiAgICAgIGlmICggdGhpcy5fX3Nob3VsZE5vdEludGVycG9sYXRlWyBpbmRleGkgXSApIHtcbiAgICAgICAgLy8gY29udGludWUgIHRoZSBwcmV2aW91cyBkZWx0YVxuICAgICAgICBjb25zdCB2cCA9IHRoaXMuX192YWx1ZXNbIE1hdGgubWF4KCBpbmRleGkgLSAxLCAwICkgXTtcbiAgICAgICAgdjEgPSAyLjAgKiB2MCAtIHZwOyAvLyB2MCArICggdjAgLSB2cCApO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB2ID0gdjAgKyAoIHYxIC0gdjAgKSAqIGluZGV4ZjtcblxuICAgICAgcmV0dXJuIHY7XG5cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVGhlIGZpcnN0IHN0ZXAgb2Yge0BsaW5rIHByZWNhbGN9OiBnZW5lcmF0ZSBhIGN1cnZlIG91dCBvZiBub2Rlcy5cbiAgICovXG4gIHByb3RlY3RlZCBfX2dlbmVyYXRlQ3VydmUoKTogdm9pZCB7XG4gICAgbGV0IG5vZGVUYWlsID0gdGhpcy5fX25vZGVzWyAwIF07XG4gICAgbGV0IGlUYWlsID0gMDtcbiAgICBmb3IgKCBsZXQgaU5vZGUgPSAwOyBpTm9kZSA8IHRoaXMuX19ub2Rlcy5sZW5ndGggLSAxOyBpTm9kZSArKyApIHtcbiAgICAgIGNvbnN0IG5vZGUwID0gbm9kZVRhaWw7XG4gICAgICBub2RlVGFpbCA9IHRoaXMuX19ub2Rlc1sgaU5vZGUgKyAxIF07XG4gICAgICBjb25zdCBpMCA9IGlUYWlsO1xuICAgICAgaVRhaWwgPSBNYXRoLmZsb29yKCBub2RlVGFpbC50aW1lICogdGhpcy5fX2F1dG9tYXRvbi5yZXNvbHV0aW9uICk7XG5cbiAgICAgIHRoaXMuX192YWx1ZXNbIGkwIF0gPSBub2RlMC52YWx1ZTtcblxuICAgICAgaWYgKCBpMCA9PT0gaVRhaWwgJiYgaVRhaWwgIT09IDAgKSB7XG4gICAgICAgIHRoaXMuX19zaG91bGROb3RJbnRlcnBvbGF0ZVsgaVRhaWwgLSAxIF0gPSAxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yICggbGV0IGkgPSBpMCArIDE7IGkgPD0gaVRhaWw7IGkgKysgKSB7XG4gICAgICAgICAgY29uc3QgdGltZSA9IGkgLyB0aGlzLl9fYXV0b21hdG9uLnJlc29sdXRpb247XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSBiZXppZXJFYXNpbmcoIG5vZGUwLCBub2RlVGFpbCwgdGltZSApO1xuICAgICAgICAgIHRoaXMuX192YWx1ZXNbIGkgXSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yICggbGV0IGkgPSBpVGFpbCArIDE7IGkgPCB0aGlzLl9fdmFsdWVzLmxlbmd0aDsgaSArKyApIHtcbiAgICAgIHRoaXMuX192YWx1ZXNbIGkgXSA9IG5vZGVUYWlsLnZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgc2Vjb25kIHN0ZXAgb2Yge0BsaW5rIHByZWNhbGN9OiBhcHBseSBmeHMgdG8gdGhlIGdlbmVyYXRlZCBjdXJ2ZXMuXG4gICAqL1xuICBwcm90ZWN0ZWQgX19hcHBseUZ4cygpOiB2b2lkIHtcbiAgICBmb3IgKCBsZXQgaUZ4ID0gMDsgaUZ4IDwgdGhpcy5fX2Z4cy5sZW5ndGg7IGlGeCArKyApIHtcbiAgICAgIGNvbnN0IGZ4ID0gdGhpcy5fX2Z4c1sgaUZ4IF07XG4gICAgICBjb25zdCBmeERlZiA9IHRoaXMuX19hdXRvbWF0b24uZ2V0RnhEZWZpbml0aW9uKCBmeC5kZWYgKTtcbiAgICAgIGlmICggIWZ4RGVmICkge1xuICAgICAgICBpZiAoIHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAnZGV2ZWxvcG1lbnQnICkge1xuICAgICAgICAgIGNvbnNvbGUud2FybiggYE5vIHN1Y2ggZnggZGVmaW5pdGlvbjogJHsgZnguZGVmIH1gICk7XG4gICAgICAgIH1cblxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgYXZhaWxhYmxlRW5kID0gTWF0aC5taW4oIHRoaXMubGVuZ3RoLCBmeC50aW1lICsgZngubGVuZ3RoICk7XG4gICAgICBjb25zdCBpMCA9IE1hdGguY2VpbCggdGhpcy5fX2F1dG9tYXRvbi5yZXNvbHV0aW9uICogZngudGltZSApO1xuICAgICAgY29uc3QgaTEgPSBNYXRoLmZsb29yKCB0aGlzLl9fYXV0b21hdG9uLnJlc29sdXRpb24gKiBhdmFpbGFibGVFbmQgKTtcbiAgICAgIGlmICggaTEgPD0gaTAgKSB7XG4gICAgICAgIGlmICggcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdkZXZlbG9wbWVudCcgKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvciggJ0xlbmd0aCBvZiB0aGUgZnggc2VjdGlvbiBpcyBiZWluZyBuZWdhdGl2ZScgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB0ZW1wTGVuZ3RoID0gaTEgLSBpMCArIDE7XG4gICAgICBjb25zdCB0ZW1wVmFsdWVzID0gbmV3IEZsb2F0MzJBcnJheSggdGVtcExlbmd0aCApO1xuXG4gICAgICBjb25zdCBjb250ZXh0OiBGeENvbnRleHQgPSB7XG4gICAgICAgIGluZGV4OiBpMCxcbiAgICAgICAgaTAsXG4gICAgICAgIGkxLFxuICAgICAgICB0aW1lOiBmeC50aW1lLFxuICAgICAgICB0MDogZngudGltZSxcbiAgICAgICAgdDE6IGZ4LnRpbWUgKyBmeC5sZW5ndGgsXG4gICAgICAgIGRlbHRhVGltZTogMS4wIC8gdGhpcy5fX2F1dG9tYXRvbi5yZXNvbHV0aW9uLFxuICAgICAgICB2YWx1ZTogMC4wLFxuICAgICAgICBwcm9ncmVzczogMC4wLFxuICAgICAgICBlbGFwc2VkOiAwLjAsXG4gICAgICAgIHJlc29sdXRpb246IHRoaXMuX19hdXRvbWF0b24ucmVzb2x1dGlvbixcbiAgICAgICAgbGVuZ3RoOiBmeC5sZW5ndGgsXG4gICAgICAgIHBhcmFtczogZngucGFyYW1zLFxuICAgICAgICBhcnJheTogdGhpcy5fX3ZhbHVlcyxcbiAgICAgICAgc2hvdWxkTm90SW50ZXJwb2xhdGU6IHRoaXMuX19zaG91bGROb3RJbnRlcnBvbGF0ZVsgaTAgXSA9PT0gMSxcbiAgICAgICAgc2V0U2hvdWxkTm90SW50ZXJwb2xhdGU6ICggc2hvdWxkTm90SW50ZXJwb2xhdGU6IGJvb2xlYW4gKSA9PiB7XG4gICAgICAgICAgdGhpcy5fX3Nob3VsZE5vdEludGVycG9sYXRlWyBjb250ZXh0LmluZGV4IF0gPSBzaG91bGROb3RJbnRlcnBvbGF0ZSA/IDEgOiAwO1xuICAgICAgICB9LFxuICAgICAgICBnZXRWYWx1ZTogdGhpcy5nZXRWYWx1ZS5iaW5kKCB0aGlzICksXG4gICAgICAgIGluaXQ6IHRydWUsXG4gICAgICAgIHN0YXRlOiB7fSxcbiAgICAgIH07XG5cbiAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRlbXBMZW5ndGg7IGkgKysgKSB7XG4gICAgICAgIGNvbnRleHQuaW5kZXggPSBpICsgaTA7XG4gICAgICAgIGNvbnRleHQudGltZSA9IGNvbnRleHQuaW5kZXggLyB0aGlzLl9fYXV0b21hdG9uLnJlc29sdXRpb247XG4gICAgICAgIGNvbnRleHQudmFsdWUgPSB0aGlzLl9fdmFsdWVzWyBpICsgaTAgXTtcbiAgICAgICAgY29udGV4dC5lbGFwc2VkID0gY29udGV4dC50aW1lIC0gZngudGltZTtcbiAgICAgICAgY29udGV4dC5wcm9ncmVzcyA9IGNvbnRleHQuZWxhcHNlZCAvIGZ4Lmxlbmd0aDtcbiAgICAgICAgY29udGV4dC5zaG91bGROb3RJbnRlcnBvbGF0ZSA9IHRoaXMuX19zaG91bGROb3RJbnRlcnBvbGF0ZVsgaSArIGkwIF0gPT09IDE7XG4gICAgICAgIHRlbXBWYWx1ZXNbIGkgXSA9IGZ4RGVmLmZ1bmMoIGNvbnRleHQgKTtcblxuICAgICAgICBjb250ZXh0LmluaXQgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fX3ZhbHVlcy5zZXQoIHRlbXBWYWx1ZXMsIGkwICk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBDaGFubmVsIH0gZnJvbSAnLi9DaGFubmVsJztcbmltcG9ydCB7IEN1cnZlIH0gZnJvbSAnLi9DdXJ2ZSc7XG5pbXBvcnQgdHlwZSB7IEF1dG9tYXRvbk9wdGlvbnMgfSBmcm9tICcuL3R5cGVzL0F1dG9tYXRvbk9wdGlvbnMnO1xuaW1wb3J0IHR5cGUgeyBDaGFubmVsVXBkYXRlRXZlbnQgfSBmcm9tICcuL3R5cGVzL0NoYW5uZWxVcGRhdGVFdmVudCc7XG5pbXBvcnQgdHlwZSB7IEZ4RGVmaW5pdGlvbiB9IGZyb20gJy4vdHlwZXMvRnhEZWZpbml0aW9uJztcbmltcG9ydCB0eXBlIHsgU2VyaWFsaXplZEF1dG9tYXRvbiB9IGZyb20gJy4vdHlwZXMvU2VyaWFsaXplZEF1dG9tYXRvbic7XG5cbi8qKlxuICogSVQnUyBBVVRPTUFUT04hXG4gKiBAcGFyYW0gZGF0YSBTZXJpYWxpemVkIGRhdGEgb2YgdGhlIGF1dG9tYXRvblxuICogQHBhcmFtIG9wdGlvbnMgT3B0aW9ucyBmb3IgdGhpcyBBdXRvbWF0b24gaW5zdGFuY2VcbiAqL1xuZXhwb3J0IGNsYXNzIEF1dG9tYXRvbiB7XG4gIC8qKlxuICAgKiBJdCByZXR1cm5zIHRoZSBjdXJyZW50IHZhbHVlIG9mIHRoZSBbW0NoYW5uZWxdXSBjYWxsZWQgYG5hbWVgLlxuICAgKiBJZiB0aGUgYG5hbWVgIGlzIGFuIGFycmF5LCBpdCByZXR1cm5zIGEgc2V0IG9mIG5hbWUgOiBjaGFubmVsIGFzIGFuIG9iamVjdCBpbnN0ZWFkLlxuICAgKiBZb3UgY2FuIGFsc28gZ2l2ZSBhIGxpc3RlbmVyIHdoaWNoIHdpbGwgYmUgZXhlY3V0ZWQgd2hlbiB0aGUgY2hhbm5lbCBjaGFuZ2VzIGl0cyB2YWx1ZSAob3B0aW9uYWwpLlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbmFtZSBvZiB0aGUgY2hhbm5lbFxuICAgKiBAcGFyYW0gbGlzdGVuZXIgQSBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgZXhlY3V0ZWQgd2hlbiB0aGUgY2hhbm5lbCBjaGFuZ2VzIGl0cyB2YWx1ZVxuICAgKiBAcmV0dXJucyBDdXJyZW50IHZhbHVlIG9mIHRoZSBjaGFubmVsXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgYXV0bzogQXV0b21hdG9uWyAnX19hdXRvJyBdID0gdGhpcy5fX2F1dG8uYmluZCggdGhpcyApO1xuXG4gIC8qKlxuICAgKiBDdXJ2ZXMgb2YgdGhlIGF1dG9tYXRvbi5cbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBjdXJ2ZXM6IEN1cnZlW10gPSBbXTtcblxuICAvKipcbiAgICogQ2hhbm5lbHMgb2YgdGhlIHRpbWVsaW5lLlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IGNoYW5uZWxzOiBDaGFubmVsW10gPSBbXTtcblxuICAvKipcbiAgICogTWFwIG9mIGNoYW5uZWxzLCBuYW1lIHZzLiBjaGFubmVsIGl0c2VsZi5cbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBtYXBOYW1lVG9DaGFubmVsID0gbmV3IE1hcDxzdHJpbmcsIENoYW5uZWw+KCk7XG5cbiAgLyoqXG4gICAqIEN1cnJlbnQgdGltZSBvZiB0aGUgYXV0b21hdG9uLlxuICAgKiBDYW4gYmUgc2V0IGJ5IFtbdXBkYXRlXV0sIGJlIHJldHJpZXZlZCBieSBbW2dldCB0aW1lXV0sIGJlIHVzZWQgYnkgW1thdXRvXV1cbiAgICovXG4gIHByb3RlY3RlZCBfX3RpbWU6IG51bWJlciA9IDAuMDtcblxuICAvKipcbiAgICogVmVyc2lvbiBvZiB0aGUgYXV0b21hdG9uLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fdmVyc2lvbjogc3RyaW5nID0gcHJvY2Vzcy5lbnYuVkVSU0lPTiE7XG5cbiAgLyoqXG4gICAqIFJlc29sdXRpb24gb2YgdGhlIHRpbWVsaW5lLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fcmVzb2x1dGlvbjogbnVtYmVyID0gMTAwMDtcblxuICAvKipcbiAgICogQSBtYXAgb2YgZnggZGVmaW5pdGlvbnMuXG4gICAqL1xuICBwcm90ZWN0ZWQgX19meERlZmluaXRpb25zOiB7IFsgbmFtZTogc3RyaW5nIF06IEZ4RGVmaW5pdGlvbiB9ID0ge307XG5cbiAgcHVibGljIGNvbnN0cnVjdG9yKFxuICAgIGRhdGE6IFNlcmlhbGl6ZWRBdXRvbWF0b24sXG4gICAgb3B0aW9uczogQXV0b21hdG9uT3B0aW9ucyA9IHt9XG4gICkge1xuICAgIG9wdGlvbnMuZnhEZWZpbml0aW9ucyAmJiB0aGlzLmFkZEZ4RGVmaW5pdGlvbnMoIG9wdGlvbnMuZnhEZWZpbml0aW9ucyApO1xuICAgIHRoaXMuZGVzZXJpYWxpemUoIGRhdGEgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDdXJyZW50IHRpbWUgb2YgdGhlIGF1dG9tYXRvbiwgdGhhdCBpcyBzZXQgdmlhIFtbdXBkYXRlXV0uXG4gICAqL1xuICBwdWJsaWMgZ2V0IHRpbWUoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX190aW1lOyB9XG5cbiAgLyoqXG4gICAqIFZlcnNpb24gb2YgdGhlIGF1dG9tYXRvbi5cbiAgICovXG4gIHB1YmxpYyBnZXQgdmVyc2lvbigpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5fX3ZlcnNpb247IH1cblxuICAvKipcbiAgICogUmVzb2x1dGlvbiA9IFNhbXBsaW5nIHBvaW50IHBlciBzZWNvbmQuXG4gICAqL1xuICBwdWJsaWMgZ2V0IHJlc29sdXRpb24oKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX19yZXNvbHV0aW9uOyB9XG5cbiAgLyoqXG4gICAqIExvYWQgc2VyaWFsaXplZCBhdXRvbWF0b24gZGF0YS5cbiAgICogQHBhcmFtIGRhdGEgU2VyaWFsaXplZCBvYmplY3QgY29udGFpbnMgYXV0b21hdG9uIGRhdGEuXG4gICAqL1xuICBwdWJsaWMgZGVzZXJpYWxpemUoIGRhdGE6IFNlcmlhbGl6ZWRBdXRvbWF0b24gKTogdm9pZCB7XG4gICAgdGhpcy5fX3Jlc29sdXRpb24gPSBkYXRhLnJlc29sdXRpb247XG5cbiAgICB0aGlzLmN1cnZlcy5zcGxpY2UoIDAgKTtcbiAgICB0aGlzLmN1cnZlcy5wdXNoKFxuICAgICAgLi4uZGF0YS5jdXJ2ZXMubWFwKCAoIGRhdGEgKSA9PiBuZXcgQ3VydmUoIHRoaXMsIGRhdGEgKSApXG4gICAgKTtcblxuICAgIHRoaXMubWFwTmFtZVRvQ2hhbm5lbC5jbGVhcigpO1xuXG4gICAgdGhpcy5jaGFubmVscy5zcGxpY2UoIDAgKTtcbiAgICB0aGlzLmNoYW5uZWxzLnB1c2goXG4gICAgICAuLi5kYXRhLmNoYW5uZWxzLm1hcCggKCBbIG5hbWUsIGRhdGEgXSApID0+IHtcbiAgICAgICAgY29uc3QgY2hhbm5lbCA9IG5ldyBDaGFubmVsKCB0aGlzLCBkYXRhICk7XG5cbiAgICAgICAgaWYgKCBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50JyApIHtcbiAgICAgICAgICBpZiAoIHRoaXMubWFwTmFtZVRvQ2hhbm5lbC5oYXMoIG5hbWUgKSApIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybiggYER1cGxpY2F0ZWQgY2hhbm5lbDogJHsgbmFtZSB9YCApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubWFwTmFtZVRvQ2hhbm5lbC5zZXQoIG5hbWUsIGNoYW5uZWwgKTtcbiAgICAgICAgcmV0dXJuIGNoYW5uZWw7XG4gICAgICB9IClcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBmeCBkZWZpbml0aW9ucy5cbiAgICogQHBhcmFtIGZ4RGVmaW5pdGlvbnMgQSBtYXAgb2YgaWQgLSBmeCBkZWZpbml0aW9uXG4gICAqL1xuICBwdWJsaWMgYWRkRnhEZWZpbml0aW9ucyggZnhEZWZpbml0aW9uczogeyBbIGlkOiBzdHJpbmcgXTogRnhEZWZpbml0aW9uIH0gKTogdm9pZCB7XG4gICAgT2JqZWN0LmVudHJpZXMoIGZ4RGVmaW5pdGlvbnMgKS5mb3JFYWNoKCAoIFsgaWQsIGZ4RGVmIF0gKSA9PiB7XG4gICAgICBpZiAoIHR5cGVvZiBmeERlZi5mdW5jID09PSAnZnVuY3Rpb24nICkgeyAvLyBpZ25vcmUgdW5yZWxhdGVkIGVudHJpZXNcbiAgICAgICAgaWYgKCBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50JyApIHtcbiAgICAgICAgICBpZiAoIHRoaXMuX19meERlZmluaXRpb25zWyBpZCBdICE9IG51bGwgKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oIGBPdmVyd3JpdGluZyB0aGUgZXhpc3RpbmcgZnggZGVmaW5pdGlvbjogJHsgaWQgfWAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9fZnhEZWZpbml0aW9uc1sgaWQgXSA9IGZ4RGVmO1xuICAgICAgfVxuICAgIH0gKTtcblxuICAgIHRoaXMucHJlY2FsY0FsbCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIGZ4IGRlZmluaXRpb24uXG4gICAqIElmIGl0IGNhbid0IGZpbmQgdGhlIGRlZmluaXRpb24sIGl0IHJldHVybnMgYG51bGxgIGluc3RlYWQuXG4gICAqIEBwYXJhbSBpZCBVbmlxdWUgaWQgZm9yIHRoZSBGeCBkZWZpbml0aW9uXG4gICAqL1xuICBwdWJsaWMgZ2V0RnhEZWZpbml0aW9uKCBpZDogc3RyaW5nICk6IEZ4RGVmaW5pdGlvbiB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLl9fZnhEZWZpbml0aW9uc1sgaWQgXSB8fCBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIGN1cnZlLlxuICAgKiBAcGFyYW0gaW5kZXggQW4gaW5kZXggb2YgdGhlIGN1cnZlXG4gICAqL1xuICBwdWJsaWMgZ2V0Q3VydmUoIGluZGV4OiBudW1iZXIgKTogQ3VydmUgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5jdXJ2ZXNbIGluZGV4IF0gfHwgbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmVjYWxjdWxhdGUgYWxsIGN1cnZlcy5cbiAgICovXG4gIHB1YmxpYyBwcmVjYWxjQWxsKCk6IHZvaWQge1xuICAgIE9iamVjdC52YWx1ZXMoIHRoaXMuY3VydmVzICkuZm9yRWFjaCggKCBjdXJ2ZSApID0+IGN1cnZlLnByZWNhbGMoKSApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0IHRoZSBpbnRlcm5hbCBzdGF0ZXMgb2YgY2hhbm5lbHMuXG4gICAqICoqQ2FsbCB0aGlzIG1ldGhvZCB3aGVuIHlvdSBzZWVrIHRoZSB0aW1lLioqXG4gICAqL1xuICBwdWJsaWMgcmVzZXQoKTogdm9pZCB7XG4gICAgT2JqZWN0LnZhbHVlcyggdGhpcy5jaGFubmVscyApLmZvckVhY2goICggY2hhbm5lbCApID0+IGNoYW5uZWwucmVzZXQoKSApO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgZW50aXJlIGF1dG9tYXRvbi5cbiAgICogKipZb3UgbWF5IHdhbnQgdG8gY2FsbCB0aGlzIGluIHlvdXIgdXBkYXRlIGxvb3AuKipcbiAgICogQHBhcmFtIHRpbWUgQ3VycmVudCB0aW1lXG4gICAqL1xuICBwdWJsaWMgdXBkYXRlKCB0aW1lOiBudW1iZXIgKTogdm9pZCB7XG4gICAgY29uc3QgdCA9IE1hdGgubWF4KCB0aW1lLCAwLjAgKTtcblxuICAgIC8vIGNhY2hlIHRoZSB0aW1lXG4gICAgdGhpcy5fX3RpbWUgPSB0O1xuXG4gICAgLy8gdXBkYXRlIGNoYW5uZWxzXG4gICAgY29uc3QgYXJyYXkgPSB0aGlzLmNoYW5uZWxzLm1hcCggKCBjaGFubmVsICkgPT4gY2hhbm5lbC5jb25zdW1lKCB0aGlzLl9fdGltZSApICkuZmxhdCggMSApO1xuICAgIGFycmF5LnNvcnQoICggWyBhIF0sIFsgYiBdICkgPT4gYSAtIGIgKS5mb3JFYWNoKCAoIFsgXywgZnVuYyBdICkgPT4gZnVuYygpICk7XG4gIH1cblxuICAvKipcbiAgICogQXNzaWduZWQgdG8ge0BsaW5rIEF1dG9tYXRvbiNhdXRvfSBvbiBpdHMgaW5pdGlhbGl6ZSBwaGFzZS5cbiAgICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgb2YgdGhlIGNoYW5uZWxcbiAgICogQHBhcmFtIGxpc3RlbmVyIEEgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIGV4ZWN1dGVkIHdoZW4gdGhlIGNoYW5uZWwgY2hhbmdlcyBpdHMgdmFsdWVcbiAgICogQHJldHVybnMgQ3VycmVudCB2YWx1ZSBvZiB0aGUgY2hhbm5lbFxuICAgKi9cbiAgcHJvdGVjdGVkIF9fYXV0byhcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgbGlzdGVuZXI/OiAoIGV2ZW50OiBDaGFubmVsVXBkYXRlRXZlbnQgKSA9PiB2b2lkXG4gICk6IG51bWJlciB7XG4gICAgY29uc3QgY2hhbm5lbCA9IHRoaXMubWFwTmFtZVRvQ2hhbm5lbC5nZXQoIG5hbWUgKTtcblxuICAgIGlmICggcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdkZXZlbG9wbWVudCcgKSB7XG4gICAgICBpZiAoICFjaGFubmVsICkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoIGBObyBzdWNoIGNoYW5uZWw6ICR7IG5hbWUgfWAgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIGxpc3RlbmVyICkge1xuICAgICAgY2hhbm5lbCEuc3Vic2NyaWJlKCBsaXN0ZW5lciApO1xuICAgIH1cblxuICAgIHJldHVybiBjaGFubmVsIS5jdXJyZW50VmFsdWU7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQVNBLE1BQU0sV0FBVyxHQUFHLENBQUMsQ0FBQztBQUN0QixNQUFNLGNBQWMsR0FBRyxLQUFLLENBQUM7QUFDN0IsTUFBTSxXQUFXLEdBQUcsRUFBRSxDQUFDO0FBQ3ZCLE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQztBQUNoQyxNQUFNLFVBQVUsR0FBRyxFQUFFLENBQUM7QUFFdEIsTUFBTSxPQUFPLEdBQWEsRUFBRSxDQUFDO0FBRTdCLFNBQVMsS0FBSyxDQUFFLENBQVMsRUFBRSxHQUFXLEVBQUUsR0FBVztJQUNqRCxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBRSxDQUFDLEVBQUUsR0FBRyxDQUFFLEVBQUUsR0FBRyxDQUFFLENBQUM7QUFDN0MsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7OztBQWVBLFNBQVMsQ0FBQyxDQUFFLEdBQTZCO0lBQ3ZDLE9BQU8sR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsRUFBRSxDQUFDO0FBQ3ZELENBQUM7QUFFRCxTQUFTLENBQUMsQ0FBRSxHQUE2QjtJQUN2QyxPQUFPLEdBQUcsR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsRUFBRSxDQUFDO0FBQ3BELENBQUM7QUFFRCxTQUFTLENBQUMsQ0FBRSxHQUE2QjtJQUN2QyxPQUFPLEdBQUcsR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsRUFBRSxDQUFDO0FBQ3JDLENBQUM7QUFFRCxTQUFTLFdBQVcsQ0FBRSxDQUFTLEVBQUUsR0FBNkI7SUFDNUQsT0FBTyxDQUFFLENBQUUsQ0FBQyxDQUFFLEdBQUcsQ0FBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUUsR0FBRyxDQUFFLElBQUssQ0FBQyxHQUFHLENBQUMsQ0FBRSxHQUFHLENBQUUsSUFBSyxDQUFDLEdBQUcsR0FBRyxDQUFDLEVBQUUsQ0FBQztBQUNyRSxDQUFDO0FBRUQsU0FBUyxnQkFBZ0IsQ0FBRSxDQUFTLEVBQUUsR0FBNkI7SUFDakUsT0FBTyxDQUFFLEdBQUcsR0FBRyxDQUFDLENBQUUsR0FBRyxDQUFFLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUUsR0FBRyxDQUFFLElBQUssQ0FBQyxHQUFHLENBQUMsQ0FBRSxHQUFHLENBQUUsQ0FBQztBQUNoRSxDQUFDO0FBRUQsU0FBUyxNQUFNLENBQUUsQ0FBUyxFQUFFLENBQVMsRUFBRSxDQUFTLEVBQUUsR0FBNkI7SUFDN0UsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDO0lBQ25CLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUVWLEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxXQUFXLEVBQUUsQ0FBQyxFQUFHLEVBQUc7UUFDdkMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFFLENBQUMsR0FBRyxDQUFDLElBQUssR0FBRyxDQUFDO1FBQ3hCLFVBQVUsR0FBRyxXQUFXLENBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBRSxHQUFHLENBQUMsQ0FBQztRQUN2QyxDQUFFLEdBQUcsR0FBRyxVQUFVLEtBQU8sQ0FBQyxHQUFHLENBQUMsS0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFFLENBQUM7UUFDN0MsSUFBSyxjQUFjLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBRSxVQUFVLENBQUUsRUFBRztZQUFFLE1BQU07U0FBRTtLQUMxRDtJQUVELE9BQU8sQ0FBQyxDQUFDO0FBQ1gsQ0FBQztBQUVELFNBQVMsTUFBTSxDQUFFLENBQVMsRUFBRSxDQUFTLEVBQUUsR0FBNkI7SUFDbEUsS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFdBQVcsRUFBRSxDQUFDLEVBQUcsRUFBRztRQUN2QyxNQUFNLENBQUMsR0FBRyxnQkFBZ0IsQ0FBRSxDQUFDLEVBQUUsR0FBRyxDQUFFLENBQUM7UUFDckMsSUFBSyxDQUFDLEtBQUssR0FBRyxFQUFHO1lBQUUsT0FBTyxDQUFDLENBQUM7U0FBRTtRQUM5QixNQUFNLEVBQUUsR0FBRyxXQUFXLENBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBRSxHQUFHLENBQUMsQ0FBQztRQUNyQyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztLQUNiO0lBRUQsT0FBTyxDQUFDLENBQUM7QUFDWCxDQUFDO1NBRWUsZUFBZSxDQUM3QixJQUE4QixFQUM5QixJQUE4QixFQUM5QixDQUFTO0lBRVQsSUFBSyxDQUFDLElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRztRQUFFLE9BQU8sSUFBSSxDQUFDLEVBQUUsQ0FBQztLQUFFO0lBQ3ZDLElBQUssSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLEVBQUc7UUFBRSxPQUFPLElBQUksQ0FBQyxFQUFFLENBQUM7S0FBRTtJQUV2QyxJQUFJLENBQUMsRUFBRSxHQUFHLEtBQUssQ0FBRSxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBRSxDQUFDO0lBQzdDLElBQUksQ0FBQyxFQUFFLEdBQUcsS0FBSyxDQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFFLENBQUM7SUFFN0MsS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsRUFBRSxDQUFDLEVBQUcsRUFBRztRQUN0QyxPQUFPLENBQUUsQ0FBQyxDQUFFLEdBQUcsV0FBVyxDQUFFLENBQUMsSUFBSyxVQUFVLEdBQUcsR0FBRyxDQUFFLEVBQUUsSUFBSSxDQUFFLENBQUM7S0FDOUQ7SUFFRCxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUM7SUFDZixLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxFQUFFLENBQUMsRUFBRyxFQUFHO1FBQ3RDLE1BQU0sR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2YsSUFBSyxDQUFDLEdBQUcsT0FBTyxDQUFFLENBQUMsQ0FBRSxFQUFHO1lBQUUsTUFBTTtTQUFFO0tBQ25DO0lBRUQsTUFBTSxJQUFJLEdBQUcsQ0FBRSxDQUFDLEdBQUcsT0FBTyxDQUFFLE1BQU0sQ0FBRSxLQUFPLE9BQU8sQ0FBRSxNQUFNLEdBQUcsQ0FBQyxDQUFFLEdBQUcsT0FBTyxDQUFFLE1BQU0sQ0FBRSxDQUFFLENBQUM7SUFDdkYsSUFBSSxDQUFDLEdBQUcsQ0FBRSxNQUFNLEdBQUcsSUFBSSxLQUFPLFVBQVUsR0FBRyxDQUFDLENBQUUsQ0FBQztJQUMvQyxNQUFNLENBQUMsR0FBRyxnQkFBZ0IsQ0FBRSxDQUFDLEVBQUUsSUFBSSxDQUFFLElBQUssSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFFLENBQUM7SUFFOUQsSUFBSyxjQUFjLElBQUksQ0FBQyxFQUFHO1FBQ3pCLENBQUMsR0FBRyxNQUFNLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUUsQ0FBQztLQUMxQjtTQUFNLElBQUssQ0FBQyxLQUFLLEdBQUcsRUFBRztRQUN0QixDQUFDLEdBQUcsTUFBTSxDQUFFLENBQUMsRUFBRSxDQUFFLE1BQU0sS0FBTyxVQUFVLEdBQUcsQ0FBQyxDQUFFLEVBQUUsQ0FBRSxNQUFNLEdBQUcsR0FBRyxLQUFPLFVBQVUsR0FBRyxDQUFDLENBQUUsRUFBRSxJQUFJLENBQUUsQ0FBQztLQUMvRjtJQUVELE9BQU8sV0FBVyxDQUFFLENBQUMsRUFBRSxJQUFJLENBQUUsQ0FBQztBQUNoQyxDQUFDO1NBRWUsWUFBWSxDQUFFLEtBQWlCLEVBQUUsS0FBaUIsRUFBRSxJQUFZO0lBQzlFLE9BQU8sZUFBZSxDQUNwQjtRQUNFLEVBQUUsRUFBRSxLQUFLLENBQUMsSUFBSTtRQUNkLEVBQUUsRUFBRSxLQUFLLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxPQUFPO1FBQzlCLEVBQUUsRUFBRSxLQUFLLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxNQUFNO1FBQzdCLEVBQUUsRUFBRSxLQUFLLENBQUMsSUFBSTtLQUNmLEVBQ0Q7UUFDRSxFQUFFLEVBQUUsS0FBSyxDQUFDLEtBQUs7UUFDZixFQUFFLEVBQUUsS0FBSyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsUUFBUTtRQUNoQyxFQUFFLEVBQUUsS0FBSyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsT0FBTztRQUMvQixFQUFFLEVBQUUsS0FBSyxDQUFDLEtBQUs7S0FDaEIsRUFDRCxJQUFJLENBQ0wsQ0FBQztBQUNKOztBQ25JQTtTQWNnQixZQUFZLENBQzFCLEtBQW1CLEVBQ25CLGdCQUFtRDtJQUVuRCxJQUFLLE9BQU8sZ0JBQWdCLEtBQUssVUFBVSxFQUFHO1FBQzVDLE9BQU8sWUFBWSxDQUFFLEtBQUssRUFBRSxDQUFFLE9BQU8sTUFBUSxPQUFPLEdBQUcsZ0JBQWdCLENBQUUsQ0FBRSxDQUFDO0tBQzdFO0lBQ0QsTUFBTSxPQUFPLEdBQUcsZ0JBQTZDLENBQUM7SUFFOUQsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBQ2QsSUFBSSxHQUFHLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUV2QixPQUFRLEtBQUssR0FBRyxHQUFHLEVBQUc7UUFDcEIsTUFBTSxNQUFNLEdBQUcsQ0FBRSxLQUFLLEdBQUcsR0FBRyxLQUFNLENBQUMsQ0FBQztRQUNwQyxNQUFNLGFBQWEsR0FBRyxLQUFLLENBQUUsTUFBTSxDQUFFLENBQUM7UUFFdEMsTUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFFLGFBQWEsQ0FBRSxDQUFDO1FBRS9DLElBQUssYUFBYSxFQUFHO1lBQ25CLEtBQUssR0FBRyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1NBQ3BCO2FBQU07WUFDTCxHQUFHLEdBQUcsTUFBTSxDQUFDO1NBQ2Q7S0FDRjtJQUVELE9BQU8sS0FBSyxDQUFDO0FBQ2Y7O0FDckNBOzs7TUFHYSxXQUFXOzs7Ozs7SUE2RHRCLFlBQW9CLFNBQW9CLEVBQUUsSUFBMkI7UUFDbkUsSUFBSSxDQUFDLFdBQVcsR0FBRyxTQUFTLENBQUM7UUFFN0IsSUFBSSxDQUFDLFdBQVcsQ0FBRSxJQUFJLENBQUUsQ0FBQztLQUMxQjs7OztJQWJELElBQVcsR0FBRztRQUNaLE9BQU8sSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO0tBQ2hDO0lBYU0sUUFBUSxDQUFFLElBQVk7UUFDM0IsSUFBSyxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxFQUFHO1lBQ3ZDLE9BQU8sR0FBRyxDQUFDO1NBQ1o7UUFFRCxJQUFLLElBQUksQ0FBQyxLQUFLLEVBQUc7WUFDaEIsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU8sR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQU0sQ0FBQztZQUM1QyxPQUFPLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBRSxDQUFDLENBQUUsQ0FBQztTQUN6RDthQUFNO1lBQ0wsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO1NBQ25CO0tBQ0Y7Ozs7O0lBTU0sV0FBVyxDQUFFLElBQTJCOztRQUM3QyxJQUFJLENBQUMsSUFBSSxTQUFHLElBQUksQ0FBQyxJQUFJLG1DQUFJLEdBQUcsQ0FBQztRQUM3QixJQUFJLENBQUMsTUFBTSxTQUFHLElBQUksQ0FBQyxNQUFNLG1DQUFJLEdBQUcsQ0FBQztRQUNqQyxJQUFJLENBQUMsS0FBSyxTQUFHLElBQUksQ0FBQyxLQUFLLG1DQUFJLEdBQUcsQ0FBQztRQUMvQixJQUFJLENBQUMsTUFBTSxTQUFHLElBQUksQ0FBQyxNQUFNLG1DQUFJLEdBQUcsQ0FBQztRQUNqQyxJQUFJLENBQUMsS0FBSyxTQUFHLElBQUksQ0FBQyxLQUFLLG1DQUFJLEdBQUcsQ0FBQztRQUMvQixJQUFJLENBQUMsR0FBRyxTQUFHLElBQUksQ0FBQyxHQUFHLG1DQUFJLEdBQUcsQ0FBQztRQUMzQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDeEIsSUFBSyxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksRUFBRztZQUN4QixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUcsQ0FBQztZQUN0RCxJQUFJLENBQUMsTUFBTSxlQUFHLElBQUksQ0FBQyxNQUFNLG1DQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxtQ0FBSSxHQUFHLENBQUM7U0FDdkQ7S0FDRjs7O0FDaEdIOzs7TUFHYSxPQUFPOzs7Ozs7SUFvQ2xCLFlBQW9CLFNBQW9CLEVBQUUsSUFBdUI7Ozs7UUEzQnZELFlBQU8sR0FBa0IsRUFBRSxDQUFDOzs7O1FBSzVCLFlBQU8sR0FBVyxHQUFHLENBQUM7Ozs7UUFLdEIsV0FBTSxHQUFXLENBQUMsUUFBUSxDQUFDOzs7O1FBSzNCLFdBQU0sR0FBVyxDQUFDLENBQUM7Ozs7UUFLbkIsZ0JBQVcsR0FBaUQsRUFBRSxDQUFDO1FBUXZFLElBQUksQ0FBQyxXQUFXLEdBQUcsU0FBUyxDQUFDO1FBRTdCLElBQUksQ0FBQyxXQUFXLENBQUUsSUFBSSxDQUFFLENBQUM7S0FDMUI7Ozs7SUFLRCxJQUFXLFlBQVksS0FBYSxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRTs7OztJQUsxRCxJQUFXLFdBQVcsS0FBYSxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTs7Ozs7SUFNakQsV0FBVyxDQUFFLElBQXVCOztRQUN6QyxJQUFJLENBQUMsT0FBTyxlQUFHLElBQUksQ0FBQyxLQUFLLDBDQUFFLEdBQUcsQ0FBRSxDQUFFLElBQUksS0FBTSxJQUFJLFdBQVcsQ0FBRSxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBRSxvQ0FBTSxFQUFFLENBQUM7S0FDL0Y7Ozs7O0lBTU0sS0FBSztRQUNWLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxRQUFRLENBQUM7UUFDeEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUM7UUFDakIsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7S0FDakI7Ozs7O0lBTU0sU0FBUyxDQUFFLFFBQStDO1FBQy9ELElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFFLFFBQVEsQ0FBRSxDQUFDO0tBQ25DOzs7Ozs7SUFPTSxRQUFRLENBQUUsSUFBWTs7UUFFM0IsSUFBSyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUc7WUFDL0IsT0FBTyxHQUFHLENBQUM7U0FDWjtRQUVELE1BQU0sSUFBSSxHQUFHLFlBQVksQ0FBRSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUUsSUFBSSxNQUFRLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFFLENBQUUsQ0FBQzs7UUFHNUUsSUFBSyxJQUFJLEtBQUssQ0FBQyxFQUFHO1lBQ2hCLE9BQU8sR0FBRyxDQUFDO1NBQ1o7UUFFRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFFLElBQUksR0FBRyxDQUFDLENBQUUsQ0FBQztRQUN0QyxJQUFLLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxFQUFHO1lBQ3JCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBRSxJQUFJLENBQUMsTUFBTSxDQUFFLENBQUM7U0FDckM7YUFBTTtZQUNMLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBRSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBRSxDQUFDO1NBQzFDO0tBQ0Y7Ozs7Ozs7SUFRTSxPQUFPLENBQUUsSUFBWTtRQUMxQixNQUFNLEdBQUcsR0FBNkIsRUFBRSxDQUFDO1FBRXpDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFFN0IsS0FBTSxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUcsRUFBRztZQUN6RCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFDO1lBQy9CLE1BQU0sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUM7WUFDMUMsSUFBSSxPQUFPLEdBQUcsSUFBSSxHQUFHLEtBQUssQ0FBQztZQUUzQixJQUFLLE9BQU8sR0FBRyxHQUFHLEVBQUc7Z0JBQ25CLE1BQU07YUFDUDtpQkFBTTtnQkFDTCxJQUFJLFFBQWdCLENBQUM7Z0JBQ3JCLElBQUksSUFBc0IsQ0FBQztnQkFDM0IsSUFBSSxNQUF3QixDQUFDO2dCQUU3QixJQUFLLE1BQU0sSUFBSSxPQUFPLEVBQUc7b0JBQ3ZCLE9BQU8sR0FBRyxNQUFNLENBQUM7b0JBQ2pCLFFBQVEsR0FBRyxHQUFHLENBQUM7b0JBQ2YsTUFBTSxHQUFHLElBQUksQ0FBQztvQkFFZCxJQUFLLENBQUMsS0FBSyxJQUFJLENBQUMsTUFBTSxFQUFHO3dCQUN2QixJQUFJLENBQUMsTUFBTSxFQUFHLENBQUM7cUJBQ2hCO2lCQUNGO3FCQUFNO29CQUNMLFFBQVEsR0FBRyxNQUFNLEtBQUssR0FBRzswQkFDckIsT0FBTyxHQUFHLE1BQU07MEJBQ2hCLEdBQUcsQ0FBQztpQkFDVDtnQkFFRCxJQUFLLFFBQVEsR0FBRyxLQUFLLEVBQUc7b0JBQ3RCLElBQUksR0FBRyxJQUFJLENBQUM7aUJBQ2I7Z0JBRUQsR0FBRyxDQUFDLElBQUksQ0FBRSxDQUFFLEtBQUssR0FBRyxPQUFPLEVBQUU7d0JBQzNCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBRSxPQUFPLENBQUUsQ0FBQzt3QkFFeEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUUsQ0FBRSxRQUFRLEtBQU0sUUFBUSxDQUFFOzRCQUNsRCxJQUFJOzRCQUNKLE9BQU87NEJBQ1AsS0FBSzs0QkFDTCxHQUFHOzRCQUNILE1BQU07NEJBQ04sS0FBSyxFQUFFLElBQUksQ0FBQyxPQUFPOzRCQUNuQixRQUFROzRCQUNSLElBQUk7NEJBQ0osTUFBTTt5QkFDUCxDQUFFLENBQUUsQ0FBQztxQkFDUCxDQUFFLENBQUUsQ0FBQzthQUNQO1NBQ0Y7UUFFRCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztRQUVuQixPQUFPLEdBQUcsQ0FBQztLQUNaOzs7QUN4S0g7OztNQUdhLEtBQUs7Ozs7OztJQXlDaEIsWUFBb0IsU0FBb0IsRUFBRSxJQUFxQjs7OztRQXBCckQsWUFBTyxHQUFpQixFQUFFLENBQUM7Ozs7UUFLM0IsVUFBSyxHQUFnQixFQUFFLENBQUM7UUFnQmhDLElBQUksQ0FBQyxXQUFXLEdBQUcsU0FBUyxDQUFDO1FBRTdCLElBQUksQ0FBQyxXQUFXLENBQUUsSUFBSSxDQUFFLENBQUM7S0FDMUI7Ozs7SUFkRCxJQUFXLE1BQU07UUFDZixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFFLENBQUMsSUFBSSxDQUFDO0tBQ3JEOzs7OztJQWtCTSxXQUFXLENBQUUsSUFBcUI7O1FBQ3ZDLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUUsQ0FBRSxJQUFJOztZQUFNLFFBQUU7Z0JBQzNDLElBQUksUUFBRSxJQUFJLENBQUUsQ0FBQyxDQUFFLG1DQUFJLEdBQUc7Z0JBQ3RCLEtBQUssUUFBRSxJQUFJLENBQUUsQ0FBQyxDQUFFLG1DQUFJLEdBQUc7Z0JBQ3ZCLE1BQU0sUUFBRSxJQUFJLENBQUUsQ0FBQyxDQUFFLG1DQUFJLEdBQUc7Z0JBQ3hCLE9BQU8sUUFBRSxJQUFJLENBQUUsQ0FBQyxDQUFFLG1DQUFJLEdBQUc7Z0JBQ3pCLE9BQU8sUUFBRSxJQUFJLENBQUUsQ0FBQyxDQUFFLG1DQUFJLEdBQUc7Z0JBQ3pCLFFBQVEsUUFBRSxJQUFJLENBQUUsQ0FBQyxDQUFFLG1DQUFJLEdBQUc7YUFDM0IsRUFBRTtTQUFBLENBQUUsQ0FBQztRQUVOLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO1FBQ2hCLE1BQUEsSUFBSSxDQUFDLEdBQUcsMENBQUUsT0FBTyxDQUFFLENBQUUsRUFBRTs7WUFDckIsSUFBSyxFQUFFLENBQUMsTUFBTSxFQUFHO2dCQUFFLE9BQU87YUFBRTtZQUM1QixJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBRTtnQkFDZixJQUFJLFFBQUUsRUFBRSxDQUFDLElBQUksbUNBQUksR0FBRztnQkFDcEIsTUFBTSxRQUFFLEVBQUUsQ0FBQyxNQUFNLG1DQUFJLEdBQUc7Z0JBQ3hCLEdBQUcsUUFBRSxFQUFFLENBQUMsR0FBRyxtQ0FBSSxDQUFDO2dCQUNoQixHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUc7Z0JBQ1gsTUFBTSxFQUFFLEVBQUUsQ0FBQyxNQUFNO2FBQ2xCLENBQUUsQ0FBQztTQUNMLEVBQUc7UUFFSixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7S0FDaEI7Ozs7SUFLTSxPQUFPO1FBQ1osTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBRSxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFFLEdBQUcsQ0FBQyxDQUFDO1FBRWhGLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxZQUFZLENBQUUsWUFBWSxDQUFFLENBQUM7UUFDakQsSUFBSSxDQUFDLHNCQUFzQixHQUFHLElBQUksVUFBVSxDQUFFLFlBQVksQ0FBRSxDQUFDO1FBRTdELElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUN2QixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7S0FDbkI7Ozs7OztJQU9NLFFBQVEsQ0FBRSxJQUFZO1FBQzNCLElBQUssSUFBSSxHQUFHLEdBQUcsRUFBRzs7WUFFaEIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFFLENBQUMsQ0FBRSxDQUFDO1NBRTNCO2FBQU0sSUFBSyxJQUFJLENBQUMsTUFBTSxJQUFJLElBQUksRUFBRzs7WUFFaEMsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBRSxDQUFDO1NBRWxEO2FBQU07O1lBRUwsTUFBTSxLQUFLLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDO1lBQ2pELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUUsS0FBSyxDQUFFLENBQUM7WUFDbkMsTUFBTSxNQUFNLEdBQUcsS0FBSyxHQUFHLEdBQUcsQ0FBQztZQUUzQixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFFLE1BQU0sQ0FBRSxDQUFDO1lBQ25DLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUUsTUFBTSxHQUFHLENBQUMsQ0FBRSxDQUFDO1lBRXJDLElBQUssSUFBSSxDQUFDLHNCQUFzQixDQUFFLE1BQU0sQ0FBRSxFQUFHOztnQkFFM0MsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBRSxJQUFJLENBQUMsR0FBRyxDQUFFLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQztnQkFDdEQsRUFBRSxHQUFHLEdBQUcsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDO2FBQ3BCO1lBRUQsTUFBTSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSyxNQUFNLENBQUM7WUFFcEMsT0FBTyxDQUFDLENBQUM7U0FFVjtLQUNGOzs7O0lBS1MsZUFBZTtRQUN2QixJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFDO1FBQ2pDLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztRQUNkLEtBQU0sSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUFFLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsS0FBSyxFQUFHLEVBQUc7WUFDL0QsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDO1lBQ3ZCLFFBQVEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFFLEtBQUssR0FBRyxDQUFDLENBQUUsQ0FBQztZQUNyQyxNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUM7WUFDakIsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUUsUUFBUSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBRSxDQUFDO1lBRWxFLElBQUksQ0FBQyxRQUFRLENBQUUsRUFBRSxDQUFFLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQztZQUVsQyxJQUFLLEVBQUUsS0FBSyxLQUFLLElBQUksS0FBSyxLQUFLLENBQUMsRUFBRztnQkFDakMsSUFBSSxDQUFDLHNCQUFzQixDQUFFLEtBQUssR0FBRyxDQUFDLENBQUUsR0FBRyxDQUFDLENBQUM7YUFDOUM7aUJBQU07Z0JBQ0wsS0FBTSxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxFQUFHLEVBQUc7b0JBQ3ZDLE1BQU0sSUFBSSxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQztvQkFDN0MsTUFBTSxLQUFLLEdBQUcsWUFBWSxDQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFFLENBQUM7b0JBQ3BELElBQUksQ0FBQyxRQUFRLENBQUUsQ0FBQyxDQUFFLEdBQUcsS0FBSyxDQUFDO2lCQUM1QjthQUNGO1NBQ0Y7UUFFRCxLQUFNLElBQUksQ0FBQyxHQUFHLEtBQUssR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRyxFQUFHO1lBQ3hELElBQUksQ0FBQyxRQUFRLENBQUUsQ0FBQyxDQUFFLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQztTQUNyQztLQUNGOzs7O0lBS1MsVUFBVTtRQUNsQixLQUFNLElBQUksR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFHLEVBQUc7WUFDbkQsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBRSxHQUFHLENBQUUsQ0FBQztZQUM3QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBRSxFQUFFLENBQUMsR0FBRyxDQUFFLENBQUM7WUFDekQsSUFBSyxDQUFDLEtBQUssRUFBRztnQkFDa0M7b0JBQzVDLE9BQU8sQ0FBQyxJQUFJLENBQUUsMEJBQTJCLEVBQUUsQ0FBQyxHQUFJLEVBQUUsQ0FBRSxDQUFDO2lCQUN0RDtnQkFFRCxTQUFTO2FBQ1Y7WUFFRCxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFFLENBQUM7WUFDbEUsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBRSxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFFLENBQUM7WUFDOUQsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBRSxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsR0FBRyxZQUFZLENBQUUsQ0FBQztZQUNwRSxJQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUc7Z0JBQ2dDO29CQUM1QyxPQUFPLENBQUMsS0FBSyxDQUFFLDRDQUE0QyxDQUFFLENBQUM7aUJBQy9EO2dCQUVELFNBQVM7YUFDVjtZQUVELE1BQU0sVUFBVSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQy9CLE1BQU0sVUFBVSxHQUFHLElBQUksWUFBWSxDQUFFLFVBQVUsQ0FBRSxDQUFDO1lBRWxELE1BQU0sT0FBTyxHQUFjO2dCQUN6QixLQUFLLEVBQUUsRUFBRTtnQkFDVCxFQUFFO2dCQUNGLEVBQUU7Z0JBQ0YsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJO2dCQUNiLEVBQUUsRUFBRSxFQUFFLENBQUMsSUFBSTtnQkFDWCxFQUFFLEVBQUUsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUMsTUFBTTtnQkFDdkIsU0FBUyxFQUFFLEdBQUcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVU7Z0JBQzVDLEtBQUssRUFBRSxHQUFHO2dCQUNWLFFBQVEsRUFBRSxHQUFHO2dCQUNiLE9BQU8sRUFBRSxHQUFHO2dCQUNaLFVBQVUsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVU7Z0JBQ3ZDLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTTtnQkFDakIsTUFBTSxFQUFFLEVBQUUsQ0FBQyxNQUFNO2dCQUNqQixLQUFLLEVBQUUsSUFBSSxDQUFDLFFBQVE7Z0JBQ3BCLG9CQUFvQixFQUFFLElBQUksQ0FBQyxzQkFBc0IsQ0FBRSxFQUFFLENBQUUsS0FBSyxDQUFDO2dCQUM3RCx1QkFBdUIsRUFBRSxDQUFFLG9CQUE2QjtvQkFDdEQsSUFBSSxDQUFDLHNCQUFzQixDQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUUsR0FBRyxvQkFBb0IsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2lCQUM3RTtnQkFDRCxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUUsSUFBSSxDQUFFO2dCQUNwQyxJQUFJLEVBQUUsSUFBSTtnQkFDVixLQUFLLEVBQUUsRUFBRTthQUNWLENBQUM7WUFFRixLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxFQUFFLENBQUMsRUFBRyxFQUFHO2dCQUN0QyxPQUFPLENBQUMsS0FBSyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQ3ZCLE9BQU8sQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQztnQkFDM0QsT0FBTyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFFLENBQUMsR0FBRyxFQUFFLENBQUUsQ0FBQztnQkFDeEMsT0FBTyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUM7Z0JBQ3pDLE9BQU8sQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDO2dCQUMvQyxPQUFPLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFFLENBQUMsR0FBRyxFQUFFLENBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzNFLFVBQVUsQ0FBRSxDQUFDLENBQUUsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFFLE9BQU8sQ0FBRSxDQUFDO2dCQUV4QyxPQUFPLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQzthQUN0QjtZQUVELElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFFLFVBQVUsRUFBRSxFQUFFLENBQUUsQ0FBQztTQUNyQztLQUNGOzs7QUNqT0g7Ozs7O01BS2EsU0FBUztJQStDcEIsWUFDRSxJQUF5QixFQUN6QixVQUE0QixFQUFFOzs7Ozs7Ozs7UUF4Q2hCLFNBQUksR0FBMEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUUsSUFBSSxDQUFFLENBQUM7Ozs7UUFLdkQsV0FBTSxHQUFZLEVBQUUsQ0FBQzs7OztRQUtyQixhQUFRLEdBQWMsRUFBRSxDQUFDOzs7O1FBS3pCLHFCQUFnQixHQUFHLElBQUksR0FBRyxFQUFtQixDQUFDOzs7OztRQU1wRCxXQUFNLEdBQVcsR0FBRyxDQUFDOzs7O1FBS3JCLGNBQVMsR0FBVyxPQUFvQixDQUFDOzs7O1FBS3pDLGlCQUFZLEdBQVcsSUFBSSxDQUFDOzs7O1FBSzVCLG9CQUFlLEdBQXVDLEVBQUUsQ0FBQztRQU1qRSxPQUFPLENBQUMsYUFBYSxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBRSxPQUFPLENBQUMsYUFBYSxDQUFFLENBQUM7UUFDeEUsSUFBSSxDQUFDLFdBQVcsQ0FBRSxJQUFJLENBQUUsQ0FBQztLQUMxQjs7OztJQUtELElBQVcsSUFBSSxLQUFhLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFOzs7O0lBS2pELElBQVcsT0FBTyxLQUFhLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFOzs7O0lBS3ZELElBQVcsVUFBVSxLQUFhLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFOzs7OztJQU10RCxXQUFXLENBQUUsSUFBeUI7UUFDM0MsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBRXBDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDO1FBQ3hCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUNkLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUUsQ0FBRSxJQUFJLEtBQU0sSUFBSSxLQUFLLENBQUUsSUFBSSxFQUFFLElBQUksQ0FBRSxDQUFFLENBQzFELENBQUM7UUFFRixJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLENBQUM7UUFFOUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUM7UUFDMUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQ2hCLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUUsQ0FBRSxDQUFFLElBQUksRUFBRSxJQUFJLENBQUU7WUFDcEMsTUFBTSxPQUFPLEdBQUcsSUFBSSxPQUFPLENBQUUsSUFBSSxFQUFFLElBQUksQ0FBRSxDQUFDO1lBRUk7Z0JBQzVDLElBQUssSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBRSxJQUFJLENBQUUsRUFBRztvQkFDdkMsT0FBTyxDQUFDLElBQUksQ0FBRSx1QkFBd0IsSUFBSyxFQUFFLENBQUUsQ0FBQztpQkFDakQ7YUFDRjtZQUVELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBRSxDQUFDO1lBQzNDLE9BQU8sT0FBTyxDQUFDO1NBQ2hCLENBQUUsQ0FDSixDQUFDO0tBQ0g7Ozs7O0lBTU0sZ0JBQWdCLENBQUUsYUFBK0M7UUFDdEUsTUFBTSxDQUFDLE9BQU8sQ0FBRSxhQUFhLENBQUUsQ0FBQyxPQUFPLENBQUUsQ0FBRSxDQUFFLEVBQUUsRUFBRSxLQUFLLENBQUU7WUFDdEQsSUFBSyxPQUFPLEtBQUssQ0FBQyxJQUFJLEtBQUssVUFBVSxFQUFHO2dCQUNRO29CQUM1QyxJQUFLLElBQUksQ0FBQyxlQUFlLENBQUUsRUFBRSxDQUFFLElBQUksSUFBSSxFQUFHO3dCQUN4QyxPQUFPLENBQUMsSUFBSSxDQUFFLDJDQUE0QyxFQUFHLEVBQUUsQ0FBRSxDQUFDO3FCQUNuRTtpQkFDRjtnQkFFRCxJQUFJLENBQUMsZUFBZSxDQUFFLEVBQUUsQ0FBRSxHQUFHLEtBQUssQ0FBQzthQUNwQztTQUNGLENBQUUsQ0FBQztRQUVKLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztLQUNuQjs7Ozs7O0lBT00sZUFBZSxDQUFFLEVBQVU7UUFDaEMsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFFLEVBQUUsQ0FBRSxJQUFJLElBQUksQ0FBQztLQUMzQzs7Ozs7SUFNTSxRQUFRLENBQUUsS0FBYTtRQUM1QixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUUsS0FBSyxDQUFFLElBQUksSUFBSSxDQUFDO0tBQ3JDOzs7O0lBS00sVUFBVTtRQUNmLE1BQU0sQ0FBQyxNQUFNLENBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLE9BQU8sQ0FBRSxDQUFFLEtBQUssS0FBTSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUUsQ0FBQztLQUN0RTs7Ozs7SUFNTSxLQUFLO1FBQ1YsTUFBTSxDQUFDLE1BQU0sQ0FBRSxJQUFJLENBQUMsUUFBUSxDQUFFLENBQUMsT0FBTyxDQUFFLENBQUUsT0FBTyxLQUFNLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBRSxDQUFDO0tBQzFFOzs7Ozs7SUFPTSxNQUFNLENBQUUsSUFBWTtRQUN6QixNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFFLElBQUksRUFBRSxHQUFHLENBQUUsQ0FBQzs7UUFHaEMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7O1FBR2hCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFFLENBQUUsT0FBTyxLQUFNLE9BQU8sQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFFLENBQUMsSUFBSSxDQUFFLENBQUMsQ0FBRSxDQUFDO1FBQzNGLEtBQUssQ0FBQyxJQUFJLENBQUUsQ0FBRSxDQUFFLENBQUMsQ0FBRSxFQUFFLENBQUUsQ0FBQyxDQUFFLEtBQU0sQ0FBQyxHQUFHLENBQUMsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxDQUFFLENBQUUsQ0FBQyxFQUFFLElBQUksQ0FBRSxLQUFNLElBQUksRUFBRSxDQUFFLENBQUM7S0FDOUU7Ozs7Ozs7SUFRUyxNQUFNLENBQ2QsSUFBWSxFQUNaLFFBQWdEO1FBRWhELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUUsSUFBSSxDQUFFLENBQUM7UUFFSjtZQUM1QyxJQUFLLENBQUMsT0FBTyxFQUFHO2dCQUNkLE1BQU0sSUFBSSxLQUFLLENBQUUsb0JBQXFCLElBQUssRUFBRSxDQUFFLENBQUM7YUFDakQ7U0FDRjtRQUVELElBQUssUUFBUSxFQUFHO1lBQ2QsT0FBUSxDQUFDLFNBQVMsQ0FBRSxRQUFRLENBQUUsQ0FBQztTQUNoQztRQUVELE9BQU8sT0FBUSxDQUFDLFlBQVksQ0FBQztLQUM5Qjs7Ozs7In0=
