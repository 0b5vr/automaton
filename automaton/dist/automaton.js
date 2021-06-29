/*!
 * @fms-cat/automaton v4.2.0
 * Animation engine for creative coding
 *
 * Copyright (c) 2017-2020 FMS_Cat
 * @fms-cat/automaton is distributed under MIT License
 * https://github.com/FMS-Cat/automaton/blob/master/LICENSE
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.AUTOMATON = {}));
}(this, (function (exports) { 'use strict';

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

    exports.Automaton = Automaton;
    exports.Channel = Channel;
    exports.ChannelItem = ChannelItem;
    exports.Curve = Curve;
    exports.bezierEasing = bezierEasing;
    exports.binarySearch = binarySearch;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b21hdG9uLmpzIiwic291cmNlcyI6WyIuLi9zcmMvdXRpbHMvYmV6aWVyRWFzaW5nLnRzIiwiLi4vc3JjL3V0aWxzL2JpbmFyeVNlYXJjaC50cyIsIi4uL3NyYy9DaGFubmVsSXRlbS50cyIsIi4uL3NyYy9DaGFubmVsLnRzIiwiLi4vc3JjL0N1cnZlLnRzIiwiLi4vc3JjL0F1dG9tYXRvbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IEJlemllck5vZGUgfSBmcm9tICcuLi90eXBlcy9CZXppZXJOb2RlJztcblxuaW50ZXJmYWNlIEN1YmljQmV6aWVyQ29udHJvbFBvaW50cyB7XG4gIHAwOiBudW1iZXI7XG4gIHAxOiBudW1iZXI7XG4gIHAyOiBudW1iZXI7XG4gIHAzOiBudW1iZXI7XG59XG5cbmNvbnN0IE5FV1RPTl9JVEVSID0gNDtcbmNvbnN0IE5FV1RPTl9FUFNJTE9OID0gMC4wMDE7XG5jb25zdCBTVUJESVZfSVRFUiA9IDEwO1xuY29uc3QgU1VCRElWX0VQU0lMT04gPSAwLjAwMDAwMTtcbmNvbnN0IFRBQkxFX1NJWkUgPSAyMTtcblxuY29uc3QgX19jYWNoZTogbnVtYmVyW10gPSBbXTtcblxuZnVuY3Rpb24gY2xhbXAoIHg6IG51bWJlciwgbWluOiBudW1iZXIsIG1heDogbnVtYmVyICk6IG51bWJlciB7XG4gIHJldHVybiBNYXRoLm1pbiggTWF0aC5tYXgoIHgsIG1pbiApLCBtYXggKTtcbn1cblxuLypcbiAqICgxLXQpKDEtdCkoMS10KSBhMCA9ICgxLTJ0K3R0KSgxLXQpIGEwXG4gKiAgICAgICAgICAgICAgICAgICAgPSAoMS10LTJ0KzJ0dCt0dC10dHQpIGEwXG4gKiAgICAgICAgICAgICAgICAgICAgPSAoMS0zdCszdHQtdHR0KSBhMFxuICpcbiAqIDMoMS10KSgxLXQpdCBhMSA9IDMoMS0ydCt0dCl0IGExXG4gKiAgICAgICAgICAgICAgICAgPSAoM3QtNnR0KzN0dHQpIGExXG4gKlxuICogMygxLXQpdHQgYTIgPSAoM3R0LTN0dHQpIGEyXG4gKlxuICogdHR0IGEzXG4gKlxuICogKGEzLTNhMiszYTEtYTApIHR0dCArICgzYTItNmExKzNhMCkgdHQgKyAoM2ExLTNhMCkgdCArIGEwXG4gKi9cblxuZnVuY3Rpb24gQSggY3BzOiBDdWJpY0JlemllckNvbnRyb2xQb2ludHMgKTogbnVtYmVyIHtcbiAgcmV0dXJuIGNwcy5wMyAtIDMuMCAqIGNwcy5wMiArIDMuMCAqIGNwcy5wMSAtIGNwcy5wMDtcbn1cblxuZnVuY3Rpb24gQiggY3BzOiBDdWJpY0JlemllckNvbnRyb2xQb2ludHMgKTogbnVtYmVyIHtcbiAgcmV0dXJuIDMuMCAqIGNwcy5wMiAtIDYuMCAqIGNwcy5wMSArIDMuMCAqIGNwcy5wMDtcbn1cblxuZnVuY3Rpb24gQyggY3BzOiBDdWJpY0JlemllckNvbnRyb2xQb2ludHMgKTogbnVtYmVyIHtcbiAgcmV0dXJuIDMuMCAqIGNwcy5wMSAtIDMuMCAqIGNwcy5wMDtcbn1cblxuZnVuY3Rpb24gY3ViaWNCZXppZXIoIHQ6IG51bWJlciwgY3BzOiBDdWJpY0JlemllckNvbnRyb2xQb2ludHMgKTogbnVtYmVyIHtcbiAgcmV0dXJuICggKCBBKCBjcHMgKSAqIHQgKyBCKCBjcHMgKSApICogdCArIEMoIGNwcyApICkgKiB0ICsgY3BzLnAwO1xufVxuXG5mdW5jdGlvbiBkZWx0YUN1YmljQmV6aWVyKCB0OiBudW1iZXIsIGNwczogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzICk6IG51bWJlciB7XG4gIHJldHVybiAoIDMuMCAqIEEoIGNwcyApICogdCArIDIuMCAqIEIoIGNwcyApICkgKiB0ICsgQyggY3BzICk7XG59XG5cbmZ1bmN0aW9uIHN1YmRpdiggeDogbnVtYmVyLCBhOiBudW1iZXIsIGI6IG51bWJlciwgY3BzOiBDdWJpY0JlemllckNvbnRyb2xQb2ludHMgKTogbnVtYmVyIHtcbiAgbGV0IGNhbmRpZGF0ZVggPSAwO1xuICBsZXQgdCA9IDA7XG5cbiAgZm9yICggbGV0IGkgPSAwOyBpIDwgU1VCRElWX0lURVI7IGkgKysgKSB7XG4gICAgdCA9IGEgKyAoIGIgLSBhICkgLyAyLjA7XG4gICAgY2FuZGlkYXRlWCA9IGN1YmljQmV6aWVyKCB0LCBjcHMgKSAtIHg7XG4gICAgKCAwLjAgPCBjYW5kaWRhdGVYICkgPyAoIGIgPSB0ICkgOiAoIGEgPSB0ICk7XG4gICAgaWYgKCBTVUJESVZfRVBTSUxPTiA8IE1hdGguYWJzKCBjYW5kaWRhdGVYICkgKSB7IGJyZWFrOyB9XG4gIH1cblxuICByZXR1cm4gdDtcbn1cblxuZnVuY3Rpb24gbmV3dG9uKCB4OiBudW1iZXIsIHQ6IG51bWJlciwgY3BzOiBDdWJpY0JlemllckNvbnRyb2xQb2ludHMgKTogbnVtYmVyIHtcbiAgZm9yICggbGV0IGkgPSAwOyBpIDwgTkVXVE9OX0lURVI7IGkgKysgKSB7XG4gICAgY29uc3QgZCA9IGRlbHRhQ3ViaWNCZXppZXIoIHQsIGNwcyApO1xuICAgIGlmICggZCA9PT0gMC4wICkgeyByZXR1cm4gdDsgfVxuICAgIGNvbnN0IGN4ID0gY3ViaWNCZXppZXIoIHQsIGNwcyApIC0geDtcbiAgICB0IC09IGN4IC8gZDtcbiAgfVxuXG4gIHJldHVybiB0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmF3QmV6aWVyRWFzaW5nKFxuICBjcHN4OiBDdWJpY0JlemllckNvbnRyb2xQb2ludHMsXG4gIGNwc3k6IEN1YmljQmV6aWVyQ29udHJvbFBvaW50cyxcbiAgeDogbnVtYmVyXG4pOiBudW1iZXIge1xuICBpZiAoIHggPD0gY3BzeC5wMCApIHsgcmV0dXJuIGNwc3kucDA7IH0gLy8gY2xhbXBlZFxuICBpZiAoIGNwc3gucDMgPD0geCApIHsgcmV0dXJuIGNwc3kucDM7IH0gLy8gY2xhbXBlZFxuXG4gIGNwc3gucDEgPSBjbGFtcCggY3BzeC5wMSwgY3BzeC5wMCwgY3BzeC5wMyApO1xuICBjcHN4LnAyID0gY2xhbXAoIGNwc3gucDIsIGNwc3gucDAsIGNwc3gucDMgKTtcblxuICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBUQUJMRV9TSVpFOyBpICsrICkge1xuICAgIF9fY2FjaGVbIGkgXSA9IGN1YmljQmV6aWVyKCBpIC8gKCBUQUJMRV9TSVpFIC0gMS4wICksIGNwc3ggKTtcbiAgfVxuXG4gIGxldCBzYW1wbGUgPSAwO1xuICBmb3IgKCBsZXQgaSA9IDE7IGkgPCBUQUJMRV9TSVpFOyBpICsrICkge1xuICAgIHNhbXBsZSA9IGkgLSAxO1xuICAgIGlmICggeCA8IF9fY2FjaGVbIGkgXSApIHsgYnJlYWs7IH1cbiAgfVxuXG4gIGNvbnN0IGRpc3QgPSAoIHggLSBfX2NhY2hlWyBzYW1wbGUgXSApIC8gKCBfX2NhY2hlWyBzYW1wbGUgKyAxIF0gLSBfX2NhY2hlWyBzYW1wbGUgXSApO1xuICBsZXQgdCA9ICggc2FtcGxlICsgZGlzdCApIC8gKCBUQUJMRV9TSVpFIC0gMSApO1xuICBjb25zdCBkID0gZGVsdGFDdWJpY0JlemllciggdCwgY3BzeCApIC8gKCBjcHN4LnAzIC0gY3BzeC5wMCApO1xuXG4gIGlmICggTkVXVE9OX0VQU0lMT04gPD0gZCApIHtcbiAgICB0ID0gbmV3dG9uKCB4LCB0LCBjcHN4ICk7XG4gIH0gZWxzZSBpZiAoIGQgIT09IDAuMCApIHtcbiAgICB0ID0gc3ViZGl2KCB4LCAoIHNhbXBsZSApIC8gKCBUQUJMRV9TSVpFIC0gMSApLCAoIHNhbXBsZSArIDEuMCApIC8gKCBUQUJMRV9TSVpFIC0gMSApLCBjcHN4ICk7XG4gIH1cblxuICByZXR1cm4gY3ViaWNCZXppZXIoIHQsIGNwc3kgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJlemllckVhc2luZyggbm9kZTA6IEJlemllck5vZGUsIG5vZGUxOiBCZXppZXJOb2RlLCB0aW1lOiBudW1iZXIgKTogbnVtYmVyIHtcbiAgcmV0dXJuIHJhd0JlemllckVhc2luZyhcbiAgICB7XG4gICAgICBwMDogbm9kZTAudGltZSxcbiAgICAgIHAxOiBub2RlMC50aW1lICsgbm9kZTAub3V0VGltZSxcbiAgICAgIHAyOiBub2RlMS50aW1lICsgbm9kZTEuaW5UaW1lLFxuICAgICAgcDM6IG5vZGUxLnRpbWVcbiAgICB9LFxuICAgIHtcbiAgICAgIHAwOiBub2RlMC52YWx1ZSxcbiAgICAgIHAxOiBub2RlMC52YWx1ZSArIG5vZGUwLm91dFZhbHVlLFxuICAgICAgcDI6IG5vZGUxLnZhbHVlICsgbm9kZTEuaW5WYWx1ZSxcbiAgICAgIHAzOiBub2RlMS52YWx1ZVxuICAgIH0sXG4gICAgdGltZVxuICApO1xufVxuIiwiLy8gaHR0cHM6Ly9naXRodWIuY29tL0ZNUy1DYXQvZXhwZXJpbWVudGFsLW5wbS9ibG9iL2NmNjg1ODQ2NDg4ZWQzNzY1ZTBhYmY2OGM4ZjZjZDQ5MTYwNDljZmEvc3JjL2FsZ29yaXRobS9iaW5hcnlTZWFyY2gudHNcblxuLyoqXG4gKiBMb29rIGZvciBhbiBpbmRleCBmcm9tIGEgc29ydGVkIGxpc3QgdXNpbmcgYmluYXJ5IHNlYXJjaC5cbiAqXG4gKiBJZiB5b3UgZG9uJ3QgcHJvdmlkZSBhIGNvbXBhcmUgZnVuY3Rpb24sIGl0IHdpbGwgbG9vayBmb3IgKip0aGUgZmlyc3Qgc2FtZSB2YWx1ZSoqIGl0IGNhbiBmaW5kLlxuICogSWYgaXQgY2Fubm90IGZpbmQgYW4gZXhhY3RseSBtYXRjaGluZyB2YWx1ZSwgaXQgY2FuIHJldHVybiBOIHdoZXJlIHRoZSBsZW5ndGggb2YgZ2l2ZW4gYXJyYXkgaXMgTi5cbiAqXG4gKiBAcGFyYW0gYXJyYXkgQSBzb3J0ZWQgYXJyYXlcbiAqIEBwYXJhbSBjb21wYXJlIE1ha2UgdGhpcyBmdW5jdGlvbiByZXR1cm4gYGZhbHNlYCBpZiB5b3Ugd2FudCB0byBwb2ludCByaWdodCBzaWRlIG9mIGdpdmVuIGVsZW1lbnQsIGB0cnVlYCBpZiB5b3Ugd2FudCB0byBwb2ludCBsZWZ0IHNpZGUgb2YgZ2l2ZW4gZWxlbWVudC5cbiAqIEByZXR1cm5zIEFuIGluZGV4IGZvdW5kXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5hcnlTZWFyY2g8VD4oIGFycmF5OiBBcnJheUxpa2U8VD4sIGVsZW1lbnQ6IFQgKTogbnVtYmVyO1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmFyeVNlYXJjaDxUPiggYXJyYXk6IEFycmF5TGlrZTxUPiwgY29tcGFyZTogKCBlbGVtZW50OiBUICkgPT4gYm9vbGVhbiApOiBudW1iZXI7XG5leHBvcnQgZnVuY3Rpb24gYmluYXJ5U2VhcmNoPFQ+KFxuICBhcnJheTogQXJyYXlMaWtlPFQ+LFxuICBlbGVtZW50T3JDb21wYXJlOiBUIHwgKCAoIGVsZW1lbnQ6IFQgKSA9PiBib29sZWFuICksXG4pOiBudW1iZXIge1xuICBpZiAoIHR5cGVvZiBlbGVtZW50T3JDb21wYXJlICE9PSAnZnVuY3Rpb24nICkge1xuICAgIHJldHVybiBiaW5hcnlTZWFyY2goIGFycmF5LCAoIGVsZW1lbnQgKSA9PiAoIGVsZW1lbnQgPCBlbGVtZW50T3JDb21wYXJlICkgKTtcbiAgfVxuICBjb25zdCBjb21wYXJlID0gZWxlbWVudE9yQ29tcGFyZSBhcyAoIGVsZW1lbnQ6IFQgKSA9PiBib29sZWFuO1xuXG4gIGxldCBzdGFydCA9IDA7XG4gIGxldCBlbmQgPSBhcnJheS5sZW5ndGg7XG5cbiAgd2hpbGUgKCBzdGFydCA8IGVuZCApIHtcbiAgICBjb25zdCBjZW50ZXIgPSAoIHN0YXJ0ICsgZW5kICkgPj4gMTtcbiAgICBjb25zdCBjZW50ZXJFbGVtZW50ID0gYXJyYXlbIGNlbnRlciBdO1xuXG4gICAgY29uc3QgY29tcGFyZVJlc3VsdCA9IGNvbXBhcmUoIGNlbnRlckVsZW1lbnQgKTtcblxuICAgIGlmICggY29tcGFyZVJlc3VsdCApIHtcbiAgICAgIHN0YXJ0ID0gY2VudGVyICsgMTtcbiAgICB9IGVsc2Uge1xuICAgICAgZW5kID0gY2VudGVyO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBzdGFydDtcbn1cbiIsImltcG9ydCB7IEF1dG9tYXRvbiwgQ3VydmUgfSBmcm9tICcuJztcbmltcG9ydCB0eXBlIHsgU2VyaWFsaXplZENoYW5uZWxJdGVtIH0gZnJvbSAnLi90eXBlcy9TZXJpYWxpemVkQ2hhbm5lbEl0ZW0nO1xuXG4vKipcbiAqIFJlcHJlc2VudHMgYW4gaXRlbSBvZiBhIFtbQ2hhbm5lbF1dLlxuICovXG5leHBvcnQgY2xhc3MgQ2hhbm5lbEl0ZW0ge1xuICAvKipcbiAgICogVGhlIHBhcmVudCBhdXRvbWF0b24uXG4gICAqL1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgX19hdXRvbWF0b246IEF1dG9tYXRvbjtcblxuICAvKipcbiAgICogQmVnaW5uaW5nIHRpbWVwb2ludCBvZiB0aGUgaXRlbS5cbiAgICovXG4gIHB1YmxpYyB0aW1lITogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBMZW5ndGggb2YgdGhlIGl0ZW0uXG4gICAqL1xuICBwdWJsaWMgbGVuZ3RoITogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBWYWx1ZSBvZiB0aGUgaXRlbS5cbiAgICovXG4gIHB1YmxpYyB2YWx1ZSE6IG51bWJlcjtcblxuICAvKipcbiAgICogV2hldGhlciByZXNldCBjaGFubmVscyB2YWx1ZSB0byB6ZXJvIGF0IHRoZSBlbmQgb2YgdGhpcyBpdGVtIG9yIG5vdC5cbiAgICovXG4gIHB1YmxpYyByZXNldD86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFRoaXMgd2lsbCBvbmx5IG1ha2Ugc2Vuc2Ugd2hlbiB7QGxpbmsgY3VydmV9IGlzIHNwZWNpZmllZC5cbiAgICogVGhlIHRpbWUgb2Zmc2V0IG9mIHRoZSBpdGVtLlxuICAgKi9cbiAgcHVibGljIG9mZnNldCE6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhpcyB3aWxsIG9ubHkgbWFrZSBzZW5zZSB3aGVuIHtAbGluayBjdXJ2ZX0gaXMgc3BlY2lmaWVkLlxuICAgKiBUaGUgc3BlZWQgcmF0ZSBvZiB0aGUgaXRlbS5cbiAgICovXG4gIHB1YmxpYyBzcGVlZCE6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhpcyB3aWxsIG9ubHkgbWFrZSBzZW5zZSB3aGVuIHtAbGluayBjdXJ2ZX0gaXMgc3BlY2lmaWVkLlxuICAgKiBUaGUgc2NhbGUgb2YgdGhlIGl0ZW0gaW4gdGhlIHZhbHVlIGF4aXMuXG4gICAqL1xuICBwdWJsaWMgYW1wITogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgY3VydmUgb2YgdGhlIGl0ZW0uXG4gICAqL1xuICBwdWJsaWMgY3VydmU/OiBDdXJ2ZTtcblxuICAvKipcbiAgICogRW5kaW5nIHRpbWVwb2ludCBvZiB0aGUgaXRlbS5cbiAgICovXG4gIHB1YmxpYyBnZXQgZW5kKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMudGltZSArIHRoaXMubGVuZ3RoO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yIG9mIHRoZSBbW0NoYW5uZWxJdGVtXV0uXG4gICAqIEBwYXJhbSBhdXRvbWF0b24gUGFyZW50IGF1dG9tYXRvblxuICAgKiBAcGFyYW0gZGF0YSBEYXRhIG9mIHRoZSBpdGVtXG4gICAqL1xuICBwdWJsaWMgY29uc3RydWN0b3IoIGF1dG9tYXRvbjogQXV0b21hdG9uLCBkYXRhOiBTZXJpYWxpemVkQ2hhbm5lbEl0ZW0gKSB7XG4gICAgdGhpcy5fX2F1dG9tYXRvbiA9IGF1dG9tYXRvbjtcblxuICAgIHRoaXMuZGVzZXJpYWxpemUoIGRhdGEgKTtcbiAgfVxuXG4gIHB1YmxpYyBnZXRWYWx1ZSggdGltZTogbnVtYmVyICk6IG51bWJlciB7XG4gICAgaWYgKCB0aGlzLnJlc2V0ICYmIHRoaXMubGVuZ3RoIDw9IHRpbWUgKSB7XG4gICAgICByZXR1cm4gMC4wO1xuICAgIH1cblxuICAgIGlmICggdGhpcy5jdXJ2ZSApIHtcbiAgICAgIGNvbnN0IHQgPSB0aGlzLm9mZnNldCEgKyB0aW1lICogdGhpcy5zcGVlZCE7XG4gICAgICByZXR1cm4gdGhpcy52YWx1ZSArIHRoaXMuYW1wICogdGhpcy5jdXJ2ZS5nZXRWYWx1ZSggdCApO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy52YWx1ZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRGVzZXJpYWxpemUgYSBzZXJpYWxpemVkIGRhdGEgb2YgaXRlbSBmcm9tIFtbU2VyaWFsaXplZENoYW5uZWxJdGVtXV0uXG4gICAqIEBwYXJhbSBkYXRhIEEgc2VyaWFsaXplZCBpdGVtLlxuICAgKi9cbiAgcHVibGljIGRlc2VyaWFsaXplKCBkYXRhOiBTZXJpYWxpemVkQ2hhbm5lbEl0ZW0gKTogdm9pZCB7XG4gICAgdGhpcy50aW1lID0gZGF0YS50aW1lID8/IDAuMDtcbiAgICB0aGlzLmxlbmd0aCA9IGRhdGEubGVuZ3RoID8/IDAuMDtcbiAgICB0aGlzLnZhbHVlID0gZGF0YS52YWx1ZSA/PyAwLjA7XG4gICAgdGhpcy5vZmZzZXQgPSBkYXRhLm9mZnNldCA/PyAwLjA7XG4gICAgdGhpcy5zcGVlZCA9IGRhdGEuc3BlZWQgPz8gMS4wO1xuICAgIHRoaXMuYW1wID0gZGF0YS5hbXAgPz8gMS4wO1xuICAgIHRoaXMucmVzZXQgPSBkYXRhLnJlc2V0O1xuICAgIGlmICggZGF0YS5jdXJ2ZSAhPSBudWxsICkge1xuICAgICAgdGhpcy5jdXJ2ZSA9IHRoaXMuX19hdXRvbWF0b24uZ2V0Q3VydmUoIGRhdGEuY3VydmUgKSE7XG4gICAgICB0aGlzLmxlbmd0aCA9IGRhdGEubGVuZ3RoID8/IHRoaXMuY3VydmUubGVuZ3RoID8/IDAuMDtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IEF1dG9tYXRvbiB9IGZyb20gJy4vQXV0b21hdG9uJztcbmltcG9ydCB7IENoYW5uZWxJdGVtIH0gZnJvbSAnLi9DaGFubmVsSXRlbSc7XG5pbXBvcnQgeyBiaW5hcnlTZWFyY2ggfSBmcm9tICcuL3V0aWxzL2JpbmFyeVNlYXJjaCc7XG5pbXBvcnQgdHlwZSB7IENoYW5uZWxVcGRhdGVFdmVudCB9IGZyb20gJy4vdHlwZXMvQ2hhbm5lbFVwZGF0ZUV2ZW50JztcbmltcG9ydCB0eXBlIHsgU2VyaWFsaXplZENoYW5uZWwgfSBmcm9tICcuL3R5cGVzL1NlcmlhbGl6ZWRDaGFubmVsJztcblxuLyoqXG4gKiBJdCByZXByZXNlbnRzIGEgY2hhbm5lbCBvZiBBdXRvbWF0b24uXG4gKi9cbmV4cG9ydCBjbGFzcyBDaGFubmVsIHtcbiAgLyoqXG4gICAqIFRoZSBwYXJlbnQgYXV0b21hdG9uLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fYXV0b21hdG9uOiBBdXRvbWF0b247XG5cbiAgLyoqXG4gICAqIExpc3Qgb2YgY2hhbm5lbCBpdGVtcy5cbiAgICovXG4gIHByb3RlY3RlZCBfX2l0ZW1zOiBDaGFubmVsSXRlbVtdID0gW107XG5cbiAgLyoqXG4gICAqIEEgY2FjaGUgb2YgbGFzdCBjYWxjdWxhdGVkIHZhbHVlLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fdmFsdWU6IG51bWJlciA9IDAuMDtcblxuICAvKipcbiAgICogVGhlIHRpbWUgdGhhdCB3YXMgdXNlZCBmb3IgdGhlIGNhbGN1bGF0aW9uIG9mIFtbX19sYXN0VmFsdWVdXS5cbiAgICovXG4gIHByb3RlY3RlZCBfX3RpbWU6IG51bWJlciA9IC1JbmZpbml0eTtcblxuICAvKipcbiAgICogVGhlIGluZGV4IG9mIFtbX19pdGVtc11dIGl0IHNob3VsZCBldmFsdWF0ZSBuZXh0LlxuICAgKi9cbiAgcHJvdGVjdGVkIF9faGVhZDogbnVtYmVyID0gMDtcblxuICAvKipcbiAgICogQW4gYXJyYXkgb2YgbGlzdGVuZXJzLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fbGlzdGVuZXJzOiBBcnJheTwoIGV2ZW50OiBDaGFubmVsVXBkYXRlRXZlbnQgKSA9PiB2b2lkPiA9IFtdO1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RvciBvZiB0aGUgW1tDaGFubmVsXV0uXG4gICAqIEBwYXJhbSBhdXRvbWF0b24gUGFyZW50IGF1dG9tYXRvblxuICAgKiBAcGFyYW0gZGF0YSBEYXRhIG9mIHRoZSBjaGFubmVsXG4gICAqL1xuICBwdWJsaWMgY29uc3RydWN0b3IoIGF1dG9tYXRvbjogQXV0b21hdG9uLCBkYXRhOiBTZXJpYWxpemVkQ2hhbm5lbCApIHtcbiAgICB0aGlzLl9fYXV0b21hdG9uID0gYXV0b21hdG9uO1xuXG4gICAgdGhpcy5kZXNlcmlhbGl6ZSggZGF0YSApO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgY2FjaGUgb2YgbGFzdCBjYWxjdWxhdGVkIHZhbHVlLlxuICAgKi9cbiAgcHVibGljIGdldCBjdXJyZW50VmFsdWUoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX192YWx1ZTsgfVxuXG4gIC8qKlxuICAgKiBUaGUgdGltZSB0aGF0IHdhcyB1c2VkIGZvciB0aGUgY2FsY3VsYXRpb24gb2YgW1tfX2xhc3RWYWx1ZV1dLlxuICAgKi9cbiAgcHVibGljIGdldCBjdXJyZW50VGltZSgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fX3RpbWU7IH1cblxuICAvKipcbiAgICogTG9hZCBhIHNlcmlhbGl6ZWQgZGF0YSBvZiBhIGNoYW5uZWwuXG4gICAqIEBwYXJhbSBkYXRhIERhdGEgb2YgYSBjaGFubmVsXG4gICAqL1xuICBwdWJsaWMgZGVzZXJpYWxpemUoIGRhdGE6IFNlcmlhbGl6ZWRDaGFubmVsICk6IHZvaWQge1xuICAgIHRoaXMuX19pdGVtcyA9IGRhdGEuaXRlbXM/Lm1hcCggKCBpdGVtICkgPT4gbmV3IENoYW5uZWxJdGVtKCB0aGlzLl9fYXV0b21hdG9uLCBpdGVtICkgKSA/PyBbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgaW50ZXJuYWwgc3RhdGVzLlxuICAgKiBDYWxsIHRoaXMgbWV0aG9kIHdoZW4geW91IHNlZWsgdGhlIHRpbWUuXG4gICAqL1xuICBwdWJsaWMgcmVzZXQoKTogdm9pZCB7XG4gICAgdGhpcy5fX3RpbWUgPSAtSW5maW5pdHk7XG4gICAgdGhpcy5fX3ZhbHVlID0gMDtcbiAgICB0aGlzLl9faGVhZCA9IDA7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGEgbmV3IGxpc3RlbmVyIHRoYXQgcmVjZWl2ZXMgYSBbW0NoYW5uZWxVcGRhdGVFdmVudF1dIHdoZW4gYW4gdXBkYXRlIGlzIGhhcHBlbmVkLlxuICAgKiBAcGFyYW0gbGlzdGVuZXIgQSBzdWJzY3JpYmluZyBsaXN0ZW5lclxuICAgKi9cbiAgcHVibGljIHN1YnNjcmliZSggbGlzdGVuZXI6ICggZXZlbnQ6IENoYW5uZWxVcGRhdGVFdmVudCApID0+IHZvaWQgKTogdm9pZCB7XG4gICAgdGhpcy5fX2xpc3RlbmVycy5wdXNoKCBsaXN0ZW5lciApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiB0aGUgdmFsdWUgb2Ygc3BlY2lmaWVkIHRpbWUgcG9pbnQuXG4gICAqIEBwYXJhbSB0aW1lIFRpbWUgYXQgdGhlIHBvaW50IHlvdSB3YW50IHRvIGdyYWIgdGhlIHZhbHVlLlxuICAgKiBAcmV0dXJucyBSZXN1bHQgdmFsdWVcbiAgICovXG4gIHB1YmxpYyBnZXRWYWx1ZSggdGltZTogbnVtYmVyICk6IG51bWJlciB7XG4gICAgLy8gbm8gaXRlbXM/Pz8gZGFtblxuICAgIGlmICggdGhpcy5fX2l0ZW1zLmxlbmd0aCA9PT0gMCApIHtcbiAgICAgIHJldHVybiAwLjA7XG4gICAgfVxuXG4gICAgY29uc3QgbmV4dCA9IGJpbmFyeVNlYXJjaCggdGhpcy5fX2l0ZW1zLCAoIGl0ZW0gKSA9PiAoIGl0ZW0udGltZSA8IHRpbWUgKSApO1xuXG4gICAgLy8gaXQncyB0aGUgZmlyc3Qgb25lIVxuICAgIGlmICggbmV4dCA9PT0gMCApIHtcbiAgICAgIHJldHVybiAwLjA7XG4gICAgfVxuXG4gICAgY29uc3QgaXRlbSA9IHRoaXMuX19pdGVtc1sgbmV4dCAtIDEgXTtcbiAgICBpZiAoIGl0ZW0uZW5kIDwgdGltZSApIHtcbiAgICAgIHJldHVybiBpdGVtLmdldFZhbHVlKCBpdGVtLmxlbmd0aCApO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gaXRlbS5nZXRWYWx1ZSggdGltZSAtIGl0ZW0udGltZSApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIG1ldGhvZCBpcyBpbnRlbmRlZCB0byBiZSB1c2VkIGJ5IFtbQXV0b21hdG9uLnVwZGF0ZV1dLlxuICAgKiBDb25zdW1lIGFuZCByZXR1cm4gaXRlbXMuXG4gICAqIEBwYXJhbSB0aW1lIFRoZSBjdXJyZW50IHRpbWUgb2YgdGhlIHBhcmVudCBbW0F1dG9tYXRvbl1dXG4gICAqIEByZXR1cm5zIEFycmF5IG9mIHR1cGxlcywgWyB0aW1pbmcgb2YgdGhlIGV2ZW50LCBhIGZ1bmN0aW9uIHRoYXQgZXhlY3V0ZSB0aGUgZXZlbnQgXVxuICAgKi9cbiAgcHVibGljIGNvbnN1bWUoIHRpbWU6IG51bWJlciApOiBbIHRpbWU6IG51bWJlciwgdXBkYXRlOiAoKSA9PiB2b2lkIF1bXSB7XG4gICAgY29uc3QgcmV0OiBbIG51bWJlciwgKCkgPT4gdm9pZCBdW10gPSBbXTtcblxuICAgIGNvbnN0IHByZXZUaW1lID0gdGhpcy5fX3RpbWU7XG5cbiAgICBmb3IgKCBsZXQgaSA9IHRoaXMuX19oZWFkOyBpIDwgdGhpcy5fX2l0ZW1zLmxlbmd0aDsgaSArKyApIHtcbiAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLl9faXRlbXNbIGkgXTtcbiAgICAgIGNvbnN0IHsgdGltZTogYmVnaW4sIGVuZCwgbGVuZ3RoIH0gPSBpdGVtO1xuICAgICAgbGV0IGVsYXBzZWQgPSB0aW1lIC0gYmVnaW47XG5cbiAgICAgIGlmICggZWxhcHNlZCA8IDAuMCApIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgcHJvZ3Jlc3M6IG51bWJlcjtcbiAgICAgICAgbGV0IGluaXQ6IHRydWUgfCB1bmRlZmluZWQ7XG4gICAgICAgIGxldCB1bmluaXQ6IHRydWUgfCB1bmRlZmluZWQ7XG5cbiAgICAgICAgaWYgKCBsZW5ndGggPD0gZWxhcHNlZCApIHtcbiAgICAgICAgICBlbGFwc2VkID0gbGVuZ3RoO1xuICAgICAgICAgIHByb2dyZXNzID0gMS4wO1xuICAgICAgICAgIHVuaW5pdCA9IHRydWU7XG5cbiAgICAgICAgICBpZiAoIGkgPT09IHRoaXMuX19oZWFkICkge1xuICAgICAgICAgICAgdGhpcy5fX2hlYWQgKys7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHByb2dyZXNzID0gbGVuZ3RoICE9PSAwLjBcbiAgICAgICAgICAgID8gZWxhcHNlZCAvIGxlbmd0aFxuICAgICAgICAgICAgOiAxLjA7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHByZXZUaW1lIDwgYmVnaW4gKSB7XG4gICAgICAgICAgaW5pdCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXQucHVzaCggWyBiZWdpbiArIGVsYXBzZWQsICgpID0+IHtcbiAgICAgICAgICB0aGlzLl9fdmFsdWUgPSBpdGVtLmdldFZhbHVlKCBlbGFwc2VkICk7XG5cbiAgICAgICAgICB0aGlzLl9fbGlzdGVuZXJzLmZvckVhY2goICggbGlzdGVuZXIgKSA9PiBsaXN0ZW5lcigge1xuICAgICAgICAgICAgdGltZSxcbiAgICAgICAgICAgIGVsYXBzZWQsXG4gICAgICAgICAgICBiZWdpbixcbiAgICAgICAgICAgIGVuZCxcbiAgICAgICAgICAgIGxlbmd0aCxcbiAgICAgICAgICAgIHZhbHVlOiB0aGlzLl9fdmFsdWUsXG4gICAgICAgICAgICBwcm9ncmVzcyxcbiAgICAgICAgICAgIGluaXQsXG4gICAgICAgICAgICB1bmluaXQsXG4gICAgICAgICAgfSApICk7XG4gICAgICAgIH0gXSApO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX190aW1lID0gdGltZTtcblxuICAgIHJldHVybiByZXQ7XG4gIH1cbn1cbiIsImltcG9ydCB7IEF1dG9tYXRvbiB9IGZyb20gJy4vQXV0b21hdG9uJztcbmltcG9ydCB7IGJlemllckVhc2luZyB9IGZyb20gJy4vdXRpbHMvYmV6aWVyRWFzaW5nJztcbmltcG9ydCB0eXBlIHsgQmV6aWVyTm9kZSB9IGZyb20gJy4vdHlwZXMvQmV6aWVyTm9kZSc7XG5pbXBvcnQgdHlwZSB7IEZ4Q29udGV4dCB9IGZyb20gJy4vdHlwZXMvRnhDb250ZXh0JztcbmltcG9ydCB0eXBlIHsgRnhTZWN0aW9uIH0gZnJvbSAnLi90eXBlcy9GeFNlY3Rpb24nO1xuaW1wb3J0IHR5cGUgeyBTZXJpYWxpemVkQ3VydmUgfSBmcm9tICcuL3R5cGVzL1NlcmlhbGl6ZWRDdXJ2ZSc7XG5cbi8qKlxuICogSXQgcmVwcmVzZW50cyBhIGN1cnZlIG9mIEF1dG9tYXRvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIEN1cnZlIHtcbiAgLyoqXG4gICAqIFRoZSBwYXJlbnQgYXV0b21hdG9uLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fYXV0b21hdG9uOiBBdXRvbWF0b247XG5cbiAgLyoqXG4gICAqIEFuIGFycmF5IG9mIHByZWNhbGN1bGF0ZWQgdmFsdWUuXG4gICAqIEl0cyBsZW5ndGggaXMgc2FtZSBhcyBgY3VydmUuX19hdXRvbWF0b24ucmVzb2x1dGlvbiAqIGN1cnZlLl9fYXV0b21hdG9uLmxlbmd0aCArIDFgLlxuICAqL1xuICBwcm90ZWN0ZWQgX192YWx1ZXMhOiBGbG9hdDMyQXJyYXk7XG5cbiAgLyoqXG4gICAqIEFuIGFycmF5IG9mIGJvb2wgd2hlcmUgeW91IGRvIG5vdCB3YW50IHRvIGludGVycG9sYXRlIHRoZSB2YWx1ZS5cbiAgICogSXRzIGxlbmd0aCBpcyBzYW1lIGFzIGBjdXJ2ZS5fX2F1dG9tYXRvbi5yZXNvbHV0aW9uICogY3VydmUuX19hdXRvbWF0b24ubGVuZ3RoICsgMWAuXG4gICAqL1xuICBwcm90ZWN0ZWQgX19zaG91bGROb3RJbnRlcnBvbGF0ZSE6IFVpbnQ4QXJyYXk7XG5cbiAgLyoqXG4gICAqIExpc3Qgb2YgYmV6aWVyIG5vZGUuXG4gICAqL1xuICBwcm90ZWN0ZWQgX19ub2RlczogQmV6aWVyTm9kZVtdID0gW107XG5cbiAgLyoqXG4gICAqIExpc3Qgb2YgZnggc2VjdGlvbnMuXG4gICAqL1xuICBwcm90ZWN0ZWQgX19meHM6IEZ4U2VjdGlvbltdID0gW107XG5cbiAgLyoqXG4gICAqIFRoZSBsZW5ndGggb2YgdGhpcyBjdXJ2ZS5cbiAgICovXG4gIHB1YmxpYyBnZXQgbGVuZ3RoKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX19ub2Rlc1sgdGhpcy5fX25vZGVzLmxlbmd0aCAtIDEgXS50aW1lO1xuICB9XG5cblxuICAvKipcbiAgICogQ29uc3RydWN0b3Igb2YgYSBbW0N1cnZlXV0uXG4gICAqIEBwYXJhbSBhdXRvbWF0b24gUGFyZW50IGF1dG9tYXRvblxuICAgKiBAcGFyYW0gZGF0YSBEYXRhIG9mIHRoZSBjdXJ2ZVxuICAgKi9cbiAgcHVibGljIGNvbnN0cnVjdG9yKCBhdXRvbWF0b246IEF1dG9tYXRvbiwgZGF0YTogU2VyaWFsaXplZEN1cnZlICkge1xuICAgIHRoaXMuX19hdXRvbWF0b24gPSBhdXRvbWF0b247XG5cbiAgICB0aGlzLmRlc2VyaWFsaXplKCBkYXRhICk7XG4gIH1cblxuICAvKipcbiAgICogTG9hZCBhIHNlcmlhbGl6ZWQgZGF0YSBvZiBhIGN1cnZlLlxuICAgKiBAcGFyYW0gZGF0YSBEYXRhIG9mIGEgY3VydmVcbiAgICovXG4gIHB1YmxpYyBkZXNlcmlhbGl6ZSggZGF0YTogU2VyaWFsaXplZEN1cnZlICk6IHZvaWQge1xuICAgIHRoaXMuX19ub2RlcyA9IGRhdGEubm9kZXMubWFwKCAoIG5vZGUgKSA9PiAoIHtcbiAgICAgIHRpbWU6IG5vZGVbIDAgXSA/PyAwLjAsXG4gICAgICB2YWx1ZTogbm9kZVsgMSBdID8/IDAuMCxcbiAgICAgIGluVGltZTogbm9kZVsgMiBdID8/IDAuMCxcbiAgICAgIGluVmFsdWU6IG5vZGVbIDMgXSA/PyAwLjAsXG4gICAgICBvdXRUaW1lOiBub2RlWyA0IF0gPz8gMC4wLFxuICAgICAgb3V0VmFsdWU6IG5vZGVbIDUgXSA/PyAwLjAsXG4gICAgfSApICk7XG5cbiAgICB0aGlzLl9fZnhzID0gW107XG4gICAgZGF0YS5meHM/LmZvckVhY2goICggZnggKSA9PiB7XG4gICAgICBpZiAoIGZ4LmJ5cGFzcyApIHsgcmV0dXJuOyB9XG4gICAgICB0aGlzLl9fZnhzLnB1c2goIHtcbiAgICAgICAgdGltZTogZngudGltZSA/PyAwLjAsXG4gICAgICAgIGxlbmd0aDogZngubGVuZ3RoID8/IDAuMCxcbiAgICAgICAgcm93OiBmeC5yb3cgPz8gMCxcbiAgICAgICAgZGVmOiBmeC5kZWYsXG4gICAgICAgIHBhcmFtczogZngucGFyYW1zXG4gICAgICB9ICk7XG4gICAgfSApO1xuXG4gICAgdGhpcy5wcmVjYWxjKCk7XG4gIH1cblxuICAvKipcbiAgICogUHJlY2FsY3VsYXRlIHZhbHVlIG9mIHNhbXBsZXMuXG4gICAqL1xuICBwdWJsaWMgcHJlY2FsYygpOiB2b2lkIHtcbiAgICBjb25zdCB2YWx1ZXNMZW5ndGggPSBNYXRoLmNlaWwoIHRoaXMuX19hdXRvbWF0b24ucmVzb2x1dGlvbiAqIHRoaXMubGVuZ3RoICkgKyAxO1xuXG4gICAgdGhpcy5fX3ZhbHVlcyA9IG5ldyBGbG9hdDMyQXJyYXkoIHZhbHVlc0xlbmd0aCApO1xuICAgIHRoaXMuX19zaG91bGROb3RJbnRlcnBvbGF0ZSA9IG5ldyBVaW50OEFycmF5KCB2YWx1ZXNMZW5ndGggKTtcblxuICAgIHRoaXMuX19nZW5lcmF0ZUN1cnZlKCk7XG4gICAgdGhpcy5fX2FwcGx5RnhzKCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIHRoZSB2YWx1ZSBvZiBzcGVjaWZpZWQgdGltZSBwb2ludC5cbiAgICogQHBhcmFtIHRpbWUgVGltZSBhdCB0aGUgcG9pbnQgeW91IHdhbnQgdG8gZ3JhYiB0aGUgdmFsdWUuXG4gICAqIEByZXR1cm5zIFJlc3VsdCB2YWx1ZVxuICAgKi9cbiAgcHVibGljIGdldFZhbHVlKCB0aW1lOiBudW1iZXIgKTogbnVtYmVyIHtcbiAgICBpZiAoIHRpbWUgPCAwLjAgKSB7XG4gICAgICAvLyBjbGFtcCBsZWZ0XG4gICAgICByZXR1cm4gdGhpcy5fX3ZhbHVlc1sgMCBdO1xuXG4gICAgfSBlbHNlIGlmICggdGhpcy5sZW5ndGggPD0gdGltZSApIHtcbiAgICAgIC8vIGNsYW1wIHJpZ2h0XG4gICAgICByZXR1cm4gdGhpcy5fX3ZhbHVlc1sgdGhpcy5fX3ZhbHVlcy5sZW5ndGggLSAxIF07XG5cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gZmV0Y2ggdHdvIHZhbHVlcyB0aGVuIGRvIHRoZSBsaW5lYXIgaW50ZXJwb2xhdGlvblxuICAgICAgY29uc3QgaW5kZXggPSB0aW1lICogdGhpcy5fX2F1dG9tYXRvbi5yZXNvbHV0aW9uO1xuICAgICAgY29uc3QgaW5kZXhpID0gTWF0aC5mbG9vciggaW5kZXggKTtcbiAgICAgIGNvbnN0IGluZGV4ZiA9IGluZGV4ICUgMS4wO1xuXG4gICAgICBjb25zdCB2MCA9IHRoaXMuX192YWx1ZXNbIGluZGV4aSBdO1xuICAgICAgbGV0IHYxID0gdGhpcy5fX3ZhbHVlc1sgaW5kZXhpICsgMSBdO1xuXG4gICAgICBpZiAoIHRoaXMuX19zaG91bGROb3RJbnRlcnBvbGF0ZVsgaW5kZXhpIF0gKSB7XG4gICAgICAgIC8vIGNvbnRpbnVlICB0aGUgcHJldmlvdXMgZGVsdGFcbiAgICAgICAgY29uc3QgdnAgPSB0aGlzLl9fdmFsdWVzWyBNYXRoLm1heCggaW5kZXhpIC0gMSwgMCApIF07XG4gICAgICAgIHYxID0gMi4wICogdjAgLSB2cDsgLy8gdjAgKyAoIHYwIC0gdnAgKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdiA9IHYwICsgKCB2MSAtIHYwICkgKiBpbmRleGY7XG5cbiAgICAgIHJldHVybiB2O1xuXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBmaXJzdCBzdGVwIG9mIHtAbGluayBwcmVjYWxjfTogZ2VuZXJhdGUgYSBjdXJ2ZSBvdXQgb2Ygbm9kZXMuXG4gICAqL1xuICBwcm90ZWN0ZWQgX19nZW5lcmF0ZUN1cnZlKCk6IHZvaWQge1xuICAgIGxldCBub2RlVGFpbCA9IHRoaXMuX19ub2Rlc1sgMCBdO1xuICAgIGxldCBpVGFpbCA9IDA7XG4gICAgZm9yICggbGV0IGlOb2RlID0gMDsgaU5vZGUgPCB0aGlzLl9fbm9kZXMubGVuZ3RoIC0gMTsgaU5vZGUgKysgKSB7XG4gICAgICBjb25zdCBub2RlMCA9IG5vZGVUYWlsO1xuICAgICAgbm9kZVRhaWwgPSB0aGlzLl9fbm9kZXNbIGlOb2RlICsgMSBdO1xuICAgICAgY29uc3QgaTAgPSBpVGFpbDtcbiAgICAgIGlUYWlsID0gTWF0aC5mbG9vciggbm9kZVRhaWwudGltZSAqIHRoaXMuX19hdXRvbWF0b24ucmVzb2x1dGlvbiApO1xuXG4gICAgICB0aGlzLl9fdmFsdWVzWyBpMCBdID0gbm9kZTAudmFsdWU7XG5cbiAgICAgIGlmICggaTAgPT09IGlUYWlsICYmIGlUYWlsICE9PSAwICkge1xuICAgICAgICB0aGlzLl9fc2hvdWxkTm90SW50ZXJwb2xhdGVbIGlUYWlsIC0gMSBdID0gMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAoIGxldCBpID0gaTAgKyAxOyBpIDw9IGlUYWlsOyBpICsrICkge1xuICAgICAgICAgIGNvbnN0IHRpbWUgPSBpIC8gdGhpcy5fX2F1dG9tYXRvbi5yZXNvbHV0aW9uO1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gYmV6aWVyRWFzaW5nKCBub2RlMCwgbm9kZVRhaWwsIHRpbWUgKTtcbiAgICAgICAgICB0aGlzLl9fdmFsdWVzWyBpIF0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoIGxldCBpID0gaVRhaWwgKyAxOyBpIDwgdGhpcy5fX3ZhbHVlcy5sZW5ndGg7IGkgKysgKSB7XG4gICAgICB0aGlzLl9fdmFsdWVzWyBpIF0gPSBub2RlVGFpbC52YWx1ZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVGhlIHNlY29uZCBzdGVwIG9mIHtAbGluayBwcmVjYWxjfTogYXBwbHkgZnhzIHRvIHRoZSBnZW5lcmF0ZWQgY3VydmVzLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fYXBwbHlGeHMoKTogdm9pZCB7XG4gICAgZm9yICggbGV0IGlGeCA9IDA7IGlGeCA8IHRoaXMuX19meHMubGVuZ3RoOyBpRnggKysgKSB7XG4gICAgICBjb25zdCBmeCA9IHRoaXMuX19meHNbIGlGeCBdO1xuICAgICAgY29uc3QgZnhEZWYgPSB0aGlzLl9fYXV0b21hdG9uLmdldEZ4RGVmaW5pdGlvbiggZnguZGVmICk7XG4gICAgICBpZiAoICFmeERlZiApIHtcbiAgICAgICAgaWYgKCBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50JyApIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oIGBObyBzdWNoIGZ4IGRlZmluaXRpb246ICR7IGZ4LmRlZiB9YCApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGF2YWlsYWJsZUVuZCA9IE1hdGgubWluKCB0aGlzLmxlbmd0aCwgZngudGltZSArIGZ4Lmxlbmd0aCApO1xuICAgICAgY29uc3QgaTAgPSBNYXRoLmNlaWwoIHRoaXMuX19hdXRvbWF0b24ucmVzb2x1dGlvbiAqIGZ4LnRpbWUgKTtcbiAgICAgIGNvbnN0IGkxID0gTWF0aC5mbG9vciggdGhpcy5fX2F1dG9tYXRvbi5yZXNvbHV0aW9uICogYXZhaWxhYmxlRW5kICk7XG4gICAgICBpZiAoIGkxIDw9IGkwICkge1xuICAgICAgICBpZiAoIHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAnZGV2ZWxvcG1lbnQnICkge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoICdMZW5ndGggb2YgdGhlIGZ4IHNlY3Rpb24gaXMgYmVpbmcgbmVnYXRpdmUnICk7XG4gICAgICAgIH1cblxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdGVtcExlbmd0aCA9IGkxIC0gaTAgKyAxO1xuICAgICAgY29uc3QgdGVtcFZhbHVlcyA9IG5ldyBGbG9hdDMyQXJyYXkoIHRlbXBMZW5ndGggKTtcblxuICAgICAgY29uc3QgY29udGV4dDogRnhDb250ZXh0ID0ge1xuICAgICAgICBpbmRleDogaTAsXG4gICAgICAgIGkwLFxuICAgICAgICBpMSxcbiAgICAgICAgdGltZTogZngudGltZSxcbiAgICAgICAgdDA6IGZ4LnRpbWUsXG4gICAgICAgIHQxOiBmeC50aW1lICsgZngubGVuZ3RoLFxuICAgICAgICBkZWx0YVRpbWU6IDEuMCAvIHRoaXMuX19hdXRvbWF0b24ucmVzb2x1dGlvbixcbiAgICAgICAgdmFsdWU6IDAuMCxcbiAgICAgICAgcHJvZ3Jlc3M6IDAuMCxcbiAgICAgICAgZWxhcHNlZDogMC4wLFxuICAgICAgICByZXNvbHV0aW9uOiB0aGlzLl9fYXV0b21hdG9uLnJlc29sdXRpb24sXG4gICAgICAgIGxlbmd0aDogZngubGVuZ3RoLFxuICAgICAgICBwYXJhbXM6IGZ4LnBhcmFtcyxcbiAgICAgICAgYXJyYXk6IHRoaXMuX192YWx1ZXMsXG4gICAgICAgIHNob3VsZE5vdEludGVycG9sYXRlOiB0aGlzLl9fc2hvdWxkTm90SW50ZXJwb2xhdGVbIGkwIF0gPT09IDEsXG4gICAgICAgIHNldFNob3VsZE5vdEludGVycG9sYXRlOiAoIHNob3VsZE5vdEludGVycG9sYXRlOiBib29sZWFuICkgPT4ge1xuICAgICAgICAgIHRoaXMuX19zaG91bGROb3RJbnRlcnBvbGF0ZVsgY29udGV4dC5pbmRleCBdID0gc2hvdWxkTm90SW50ZXJwb2xhdGUgPyAxIDogMDtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0VmFsdWU6IHRoaXMuZ2V0VmFsdWUuYmluZCggdGhpcyApLFxuICAgICAgICBpbml0OiB0cnVlLFxuICAgICAgICBzdGF0ZToge30sXG4gICAgICB9O1xuXG4gICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0ZW1wTGVuZ3RoOyBpICsrICkge1xuICAgICAgICBjb250ZXh0LmluZGV4ID0gaSArIGkwO1xuICAgICAgICBjb250ZXh0LnRpbWUgPSBjb250ZXh0LmluZGV4IC8gdGhpcy5fX2F1dG9tYXRvbi5yZXNvbHV0aW9uO1xuICAgICAgICBjb250ZXh0LnZhbHVlID0gdGhpcy5fX3ZhbHVlc1sgaSArIGkwIF07XG4gICAgICAgIGNvbnRleHQuZWxhcHNlZCA9IGNvbnRleHQudGltZSAtIGZ4LnRpbWU7XG4gICAgICAgIGNvbnRleHQucHJvZ3Jlc3MgPSBjb250ZXh0LmVsYXBzZWQgLyBmeC5sZW5ndGg7XG4gICAgICAgIGNvbnRleHQuc2hvdWxkTm90SW50ZXJwb2xhdGUgPSB0aGlzLl9fc2hvdWxkTm90SW50ZXJwb2xhdGVbIGkgKyBpMCBdID09PSAxO1xuICAgICAgICB0ZW1wVmFsdWVzWyBpIF0gPSBmeERlZi5mdW5jKCBjb250ZXh0ICk7XG5cbiAgICAgICAgY29udGV4dC5pbml0ID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX192YWx1ZXMuc2V0KCB0ZW1wVmFsdWVzLCBpMCApO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgQ2hhbm5lbCB9IGZyb20gJy4vQ2hhbm5lbCc7XG5pbXBvcnQgeyBDdXJ2ZSB9IGZyb20gJy4vQ3VydmUnO1xuaW1wb3J0IHR5cGUgeyBBdXRvbWF0b25PcHRpb25zIH0gZnJvbSAnLi90eXBlcy9BdXRvbWF0b25PcHRpb25zJztcbmltcG9ydCB0eXBlIHsgQ2hhbm5lbFVwZGF0ZUV2ZW50IH0gZnJvbSAnLi90eXBlcy9DaGFubmVsVXBkYXRlRXZlbnQnO1xuaW1wb3J0IHR5cGUgeyBGeERlZmluaXRpb24gfSBmcm9tICcuL3R5cGVzL0Z4RGVmaW5pdGlvbic7XG5pbXBvcnQgdHlwZSB7IFNlcmlhbGl6ZWRBdXRvbWF0b24gfSBmcm9tICcuL3R5cGVzL1NlcmlhbGl6ZWRBdXRvbWF0b24nO1xuXG4vKipcbiAqIElUJ1MgQVVUT01BVE9OIVxuICogQHBhcmFtIGRhdGEgU2VyaWFsaXplZCBkYXRhIG9mIHRoZSBhdXRvbWF0b25cbiAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgZm9yIHRoaXMgQXV0b21hdG9uIGluc3RhbmNlXG4gKi9cbmV4cG9ydCBjbGFzcyBBdXRvbWF0b24ge1xuICAvKipcbiAgICogSXQgcmV0dXJucyB0aGUgY3VycmVudCB2YWx1ZSBvZiB0aGUgW1tDaGFubmVsXV0gY2FsbGVkIGBuYW1lYC5cbiAgICogSWYgdGhlIGBuYW1lYCBpcyBhbiBhcnJheSwgaXQgcmV0dXJucyBhIHNldCBvZiBuYW1lIDogY2hhbm5lbCBhcyBhbiBvYmplY3QgaW5zdGVhZC5cbiAgICogWW91IGNhbiBhbHNvIGdpdmUgYSBsaXN0ZW5lciB3aGljaCB3aWxsIGJlIGV4ZWN1dGVkIHdoZW4gdGhlIGNoYW5uZWwgY2hhbmdlcyBpdHMgdmFsdWUgKG9wdGlvbmFsKS5cbiAgICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgb2YgdGhlIGNoYW5uZWxcbiAgICogQHBhcmFtIGxpc3RlbmVyIEEgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIGV4ZWN1dGVkIHdoZW4gdGhlIGNoYW5uZWwgY2hhbmdlcyBpdHMgdmFsdWVcbiAgICogQHJldHVybnMgQ3VycmVudCB2YWx1ZSBvZiB0aGUgY2hhbm5lbFxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IGF1dG86IEF1dG9tYXRvblsgJ19fYXV0bycgXSA9IHRoaXMuX19hdXRvLmJpbmQoIHRoaXMgKTtcblxuICAvKipcbiAgICogQ3VydmVzIG9mIHRoZSBhdXRvbWF0b24uXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgY3VydmVzOiBDdXJ2ZVtdID0gW107XG5cbiAgLyoqXG4gICAqIENoYW5uZWxzIG9mIHRoZSB0aW1lbGluZS5cbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBjaGFubmVsczogQ2hhbm5lbFtdID0gW107XG5cbiAgLyoqXG4gICAqIE1hcCBvZiBjaGFubmVscywgbmFtZSB2cy4gY2hhbm5lbCBpdHNlbGYuXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgbWFwTmFtZVRvQ2hhbm5lbCA9IG5ldyBNYXA8c3RyaW5nLCBDaGFubmVsPigpO1xuXG4gIC8qKlxuICAgKiBDdXJyZW50IHRpbWUgb2YgdGhlIGF1dG9tYXRvbi5cbiAgICogQ2FuIGJlIHNldCBieSBbW3VwZGF0ZV1dLCBiZSByZXRyaWV2ZWQgYnkgW1tnZXQgdGltZV1dLCBiZSB1c2VkIGJ5IFtbYXV0b11dXG4gICAqL1xuICBwcm90ZWN0ZWQgX190aW1lOiBudW1iZXIgPSAwLjA7XG5cbiAgLyoqXG4gICAqIFZlcnNpb24gb2YgdGhlIGF1dG9tYXRvbi5cbiAgICovXG4gIHByb3RlY3RlZCBfX3ZlcnNpb246IHN0cmluZyA9IHByb2Nlc3MuZW52LlZFUlNJT04hO1xuXG4gIC8qKlxuICAgKiBSZXNvbHV0aW9uIG9mIHRoZSB0aW1lbGluZS5cbiAgICovXG4gIHByb3RlY3RlZCBfX3Jlc29sdXRpb246IG51bWJlciA9IDEwMDA7XG5cbiAgLyoqXG4gICAqIEEgbWFwIG9mIGZ4IGRlZmluaXRpb25zLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fZnhEZWZpbml0aW9uczogeyBbIG5hbWU6IHN0cmluZyBdOiBGeERlZmluaXRpb24gfSA9IHt9O1xuXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihcbiAgICBkYXRhOiBTZXJpYWxpemVkQXV0b21hdG9uLFxuICAgIG9wdGlvbnM6IEF1dG9tYXRvbk9wdGlvbnMgPSB7fVxuICApIHtcbiAgICBvcHRpb25zLmZ4RGVmaW5pdGlvbnMgJiYgdGhpcy5hZGRGeERlZmluaXRpb25zKCBvcHRpb25zLmZ4RGVmaW5pdGlvbnMgKTtcbiAgICB0aGlzLmRlc2VyaWFsaXplKCBkYXRhICk7XG4gIH1cblxuICAvKipcbiAgICogQ3VycmVudCB0aW1lIG9mIHRoZSBhdXRvbWF0b24sIHRoYXQgaXMgc2V0IHZpYSBbW3VwZGF0ZV1dLlxuICAgKi9cbiAgcHVibGljIGdldCB0aW1lKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9fdGltZTsgfVxuXG4gIC8qKlxuICAgKiBWZXJzaW9uIG9mIHRoZSBhdXRvbWF0b24uXG4gICAqL1xuICBwdWJsaWMgZ2V0IHZlcnNpb24oKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMuX192ZXJzaW9uOyB9XG5cbiAgLyoqXG4gICAqIFJlc29sdXRpb24gPSBTYW1wbGluZyBwb2ludCBwZXIgc2Vjb25kLlxuICAgKi9cbiAgcHVibGljIGdldCByZXNvbHV0aW9uKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9fcmVzb2x1dGlvbjsgfVxuXG4gIC8qKlxuICAgKiBMb2FkIHNlcmlhbGl6ZWQgYXV0b21hdG9uIGRhdGEuXG4gICAqIEBwYXJhbSBkYXRhIFNlcmlhbGl6ZWQgb2JqZWN0IGNvbnRhaW5zIGF1dG9tYXRvbiBkYXRhLlxuICAgKi9cbiAgcHVibGljIGRlc2VyaWFsaXplKCBkYXRhOiBTZXJpYWxpemVkQXV0b21hdG9uICk6IHZvaWQge1xuICAgIHRoaXMuX19yZXNvbHV0aW9uID0gZGF0YS5yZXNvbHV0aW9uO1xuXG4gICAgdGhpcy5jdXJ2ZXMuc3BsaWNlKCAwICk7XG4gICAgdGhpcy5jdXJ2ZXMucHVzaChcbiAgICAgIC4uLmRhdGEuY3VydmVzLm1hcCggKCBkYXRhICkgPT4gbmV3IEN1cnZlKCB0aGlzLCBkYXRhICkgKVxuICAgICk7XG5cbiAgICB0aGlzLm1hcE5hbWVUb0NoYW5uZWwuY2xlYXIoKTtcblxuICAgIHRoaXMuY2hhbm5lbHMuc3BsaWNlKCAwICk7XG4gICAgdGhpcy5jaGFubmVscy5wdXNoKFxuICAgICAgLi4uZGF0YS5jaGFubmVscy5tYXAoICggWyBuYW1lLCBkYXRhIF0gKSA9PiB7XG4gICAgICAgIGNvbnN0IGNoYW5uZWwgPSBuZXcgQ2hhbm5lbCggdGhpcywgZGF0YSApO1xuXG4gICAgICAgIGlmICggcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdkZXZlbG9wbWVudCcgKSB7XG4gICAgICAgICAgaWYgKCB0aGlzLm1hcE5hbWVUb0NoYW5uZWwuaGFzKCBuYW1lICkgKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oIGBEdXBsaWNhdGVkIGNoYW5uZWw6ICR7IG5hbWUgfWAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm1hcE5hbWVUb0NoYW5uZWwuc2V0KCBuYW1lLCBjaGFubmVsICk7XG4gICAgICAgIHJldHVybiBjaGFubmVsO1xuICAgICAgfSApXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgZnggZGVmaW5pdGlvbnMuXG4gICAqIEBwYXJhbSBmeERlZmluaXRpb25zIEEgbWFwIG9mIGlkIC0gZnggZGVmaW5pdGlvblxuICAgKi9cbiAgcHVibGljIGFkZEZ4RGVmaW5pdGlvbnMoIGZ4RGVmaW5pdGlvbnM6IHsgWyBpZDogc3RyaW5nIF06IEZ4RGVmaW5pdGlvbiB9ICk6IHZvaWQge1xuICAgIE9iamVjdC5lbnRyaWVzKCBmeERlZmluaXRpb25zICkuZm9yRWFjaCggKCBbIGlkLCBmeERlZiBdICkgPT4ge1xuICAgICAgaWYgKCB0eXBlb2YgZnhEZWYuZnVuYyA9PT0gJ2Z1bmN0aW9uJyApIHsgLy8gaWdub3JlIHVucmVsYXRlZCBlbnRyaWVzXG4gICAgICAgIGlmICggcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdkZXZlbG9wbWVudCcgKSB7XG4gICAgICAgICAgaWYgKCB0aGlzLl9fZnhEZWZpbml0aW9uc1sgaWQgXSAhPSBudWxsICkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCBgT3ZlcndyaXRpbmcgdGhlIGV4aXN0aW5nIGZ4IGRlZmluaXRpb246ICR7IGlkIH1gICk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fX2Z4RGVmaW5pdGlvbnNbIGlkIF0gPSBmeERlZjtcbiAgICAgIH1cbiAgICB9ICk7XG5cbiAgICB0aGlzLnByZWNhbGNBbGwoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBmeCBkZWZpbml0aW9uLlxuICAgKiBJZiBpdCBjYW4ndCBmaW5kIHRoZSBkZWZpbml0aW9uLCBpdCByZXR1cm5zIGBudWxsYCBpbnN0ZWFkLlxuICAgKiBAcGFyYW0gaWQgVW5pcXVlIGlkIGZvciB0aGUgRnggZGVmaW5pdGlvblxuICAgKi9cbiAgcHVibGljIGdldEZ4RGVmaW5pdGlvbiggaWQ6IHN0cmluZyApOiBGeERlZmluaXRpb24gfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fX2Z4RGVmaW5pdGlvbnNbIGlkIF0gfHwgbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBjdXJ2ZS5cbiAgICogQHBhcmFtIGluZGV4IEFuIGluZGV4IG9mIHRoZSBjdXJ2ZVxuICAgKi9cbiAgcHVibGljIGdldEN1cnZlKCBpbmRleDogbnVtYmVyICk6IEN1cnZlIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuY3VydmVzWyBpbmRleCBdIHx8IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogUHJlY2FsY3VsYXRlIGFsbCBjdXJ2ZXMuXG4gICAqL1xuICBwdWJsaWMgcHJlY2FsY0FsbCgpOiB2b2lkIHtcbiAgICBPYmplY3QudmFsdWVzKCB0aGlzLmN1cnZlcyApLmZvckVhY2goICggY3VydmUgKSA9PiBjdXJ2ZS5wcmVjYWxjKCkgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgaW50ZXJuYWwgc3RhdGVzIG9mIGNoYW5uZWxzLlxuICAgKiAqKkNhbGwgdGhpcyBtZXRob2Qgd2hlbiB5b3Ugc2VlayB0aGUgdGltZS4qKlxuICAgKi9cbiAgcHVibGljIHJlc2V0KCk6IHZvaWQge1xuICAgIE9iamVjdC52YWx1ZXMoIHRoaXMuY2hhbm5lbHMgKS5mb3JFYWNoKCAoIGNoYW5uZWwgKSA9PiBjaGFubmVsLnJlc2V0KCkgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIGVudGlyZSBhdXRvbWF0b24uXG4gICAqICoqWW91IG1heSB3YW50IHRvIGNhbGwgdGhpcyBpbiB5b3VyIHVwZGF0ZSBsb29wLioqXG4gICAqIEBwYXJhbSB0aW1lIEN1cnJlbnQgdGltZVxuICAgKi9cbiAgcHVibGljIHVwZGF0ZSggdGltZTogbnVtYmVyICk6IHZvaWQge1xuICAgIGNvbnN0IHQgPSBNYXRoLm1heCggdGltZSwgMC4wICk7XG5cbiAgICAvLyBjYWNoZSB0aGUgdGltZVxuICAgIHRoaXMuX190aW1lID0gdDtcblxuICAgIC8vIHVwZGF0ZSBjaGFubmVsc1xuICAgIGNvbnN0IGFycmF5ID0gdGhpcy5jaGFubmVscy5tYXAoICggY2hhbm5lbCApID0+IGNoYW5uZWwuY29uc3VtZSggdGhpcy5fX3RpbWUgKSApLmZsYXQoIDEgKTtcbiAgICBhcnJheS5zb3J0KCAoIFsgYSBdLCBbIGIgXSApID0+IGEgLSBiICkuZm9yRWFjaCggKCBbIF8sIGZ1bmMgXSApID0+IGZ1bmMoKSApO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2lnbmVkIHRvIHtAbGluayBBdXRvbWF0b24jYXV0b30gb24gaXRzIGluaXRpYWxpemUgcGhhc2UuXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBjaGFubmVsXG4gICAqIEBwYXJhbSBsaXN0ZW5lciBBIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBleGVjdXRlZCB3aGVuIHRoZSBjaGFubmVsIGNoYW5nZXMgaXRzIHZhbHVlXG4gICAqIEByZXR1cm5zIEN1cnJlbnQgdmFsdWUgb2YgdGhlIGNoYW5uZWxcbiAgICovXG4gIHByb3RlY3RlZCBfX2F1dG8oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGxpc3RlbmVyPzogKCBldmVudDogQ2hhbm5lbFVwZGF0ZUV2ZW50ICkgPT4gdm9pZFxuICApOiBudW1iZXIge1xuICAgIGNvbnN0IGNoYW5uZWwgPSB0aGlzLm1hcE5hbWVUb0NoYW5uZWwuZ2V0KCBuYW1lICk7XG5cbiAgICBpZiAoIHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAnZGV2ZWxvcG1lbnQnICkge1xuICAgICAgaWYgKCAhY2hhbm5lbCApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCBgTm8gc3VjaCBjaGFubmVsOiAkeyBuYW1lIH1gICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCBsaXN0ZW5lciApIHtcbiAgICAgIGNoYW5uZWwhLnN1YnNjcmliZSggbGlzdGVuZXIgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2hhbm5lbCEuY3VycmVudFZhbHVlO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7SUFTQSxNQUFNLFdBQVcsR0FBRyxDQUFDLENBQUM7SUFDdEIsTUFBTSxjQUFjLEdBQUcsS0FBSyxDQUFDO0lBQzdCLE1BQU0sV0FBVyxHQUFHLEVBQUUsQ0FBQztJQUN2QixNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUM7SUFDaEMsTUFBTSxVQUFVLEdBQUcsRUFBRSxDQUFDO0lBRXRCLE1BQU0s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
