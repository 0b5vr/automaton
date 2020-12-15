/*!
* @fms-cat/automaton v4.1.0
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
            let next = this.__items.findIndex((item) => (time < item.time));
            // it's the first one!
            if (next === 0) {
                return 0.0;
            }
            // it's the last one!
            if (next === -1) {
                next = this.__items.length;
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
            this.__values = new Float32Array(Math.ceil(this.__automaton.resolution * this.length) + 1);
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
                const v1 = this.__values[indexi + 1];
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
                for (let i = i0 + 1; i <= iTail; i++) {
                    const time = i / this.__automaton.resolution;
                    const value = bezierEasing(node0, nodeTail, time);
                    this.__values[i] = value;
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
                    getValue: this.getValue.bind(this),
                    init: true,
                    state: {}
                };
                for (let i = 0; i < tempLength; i++) {
                    context.index = i + i0;
                    context.time = context.index / this.__automaton.resolution;
                    context.value = this.__values[i + i0];
                    context.elapsed = context.time - fx.time;
                    context.progress = context.elapsed / fx.length;
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
            this.__version = '4.1.0';
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

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b21hdG9uLmpzIiwic291cmNlcyI6WyIuLi9zcmMvQ2hhbm5lbEl0ZW0udHMiLCIuLi9zcmMvQ2hhbm5lbC50cyIsIi4uL3NyYy91dGlscy9iZXppZXJFYXNpbmcudHMiLCIuLi9zcmMvQ3VydmUudHMiLCIuLi9zcmMvQXV0b21hdG9uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEF1dG9tYXRvbiwgQ3VydmUgfSBmcm9tICcuJztcbmltcG9ydCB0eXBlIHsgU2VyaWFsaXplZENoYW5uZWxJdGVtIH0gZnJvbSAnLi90eXBlcy9TZXJpYWxpemVkQ2hhbm5lbEl0ZW0nO1xuXG4vKipcbiAqIFJlcHJlc2VudHMgYW4gaXRlbSBvZiBhIFtbQ2hhbm5lbF1dLlxuICovXG5leHBvcnQgY2xhc3MgQ2hhbm5lbEl0ZW0ge1xuICAvKipcbiAgICogVGhlIHBhcmVudCBhdXRvbWF0b24uXG4gICAqL1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgX19hdXRvbWF0b246IEF1dG9tYXRvbjtcblxuICAvKipcbiAgICogQmVnaW5uaW5nIHRpbWVwb2ludCBvZiB0aGUgaXRlbS5cbiAgICovXG4gIHB1YmxpYyB0aW1lITogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBMZW5ndGggb2YgdGhlIGl0ZW0uXG4gICAqL1xuICBwdWJsaWMgbGVuZ3RoITogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBWYWx1ZSBvZiB0aGUgaXRlbS5cbiAgICovXG4gIHB1YmxpYyB2YWx1ZSE6IG51bWJlcjtcblxuICAvKipcbiAgICogV2hldGhlciByZXNldCBjaGFubmVscyB2YWx1ZSB0byB6ZXJvIGF0IHRoZSBlbmQgb2YgdGhpcyBpdGVtIG9yIG5vdC5cbiAgICovXG4gIHB1YmxpYyByZXNldD86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFRoaXMgd2lsbCBvbmx5IG1ha2Ugc2Vuc2Ugd2hlbiB7QGxpbmsgY3VydmV9IGlzIHNwZWNpZmllZC5cbiAgICogVGhlIHRpbWUgb2Zmc2V0IG9mIHRoZSBpdGVtLlxuICAgKi9cbiAgcHVibGljIG9mZnNldCE6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhpcyB3aWxsIG9ubHkgbWFrZSBzZW5zZSB3aGVuIHtAbGluayBjdXJ2ZX0gaXMgc3BlY2lmaWVkLlxuICAgKiBUaGUgc3BlZWQgcmF0ZSBvZiB0aGUgaXRlbS5cbiAgICovXG4gIHB1YmxpYyBzcGVlZCE6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhpcyB3aWxsIG9ubHkgbWFrZSBzZW5zZSB3aGVuIHtAbGluayBjdXJ2ZX0gaXMgc3BlY2lmaWVkLlxuICAgKiBUaGUgc2NhbGUgb2YgdGhlIGl0ZW0gaW4gdGhlIHZhbHVlIGF4aXMuXG4gICAqL1xuICBwdWJsaWMgYW1wITogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgY3VydmUgb2YgdGhlIGl0ZW0uXG4gICAqL1xuICBwdWJsaWMgY3VydmU/OiBDdXJ2ZTtcblxuICAvKipcbiAgICogRW5kaW5nIHRpbWVwb2ludCBvZiB0aGUgaXRlbS5cbiAgICovXG4gIHB1YmxpYyBnZXQgZW5kKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMudGltZSArIHRoaXMubGVuZ3RoO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yIG9mIHRoZSBbW0NoYW5uZWxJdGVtXV0uXG4gICAqIEBwYXJhbSBhdXRvbWF0b24gUGFyZW50IGF1dG9tYXRvblxuICAgKiBAcGFyYW0gZGF0YSBEYXRhIG9mIHRoZSBpdGVtXG4gICAqL1xuICBwdWJsaWMgY29uc3RydWN0b3IoIGF1dG9tYXRvbjogQXV0b21hdG9uLCBkYXRhOiBTZXJpYWxpemVkQ2hhbm5lbEl0ZW0gKSB7XG4gICAgdGhpcy5fX2F1dG9tYXRvbiA9IGF1dG9tYXRvbjtcblxuICAgIHRoaXMuZGVzZXJpYWxpemUoIGRhdGEgKTtcbiAgfVxuXG4gIHB1YmxpYyBnZXRWYWx1ZSggdGltZTogbnVtYmVyICk6IG51bWJlciB7XG4gICAgaWYgKCB0aGlzLnJlc2V0ICYmIHRoaXMubGVuZ3RoIDw9IHRpbWUgKSB7XG4gICAgICByZXR1cm4gMC4wO1xuICAgIH1cblxuICAgIGlmICggdGhpcy5jdXJ2ZSApIHtcbiAgICAgIGNvbnN0IHQgPSB0aGlzLm9mZnNldCEgKyB0aW1lICogdGhpcy5zcGVlZCE7XG4gICAgICByZXR1cm4gdGhpcy52YWx1ZSArIHRoaXMuYW1wICogdGhpcy5jdXJ2ZS5nZXRWYWx1ZSggdCApO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy52YWx1ZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRGVzZXJpYWxpemUgYSBzZXJpYWxpemVkIGRhdGEgb2YgaXRlbSBmcm9tIFtbU2VyaWFsaXplZENoYW5uZWxJdGVtXV0uXG4gICAqIEBwYXJhbSBkYXRhIEEgc2VyaWFsaXplZCBpdGVtLlxuICAgKi9cbiAgcHVibGljIGRlc2VyaWFsaXplKCBkYXRhOiBTZXJpYWxpemVkQ2hhbm5lbEl0ZW0gKTogdm9pZCB7XG4gICAgdGhpcy50aW1lID0gZGF0YS50aW1lID8/IDAuMDtcbiAgICB0aGlzLmxlbmd0aCA9IGRhdGEubGVuZ3RoID8/IDAuMDtcbiAgICB0aGlzLnZhbHVlID0gZGF0YS52YWx1ZSA/PyAwLjA7XG4gICAgdGhpcy5vZmZzZXQgPSBkYXRhLm9mZnNldCA/PyAwLjA7XG4gICAgdGhpcy5zcGVlZCA9IGRhdGEuc3BlZWQgPz8gMS4wO1xuICAgIHRoaXMuYW1wID0gZGF0YS5hbXAgPz8gMS4wO1xuICAgIHRoaXMucmVzZXQgPSBkYXRhLnJlc2V0O1xuICAgIGlmICggZGF0YS5jdXJ2ZSAhPSBudWxsICkge1xuICAgICAgdGhpcy5jdXJ2ZSA9IHRoaXMuX19hdXRvbWF0b24uZ2V0Q3VydmUoIGRhdGEuY3VydmUgKSE7XG4gICAgICB0aGlzLmxlbmd0aCA9IGRhdGEubGVuZ3RoID8/IHRoaXMuY3VydmUubGVuZ3RoID8/IDAuMDtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IEF1dG9tYXRvbiB9IGZyb20gJy4vQXV0b21hdG9uJztcbmltcG9ydCB7IENoYW5uZWxJdGVtIH0gZnJvbSAnLi9DaGFubmVsSXRlbSc7XG5pbXBvcnQgdHlwZSB7IENoYW5uZWxVcGRhdGVFdmVudCB9IGZyb20gJy4vdHlwZXMvQ2hhbm5lbFVwZGF0ZUV2ZW50JztcbmltcG9ydCB0eXBlIHsgU2VyaWFsaXplZENoYW5uZWwgfSBmcm9tICcuL3R5cGVzL1NlcmlhbGl6ZWRDaGFubmVsJztcblxuLyoqXG4gKiBJdCByZXByZXNlbnRzIGEgY2hhbm5lbCBvZiBBdXRvbWF0b24uXG4gKi9cbmV4cG9ydCBjbGFzcyBDaGFubmVsIHtcbiAgLyoqXG4gICAqIFRoZSBwYXJlbnQgYXV0b21hdG9uLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fYXV0b21hdG9uOiBBdXRvbWF0b247XG5cbiAgLyoqXG4gICAqIExpc3Qgb2YgY2hhbm5lbCBpdGVtcy5cbiAgICovXG4gIHByb3RlY3RlZCBfX2l0ZW1zOiBDaGFubmVsSXRlbVtdID0gW107XG5cbiAgLyoqXG4gICAqIEEgY2FjaGUgb2YgbGFzdCBjYWxjdWxhdGVkIHZhbHVlLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fdmFsdWU6IG51bWJlciA9IDAuMDtcblxuICAvKipcbiAgICogVGhlIHRpbWUgdGhhdCB3YXMgdXNlZCBmb3IgdGhlIGNhbGN1bGF0aW9uIG9mIFtbX19sYXN0VmFsdWVdXS5cbiAgICovXG4gIHByb3RlY3RlZCBfX3RpbWU6IG51bWJlciA9IC1JbmZpbml0eTtcblxuICAvKipcbiAgICogVGhlIGluZGV4IG9mIFtbX19pdGVtc11dIGl0IHNob3VsZCBldmFsdWF0ZSBuZXh0LlxuICAgKi9cbiAgcHJvdGVjdGVkIF9faGVhZDogbnVtYmVyID0gMDtcblxuICAvKipcbiAgICogQW4gYXJyYXkgb2YgbGlzdGVuZXJzLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fbGlzdGVuZXJzOiBBcnJheTwoIGV2ZW50OiBDaGFubmVsVXBkYXRlRXZlbnQgKSA9PiB2b2lkPiA9IFtdO1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RvciBvZiB0aGUgW1tDaGFubmVsXV0uXG4gICAqIEBwYXJhbSBhdXRvbWF0b24gUGFyZW50IGF1dG9tYXRvblxuICAgKiBAcGFyYW0gZGF0YSBEYXRhIG9mIHRoZSBjaGFubmVsXG4gICAqL1xuICBwdWJsaWMgY29uc3RydWN0b3IoIGF1dG9tYXRvbjogQXV0b21hdG9uLCBkYXRhOiBTZXJpYWxpemVkQ2hhbm5lbCApIHtcbiAgICB0aGlzLl9fYXV0b21hdG9uID0gYXV0b21hdG9uO1xuXG4gICAgdGhpcy5kZXNlcmlhbGl6ZSggZGF0YSApO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgY2FjaGUgb2YgbGFzdCBjYWxjdWxhdGVkIHZhbHVlLlxuICAgKi9cbiAgcHVibGljIGdldCBjdXJyZW50VmFsdWUoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX192YWx1ZTsgfVxuXG4gIC8qKlxuICAgKiBUaGUgdGltZSB0aGF0IHdhcyB1c2VkIGZvciB0aGUgY2FsY3VsYXRpb24gb2YgW1tfX2xhc3RWYWx1ZV1dLlxuICAgKi9cbiAgcHVibGljIGdldCBjdXJyZW50VGltZSgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fX3RpbWU7IH1cblxuICAvKipcbiAgICogTG9hZCBhIHNlcmlhbGl6ZWQgZGF0YSBvZiBhIGNoYW5uZWwuXG4gICAqIEBwYXJhbSBkYXRhIERhdGEgb2YgYSBjaGFubmVsXG4gICAqL1xuICBwdWJsaWMgZGVzZXJpYWxpemUoIGRhdGE6IFNlcmlhbGl6ZWRDaGFubmVsICk6IHZvaWQge1xuICAgIHRoaXMuX19pdGVtcyA9IGRhdGEuaXRlbXM/Lm1hcCggKCBpdGVtICkgPT4gbmV3IENoYW5uZWxJdGVtKCB0aGlzLl9fYXV0b21hdG9uLCBpdGVtICkgKSA/PyBbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgaW50ZXJuYWwgc3RhdGVzLlxuICAgKiBDYWxsIHRoaXMgbWV0aG9kIHdoZW4geW91IHNlZWsgdGhlIHRpbWUuXG4gICAqL1xuICBwdWJsaWMgcmVzZXQoKTogdm9pZCB7XG4gICAgdGhpcy5fX3RpbWUgPSAtSW5maW5pdHk7XG4gICAgdGhpcy5fX3ZhbHVlID0gMDtcbiAgICB0aGlzLl9faGVhZCA9IDA7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGEgbmV3IGxpc3RlbmVyIHRoYXQgcmVjZWl2ZXMgYSBbW0NoYW5uZWxVcGRhdGVFdmVudF1dIHdoZW4gYW4gdXBkYXRlIGlzIGhhcHBlbmVkLlxuICAgKiBAcGFyYW0gbGlzdGVuZXIgQSBzdWJzY3JpYmluZyBsaXN0ZW5lclxuICAgKi9cbiAgcHVibGljIHN1YnNjcmliZSggbGlzdGVuZXI6ICggZXZlbnQ6IENoYW5uZWxVcGRhdGVFdmVudCApID0+IHZvaWQgKTogdm9pZCB7XG4gICAgdGhpcy5fX2xpc3RlbmVycy5wdXNoKCBsaXN0ZW5lciApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiB0aGUgdmFsdWUgb2Ygc3BlY2lmaWVkIHRpbWUgcG9pbnQuXG4gICAqIEBwYXJhbSB0aW1lIFRpbWUgYXQgdGhlIHBvaW50IHlvdSB3YW50IHRvIGdyYWIgdGhlIHZhbHVlLlxuICAgKiBAcmV0dXJucyBSZXN1bHQgdmFsdWVcbiAgICovXG4gIHB1YmxpYyBnZXRWYWx1ZSggdGltZTogbnVtYmVyICk6IG51bWJlciB7XG4gICAgbGV0IG5leHQgPSB0aGlzLl9faXRlbXMuZmluZEluZGV4KCAoIGl0ZW0gKSA9PiAoIHRpbWUgPCBpdGVtLnRpbWUgKSApO1xuXG4gICAgLy8gaXQncyB0aGUgZmlyc3Qgb25lIVxuICAgIGlmICggbmV4dCA9PT0gMCApIHtcbiAgICAgIHJldHVybiAwLjA7XG4gICAgfVxuXG4gICAgLy8gaXQncyB0aGUgbGFzdCBvbmUhXG4gICAgaWYgKCBuZXh0ID09PSAtMSApIHtcbiAgICAgIG5leHQgPSB0aGlzLl9faXRlbXMubGVuZ3RoO1xuICAgIH1cblxuICAgIGNvbnN0IGl0ZW0gPSB0aGlzLl9faXRlbXNbIG5leHQgLSAxIF07XG4gICAgaWYgKCBpdGVtLmVuZCA8IHRpbWUgKSB7XG4gICAgICByZXR1cm4gaXRlbS5nZXRWYWx1ZSggaXRlbS5sZW5ndGggKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGl0ZW0uZ2V0VmFsdWUoIHRpbWUgLSBpdGVtLnRpbWUgKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVGhpcyBtZXRob2QgaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBieSBbW0F1dG9tYXRvbi51cGRhdGVdXS5cbiAgICogQ29uc3VtZSBhbmQgcmV0dXJuIGl0ZW1zLlxuICAgKiBAcGFyYW0gdGltZSBUaGUgY3VycmVudCB0aW1lIG9mIHRoZSBwYXJlbnQgW1tBdXRvbWF0b25dXVxuICAgKiBAcmV0dXJucyBBcnJheSBvZiB0dXBsZXMsIFsgdGltaW5nIG9mIHRoZSBldmVudCwgYSBmdW5jdGlvbiB0aGF0IGV4ZWN1dGUgdGhlIGV2ZW50IF1cbiAgICovXG4gIHB1YmxpYyBjb25zdW1lKCB0aW1lOiBudW1iZXIgKTogWyB0aW1lOiBudW1iZXIsIHVwZGF0ZTogKCkgPT4gdm9pZCBdW10ge1xuICAgIGNvbnN0IHJldDogWyBudW1iZXIsICgpID0+IHZvaWQgXVtdID0gW107XG5cbiAgICBjb25zdCBwcmV2VGltZSA9IHRoaXMuX190aW1lO1xuXG4gICAgZm9yICggbGV0IGkgPSB0aGlzLl9faGVhZDsgaSA8IHRoaXMuX19pdGVtcy5sZW5ndGg7IGkgKysgKSB7XG4gICAgICBjb25zdCBpdGVtID0gdGhpcy5fX2l0ZW1zWyBpIF07XG4gICAgICBjb25zdCB7IHRpbWU6IGJlZ2luLCBlbmQsIGxlbmd0aCB9ID0gaXRlbTtcbiAgICAgIGxldCBlbGFwc2VkID0gdGltZSAtIGJlZ2luO1xuXG4gICAgICBpZiAoIGVsYXBzZWQgPCAwLjAgKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IHByb2dyZXNzOiBudW1iZXI7XG4gICAgICAgIGxldCBpbml0OiB0cnVlIHwgdW5kZWZpbmVkO1xuICAgICAgICBsZXQgdW5pbml0OiB0cnVlIHwgdW5kZWZpbmVkO1xuXG4gICAgICAgIGlmICggbGVuZ3RoIDw9IGVsYXBzZWQgKSB7XG4gICAgICAgICAgZWxhcHNlZCA9IGxlbmd0aDtcbiAgICAgICAgICBwcm9ncmVzcyA9IDEuMDtcbiAgICAgICAgICB1bmluaXQgPSB0cnVlO1xuXG4gICAgICAgICAgaWYgKCBpID09PSB0aGlzLl9faGVhZCApIHtcbiAgICAgICAgICAgIHRoaXMuX19oZWFkICsrO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwcm9ncmVzcyA9IGxlbmd0aCAhPT0gMC4wXG4gICAgICAgICAgICA/IGVsYXBzZWQgLyBsZW5ndGhcbiAgICAgICAgICAgIDogMS4wO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBwcmV2VGltZSA8IGJlZ2luICkge1xuICAgICAgICAgIGluaXQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0LnB1c2goIFsgYmVnaW4gKyBlbGFwc2VkLCAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5fX3ZhbHVlID0gaXRlbS5nZXRWYWx1ZSggZWxhcHNlZCApO1xuXG4gICAgICAgICAgdGhpcy5fX2xpc3RlbmVycy5mb3JFYWNoKCAoIGxpc3RlbmVyICkgPT4gbGlzdGVuZXIoIHtcbiAgICAgICAgICAgIHRpbWUsXG4gICAgICAgICAgICBlbGFwc2VkLFxuICAgICAgICAgICAgYmVnaW4sXG4gICAgICAgICAgICBlbmQsXG4gICAgICAgICAgICBsZW5ndGgsXG4gICAgICAgICAgICB2YWx1ZTogdGhpcy5fX3ZhbHVlLFxuICAgICAgICAgICAgcHJvZ3Jlc3MsXG4gICAgICAgICAgICBpbml0LFxuICAgICAgICAgICAgdW5pbml0LFxuICAgICAgICAgIH0gKSApO1xuICAgICAgICB9IF0gKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl9fdGltZSA9IHRpbWU7XG5cbiAgICByZXR1cm4gcmV0O1xuICB9XG59XG4iLCJpbXBvcnQgdHlwZSB7IEJlemllck5vZGUgfSBmcm9tICcuLi90eXBlcy9CZXppZXJOb2RlJztcblxuaW50ZXJmYWNlIEN1YmljQmV6aWVyQ29udHJvbFBvaW50cyB7XG4gIHAwOiBudW1iZXI7XG4gIHAxOiBudW1iZXI7XG4gIHAyOiBudW1iZXI7XG4gIHAzOiBudW1iZXI7XG59XG5cbmNvbnN0IE5FV1RPTl9JVEVSID0gNDtcbmNvbnN0IE5FV1RPTl9FUFNJTE9OID0gMC4wMDE7XG5jb25zdCBTVUJESVZfSVRFUiA9IDEwO1xuY29uc3QgU1VCRElWX0VQU0lMT04gPSAwLjAwMDAwMTtcbmNvbnN0IFRBQkxFX1NJWkUgPSAyMTtcblxuY29uc3QgX19jYWNoZTogbnVtYmVyW10gPSBbXTtcblxuZnVuY3Rpb24gY2xhbXAoIHg6IG51bWJlciwgbWluOiBudW1iZXIsIG1heDogbnVtYmVyICk6IG51bWJlciB7XG4gIHJldHVybiBNYXRoLm1pbiggTWF0aC5tYXgoIHgsIG1pbiApLCBtYXggKTtcbn1cblxuLypcbiAqICgxLXQpKDEtdCkoMS10KSBhMCA9ICgxLTJ0K3R0KSgxLXQpIGEwXG4gKiAgICAgICAgICAgICAgICAgICAgPSAoMS10LTJ0KzJ0dCt0dC10dHQpIGEwXG4gKiAgICAgICAgICAgICAgICAgICAgPSAoMS0zdCszdHQtdHR0KSBhMFxuICpcbiAqIDMoMS10KSgxLXQpdCBhMSA9IDMoMS0ydCt0dCl0IGExXG4gKiAgICAgICAgICAgICAgICAgPSAoM3QtNnR0KzN0dHQpIGExXG4gKlxuICogMygxLXQpdHQgYTIgPSAoM3R0LTN0dHQpIGEyXG4gKlxuICogdHR0IGEzXG4gKlxuICogKGEzLTNhMiszYTEtYTApIHR0dCArICgzYTItNmExKzNhMCkgdHQgKyAoM2ExLTNhMCkgdCArIGEwXG4gKi9cblxuZnVuY3Rpb24gQSggY3BzOiBDdWJpY0JlemllckNvbnRyb2xQb2ludHMgKTogbnVtYmVyIHtcbiAgcmV0dXJuIGNwcy5wMyAtIDMuMCAqIGNwcy5wMiArIDMuMCAqIGNwcy5wMSAtIGNwcy5wMDtcbn1cblxuZnVuY3Rpb24gQiggY3BzOiBDdWJpY0JlemllckNvbnRyb2xQb2ludHMgKTogbnVtYmVyIHtcbiAgcmV0dXJuIDMuMCAqIGNwcy5wMiAtIDYuMCAqIGNwcy5wMSArIDMuMCAqIGNwcy5wMDtcbn1cblxuZnVuY3Rpb24gQyggY3BzOiBDdWJpY0JlemllckNvbnRyb2xQb2ludHMgKTogbnVtYmVyIHtcbiAgcmV0dXJuIDMuMCAqIGNwcy5wMSAtIDMuMCAqIGNwcy5wMDtcbn1cblxuZnVuY3Rpb24gY3ViaWNCZXppZXIoIHQ6IG51bWJlciwgY3BzOiBDdWJpY0JlemllckNvbnRyb2xQb2ludHMgKTogbnVtYmVyIHtcbiAgcmV0dXJuICggKCBBKCBjcHMgKSAqIHQgKyBCKCBjcHMgKSApICogdCArIEMoIGNwcyApICkgKiB0ICsgY3BzLnAwO1xufVxuXG5mdW5jdGlvbiBkZWx0YUN1YmljQmV6aWVyKCB0OiBudW1iZXIsIGNwczogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzICk6IG51bWJlciB7XG4gIHJldHVybiAoIDMuMCAqIEEoIGNwcyApICogdCArIDIuMCAqIEIoIGNwcyApICkgKiB0ICsgQyggY3BzICk7XG59XG5cbmZ1bmN0aW9uIHN1YmRpdiggeDogbnVtYmVyLCBhOiBudW1iZXIsIGI6IG51bWJlciwgY3BzOiBDdWJpY0JlemllckNvbnRyb2xQb2ludHMgKTogbnVtYmVyIHtcbiAgbGV0IGNhbmRpZGF0ZVggPSAwO1xuICBsZXQgdCA9IDA7XG5cbiAgZm9yICggbGV0IGkgPSAwOyBpIDwgU1VCRElWX0lURVI7IGkgKysgKSB7XG4gICAgdCA9IGEgKyAoIGIgLSBhICkgLyAyLjA7XG4gICAgY2FuZGlkYXRlWCA9IGN1YmljQmV6aWVyKCB0LCBjcHMgKSAtIHg7XG4gICAgKCAwLjAgPCBjYW5kaWRhdGVYICkgPyAoIGIgPSB0ICkgOiAoIGEgPSB0ICk7XG4gICAgaWYgKCBTVUJESVZfRVBTSUxPTiA8IE1hdGguYWJzKCBjYW5kaWRhdGVYICkgKSB7IGJyZWFrOyB9XG4gIH1cblxuICByZXR1cm4gdDtcbn1cblxuZnVuY3Rpb24gbmV3dG9uKCB4OiBudW1iZXIsIHQ6IG51bWJlciwgY3BzOiBDdWJpY0JlemllckNvbnRyb2xQb2ludHMgKTogbnVtYmVyIHtcbiAgZm9yICggbGV0IGkgPSAwOyBpIDwgTkVXVE9OX0lURVI7IGkgKysgKSB7XG4gICAgY29uc3QgZCA9IGRlbHRhQ3ViaWNCZXppZXIoIHQsIGNwcyApO1xuICAgIGlmICggZCA9PT0gMC4wICkgeyByZXR1cm4gdDsgfVxuICAgIGNvbnN0IGN4ID0gY3ViaWNCZXppZXIoIHQsIGNwcyApIC0geDtcbiAgICB0IC09IGN4IC8gZDtcbiAgfVxuXG4gIHJldHVybiB0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmF3QmV6aWVyRWFzaW5nKFxuICBjcHN4OiBDdWJpY0JlemllckNvbnRyb2xQb2ludHMsXG4gIGNwc3k6IEN1YmljQmV6aWVyQ29udHJvbFBvaW50cyxcbiAgeDogbnVtYmVyXG4pOiBudW1iZXIge1xuICBpZiAoIHggPD0gY3BzeC5wMCApIHsgcmV0dXJuIGNwc3kucDA7IH0gLy8gY2xhbXBlZFxuICBpZiAoIGNwc3gucDMgPD0geCApIHsgcmV0dXJuIGNwc3kucDM7IH0gLy8gY2xhbXBlZFxuXG4gIGNwc3gucDEgPSBjbGFtcCggY3BzeC5wMSwgY3BzeC5wMCwgY3BzeC5wMyApO1xuICBjcHN4LnAyID0gY2xhbXAoIGNwc3gucDIsIGNwc3gucDAsIGNwc3gucDMgKTtcblxuICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBUQUJMRV9TSVpFOyBpICsrICkge1xuICAgIF9fY2FjaGVbIGkgXSA9IGN1YmljQmV6aWVyKCBpIC8gKCBUQUJMRV9TSVpFIC0gMS4wICksIGNwc3ggKTtcbiAgfVxuXG4gIGxldCBzYW1wbGUgPSAwO1xuICBmb3IgKCBsZXQgaSA9IDE7IGkgPCBUQUJMRV9TSVpFOyBpICsrICkge1xuICAgIHNhbXBsZSA9IGkgLSAxO1xuICAgIGlmICggeCA8IF9fY2FjaGVbIGkgXSApIHsgYnJlYWs7IH1cbiAgfVxuXG4gIGNvbnN0IGRpc3QgPSAoIHggLSBfX2NhY2hlWyBzYW1wbGUgXSApIC8gKCBfX2NhY2hlWyBzYW1wbGUgKyAxIF0gLSBfX2NhY2hlWyBzYW1wbGUgXSApO1xuICBsZXQgdCA9ICggc2FtcGxlICsgZGlzdCApIC8gKCBUQUJMRV9TSVpFIC0gMSApO1xuICBjb25zdCBkID0gZGVsdGFDdWJpY0JlemllciggdCwgY3BzeCApIC8gKCBjcHN4LnAzIC0gY3BzeC5wMCApO1xuXG4gIGlmICggTkVXVE9OX0VQU0lMT04gPD0gZCApIHtcbiAgICB0ID0gbmV3dG9uKCB4LCB0LCBjcHN4ICk7XG4gIH0gZWxzZSBpZiAoIGQgIT09IDAuMCApIHtcbiAgICB0ID0gc3ViZGl2KCB4LCAoIHNhbXBsZSApIC8gKCBUQUJMRV9TSVpFIC0gMSApLCAoIHNhbXBsZSArIDEuMCApIC8gKCBUQUJMRV9TSVpFIC0gMSApLCBjcHN4ICk7XG4gIH1cblxuICByZXR1cm4gY3ViaWNCZXppZXIoIHQsIGNwc3kgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJlemllckVhc2luZyggbm9kZTA6IEJlemllck5vZGUsIG5vZGUxOiBCZXppZXJOb2RlLCB0aW1lOiBudW1iZXIgKTogbnVtYmVyIHtcbiAgcmV0dXJuIHJhd0JlemllckVhc2luZyhcbiAgICB7XG4gICAgICBwMDogbm9kZTAudGltZSxcbiAgICAgIHAxOiBub2RlMC50aW1lICsgbm9kZTAub3V0VGltZSxcbiAgICAgIHAyOiBub2RlMS50aW1lICsgbm9kZTEuaW5UaW1lLFxuICAgICAgcDM6IG5vZGUxLnRpbWVcbiAgICB9LFxuICAgIHtcbiAgICAgIHAwOiBub2RlMC52YWx1ZSxcbiAgICAgIHAxOiBub2RlMC52YWx1ZSArIG5vZGUwLm91dFZhbHVlLFxuICAgICAgcDI6IG5vZGUxLnZhbHVlICsgbm9kZTEuaW5WYWx1ZSxcbiAgICAgIHAzOiBub2RlMS52YWx1ZVxuICAgIH0sXG4gICAgdGltZVxuICApO1xufVxuIiwiaW1wb3J0IHsgQXV0b21hdG9uIH0gZnJvbSAnLi9BdXRvbWF0b24nO1xuaW1wb3J0IHsgYmV6aWVyRWFzaW5nIH0gZnJvbSAnLi91dGlscy9iZXppZXJFYXNpbmcnO1xuaW1wb3J0IHR5cGUgeyBCZXppZXJOb2RlIH0gZnJvbSAnLi90eXBlcy9CZXppZXJOb2RlJztcbmltcG9ydCB0eXBlIHsgRnhDb250ZXh0IH0gZnJvbSAnLi90eXBlcy9GeENvbnRleHQnO1xuaW1wb3J0IHR5cGUgeyBGeFNlY3Rpb24gfSBmcm9tICcuL3R5cGVzL0Z4U2VjdGlvbic7XG5pbXBvcnQgdHlwZSB7IFNlcmlhbGl6ZWRDdXJ2ZSB9IGZyb20gJy4vdHlwZXMvU2VyaWFsaXplZEN1cnZlJztcblxuLyoqXG4gKiBJdCByZXByZXNlbnRzIGEgY3VydmUgb2YgQXV0b21hdG9uLlxuICovXG5leHBvcnQgY2xhc3MgQ3VydmUge1xuICAvKipcbiAgICogVGhlIHBhcmVudCBhdXRvbWF0b24uXG4gICAqL1xuICBwcm90ZWN0ZWQgX19hdXRvbWF0b246IEF1dG9tYXRvbjtcblxuICAvKipcbiAgICogQW4gYXJyYXkgb2YgcHJlY2FsY3VsYXRlZCB2YWx1ZS5cbiAgICogSXRzIGxlbmd0aCBpcyBzYW1lIGFzIGBjdXJ2ZS5fX2F1dG9tYXRvbi5yZXNvbHV0aW9uICogY3VydmUuX19hdXRvbWF0b24ubGVuZ3RoICsgMWAuXG4gICovXG4gIHByb3RlY3RlZCBfX3ZhbHVlcyE6IEZsb2F0MzJBcnJheTtcblxuICAvKipcbiAgICogTGlzdCBvZiBiZXppZXIgbm9kZS5cbiAgICovXG4gIHByb3RlY3RlZCBfX25vZGVzOiBCZXppZXJOb2RlW10gPSBbXTtcblxuICAvKipcbiAgICogTGlzdCBvZiBmeCBzZWN0aW9ucy5cbiAgICovXG4gIHByb3RlY3RlZCBfX2Z4czogRnhTZWN0aW9uW10gPSBbXTtcblxuICAvKipcbiAgICogVGhlIGxlbmd0aCBvZiB0aGlzIGN1cnZlLlxuICAgKi9cbiAgcHVibGljIGdldCBsZW5ndGgoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fX25vZGVzWyB0aGlzLl9fbm9kZXMubGVuZ3RoIC0gMSBdLnRpbWU7XG4gIH1cblxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RvciBvZiBhIFtbQ3VydmVdXS5cbiAgICogQHBhcmFtIGF1dG9tYXRvbiBQYXJlbnQgYXV0b21hdG9uXG4gICAqIEBwYXJhbSBkYXRhIERhdGEgb2YgdGhlIGN1cnZlXG4gICAqL1xuICBwdWJsaWMgY29uc3RydWN0b3IoIGF1dG9tYXRvbjogQXV0b21hdG9uLCBkYXRhOiBTZXJpYWxpemVkQ3VydmUgKSB7XG4gICAgdGhpcy5fX2F1dG9tYXRvbiA9IGF1dG9tYXRvbjtcblxuICAgIHRoaXMuZGVzZXJpYWxpemUoIGRhdGEgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkIGEgc2VyaWFsaXplZCBkYXRhIG9mIGEgY3VydmUuXG4gICAqIEBwYXJhbSBkYXRhIERhdGEgb2YgYSBjdXJ2ZVxuICAgKi9cbiAgcHVibGljIGRlc2VyaWFsaXplKCBkYXRhOiBTZXJpYWxpemVkQ3VydmUgKTogdm9pZCB7XG4gICAgdGhpcy5fX25vZGVzID0gZGF0YS5ub2Rlcy5tYXAoICggbm9kZSApID0+ICgge1xuICAgICAgdGltZTogbm9kZVsgMCBdID8/IDAuMCxcbiAgICAgIHZhbHVlOiBub2RlWyAxIF0gPz8gMC4wLFxuICAgICAgaW5UaW1lOiBub2RlWyAyIF0gPz8gMC4wLFxuICAgICAgaW5WYWx1ZTogbm9kZVsgMyBdID8/IDAuMCxcbiAgICAgIG91dFRpbWU6IG5vZGVbIDQgXSA/PyAwLjAsXG4gICAgICBvdXRWYWx1ZTogbm9kZVsgNSBdID8/IDAuMCxcbiAgICB9ICkgKTtcblxuICAgIHRoaXMuX19meHMgPSBbXTtcbiAgICBkYXRhLmZ4cz8uZm9yRWFjaCggKCBmeCApID0+IHtcbiAgICAgIGlmICggZnguYnlwYXNzICkgeyByZXR1cm47IH1cbiAgICAgIHRoaXMuX19meHMucHVzaCgge1xuICAgICAgICB0aW1lOiBmeC50aW1lID8/IDAuMCxcbiAgICAgICAgbGVuZ3RoOiBmeC5sZW5ndGggPz8gMC4wLFxuICAgICAgICByb3c6IGZ4LnJvdyA/PyAwLFxuICAgICAgICBkZWY6IGZ4LmRlZixcbiAgICAgICAgcGFyYW1zOiBmeC5wYXJhbXNcbiAgICAgIH0gKTtcbiAgICB9ICk7XG5cbiAgICB0aGlzLnByZWNhbGMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmVjYWxjdWxhdGUgdmFsdWUgb2Ygc2FtcGxlcy5cbiAgICovXG4gIHB1YmxpYyBwcmVjYWxjKCk6IHZvaWQge1xuICAgIHRoaXMuX192YWx1ZXMgPSBuZXcgRmxvYXQzMkFycmF5KFxuICAgICAgTWF0aC5jZWlsKCB0aGlzLl9fYXV0b21hdG9uLnJlc29sdXRpb24gKiB0aGlzLmxlbmd0aCApICsgMVxuICAgICk7XG5cbiAgICB0aGlzLl9fZ2VuZXJhdGVDdXJ2ZSgpO1xuICAgIHRoaXMuX19hcHBseUZ4cygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiB0aGUgdmFsdWUgb2Ygc3BlY2lmaWVkIHRpbWUgcG9pbnQuXG4gICAqIEBwYXJhbSB0aW1lIFRpbWUgYXQgdGhlIHBvaW50IHlvdSB3YW50IHRvIGdyYWIgdGhlIHZhbHVlLlxuICAgKiBAcmV0dXJucyBSZXN1bHQgdmFsdWVcbiAgICovXG4gIHB1YmxpYyBnZXRWYWx1ZSggdGltZTogbnVtYmVyICk6IG51bWJlciB7XG4gICAgaWYgKCB0aW1lIDwgMC4wICkge1xuICAgICAgLy8gY2xhbXAgbGVmdFxuICAgICAgcmV0dXJuIHRoaXMuX192YWx1ZXNbIDAgXTtcblxuICAgIH0gZWxzZSBpZiAoIHRoaXMubGVuZ3RoIDw9IHRpbWUgKSB7XG4gICAgICAvLyBjbGFtcCByaWdodFxuICAgICAgcmV0dXJuIHRoaXMuX192YWx1ZXNbIHRoaXMuX192YWx1ZXMubGVuZ3RoIC0gMSBdO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGZldGNoIHR3byB2YWx1ZXMgdGhlbiBkbyB0aGUgbGluZWFyIGludGVycG9sYXRpb25cbiAgICAgIGNvbnN0IGluZGV4ID0gdGltZSAqIHRoaXMuX19hdXRvbWF0b24ucmVzb2x1dGlvbjtcbiAgICAgIGNvbnN0IGluZGV4aSA9IE1hdGguZmxvb3IoIGluZGV4ICk7XG4gICAgICBjb25zdCBpbmRleGYgPSBpbmRleCAlIDEuMDtcblxuICAgICAgY29uc3QgdjAgPSB0aGlzLl9fdmFsdWVzWyBpbmRleGkgXTtcbiAgICAgIGNvbnN0IHYxID0gdGhpcy5fX3ZhbHVlc1sgaW5kZXhpICsgMSBdO1xuXG4gICAgICBjb25zdCB2ID0gdjAgKyAoIHYxIC0gdjAgKSAqIGluZGV4ZjtcblxuICAgICAgcmV0dXJuIHY7XG5cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVGhlIGZpcnN0IHN0ZXAgb2Yge0BsaW5rIHByZWNhbGN9OiBnZW5lcmF0ZSBhIGN1cnZlIG91dCBvZiBub2Rlcy5cbiAgICovXG4gIHByb3RlY3RlZCBfX2dlbmVyYXRlQ3VydmUoKTogdm9pZCB7XG4gICAgbGV0IG5vZGVUYWlsID0gdGhpcy5fX25vZGVzWyAwIF07XG4gICAgbGV0IGlUYWlsID0gMDtcbiAgICBmb3IgKCBsZXQgaU5vZGUgPSAwOyBpTm9kZSA8IHRoaXMuX19ub2Rlcy5sZW5ndGggLSAxOyBpTm9kZSArKyApIHtcbiAgICAgIGNvbnN0IG5vZGUwID0gbm9kZVRhaWw7XG4gICAgICBub2RlVGFpbCA9IHRoaXMuX19ub2Rlc1sgaU5vZGUgKyAxIF07XG4gICAgICBjb25zdCBpMCA9IGlUYWlsO1xuICAgICAgaVRhaWwgPSBNYXRoLmZsb29yKCBub2RlVGFpbC50aW1lICogdGhpcy5fX2F1dG9tYXRvbi5yZXNvbHV0aW9uICk7XG5cbiAgICAgIHRoaXMuX192YWx1ZXNbIGkwIF0gPSBub2RlMC52YWx1ZTtcbiAgICAgIGZvciAoIGxldCBpID0gaTAgKyAxOyBpIDw9IGlUYWlsOyBpICsrICkge1xuICAgICAgICBjb25zdCB0aW1lID0gaSAvIHRoaXMuX19hdXRvbWF0b24ucmVzb2x1dGlvbjtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBiZXppZXJFYXNpbmcoIG5vZGUwLCBub2RlVGFpbCwgdGltZSApO1xuICAgICAgICB0aGlzLl9fdmFsdWVzWyBpIF0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKCBsZXQgaSA9IGlUYWlsICsgMTsgaSA8IHRoaXMuX192YWx1ZXMubGVuZ3RoOyBpICsrICkge1xuICAgICAgdGhpcy5fX3ZhbHVlc1sgaSBdID0gbm9kZVRhaWwudmFsdWU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBzZWNvbmQgc3RlcCBvZiB7QGxpbmsgcHJlY2FsY306IGFwcGx5IGZ4cyB0byB0aGUgZ2VuZXJhdGVkIGN1cnZlcy5cbiAgICovXG4gIHByb3RlY3RlZCBfX2FwcGx5RnhzKCk6IHZvaWQge1xuICAgIGZvciAoIGxldCBpRnggPSAwOyBpRnggPCB0aGlzLl9fZnhzLmxlbmd0aDsgaUZ4ICsrICkge1xuICAgICAgY29uc3QgZnggPSB0aGlzLl9fZnhzWyBpRnggXTtcbiAgICAgIGNvbnN0IGZ4RGVmID0gdGhpcy5fX2F1dG9tYXRvbi5nZXRGeERlZmluaXRpb24oIGZ4LmRlZiApO1xuICAgICAgaWYgKCAhZnhEZWYgKSB7XG4gICAgICAgIGlmICggcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdkZXZlbG9wbWVudCcgKSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKCBgTm8gc3VjaCBmeCBkZWZpbml0aW9uOiAkeyBmeC5kZWYgfWAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBhdmFpbGFibGVFbmQgPSBNYXRoLm1pbiggdGhpcy5sZW5ndGgsIGZ4LnRpbWUgKyBmeC5sZW5ndGggKTtcbiAgICAgIGNvbnN0IGkwID0gTWF0aC5jZWlsKCB0aGlzLl9fYXV0b21hdG9uLnJlc29sdXRpb24gKiBmeC50aW1lICk7XG4gICAgICBjb25zdCBpMSA9IE1hdGguZmxvb3IoIHRoaXMuX19hdXRvbWF0b24ucmVzb2x1dGlvbiAqIGF2YWlsYWJsZUVuZCApO1xuICAgICAgaWYgKCBpMSA8PSBpMCApIHtcbiAgICAgICAgaWYgKCBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50JyApIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCAnTGVuZ3RoIG9mIHRoZSBmeCBzZWN0aW9uIGlzIGJlaW5nIG5lZ2F0aXZlJyApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHRlbXBMZW5ndGggPSBpMSAtIGkwICsgMTtcbiAgICAgIGNvbnN0IHRlbXBWYWx1ZXMgPSBuZXcgRmxvYXQzMkFycmF5KCB0ZW1wTGVuZ3RoICk7XG5cbiAgICAgIGNvbnN0IGNvbnRleHQ6IEZ4Q29udGV4dCA9IHtcbiAgICAgICAgaW5kZXg6IGkwLFxuICAgICAgICBpMCxcbiAgICAgICAgaTEsXG4gICAgICAgIHRpbWU6IGZ4LnRpbWUsXG4gICAgICAgIHQwOiBmeC50aW1lLFxuICAgICAgICB0MTogZngudGltZSArIGZ4Lmxlbmd0aCxcbiAgICAgICAgZGVsdGFUaW1lOiAxLjAgLyB0aGlzLl9fYXV0b21hdG9uLnJlc29sdXRpb24sXG4gICAgICAgIHZhbHVlOiAwLjAsXG4gICAgICAgIHByb2dyZXNzOiAwLjAsXG4gICAgICAgIGVsYXBzZWQ6IDAuMCxcbiAgICAgICAgcmVzb2x1dGlvbjogdGhpcy5fX2F1dG9tYXRvbi5yZXNvbHV0aW9uLFxuICAgICAgICBsZW5ndGg6IGZ4Lmxlbmd0aCxcbiAgICAgICAgcGFyYW1zOiBmeC5wYXJhbXMsXG4gICAgICAgIGFycmF5OiB0aGlzLl9fdmFsdWVzLFxuICAgICAgICBnZXRWYWx1ZTogdGhpcy5nZXRWYWx1ZS5iaW5kKCB0aGlzICksXG4gICAgICAgIGluaXQ6IHRydWUsXG4gICAgICAgIHN0YXRlOiB7fVxuICAgICAgfTtcblxuICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGVtcExlbmd0aDsgaSArKyApIHtcbiAgICAgICAgY29udGV4dC5pbmRleCA9IGkgKyBpMDtcbiAgICAgICAgY29udGV4dC50aW1lID0gY29udGV4dC5pbmRleCAvIHRoaXMuX19hdXRvbWF0b24ucmVzb2x1dGlvbjtcbiAgICAgICAgY29udGV4dC52YWx1ZSA9IHRoaXMuX192YWx1ZXNbIGkgKyBpMCBdO1xuICAgICAgICBjb250ZXh0LmVsYXBzZWQgPSBjb250ZXh0LnRpbWUgLSBmeC50aW1lO1xuICAgICAgICBjb250ZXh0LnByb2dyZXNzID0gY29udGV4dC5lbGFwc2VkIC8gZngubGVuZ3RoO1xuICAgICAgICB0ZW1wVmFsdWVzWyBpIF0gPSBmeERlZi5mdW5jKCBjb250ZXh0ICk7XG5cbiAgICAgICAgY29udGV4dC5pbml0ID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX192YWx1ZXMuc2V0KCB0ZW1wVmFsdWVzLCBpMCApO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgQ2hhbm5lbCB9IGZyb20gJy4vQ2hhbm5lbCc7XG5pbXBvcnQgeyBDdXJ2ZSB9IGZyb20gJy4vQ3VydmUnO1xuaW1wb3J0IHR5cGUgeyBBdXRvbWF0b25PcHRpb25zIH0gZnJvbSAnLi90eXBlcy9BdXRvbWF0b25PcHRpb25zJztcbmltcG9ydCB0eXBlIHsgQ2hhbm5lbFVwZGF0ZUV2ZW50IH0gZnJvbSAnLi90eXBlcy9DaGFubmVsVXBkYXRlRXZlbnQnO1xuaW1wb3J0IHR5cGUgeyBGeERlZmluaXRpb24gfSBmcm9tICcuL3R5cGVzL0Z4RGVmaW5pdGlvbic7XG5pbXBvcnQgdHlwZSB7IFNlcmlhbGl6ZWRBdXRvbWF0b24gfSBmcm9tICcuL3R5cGVzL1NlcmlhbGl6ZWRBdXRvbWF0b24nO1xuXG4vKipcbiAqIElUJ1MgQVVUT01BVE9OIVxuICogQHBhcmFtIGRhdGEgU2VyaWFsaXplZCBkYXRhIG9mIHRoZSBhdXRvbWF0b25cbiAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgZm9yIHRoaXMgQXV0b21hdG9uIGluc3RhbmNlXG4gKi9cbmV4cG9ydCBjbGFzcyBBdXRvbWF0b24ge1xuICAvKipcbiAgICogSXQgcmV0dXJucyB0aGUgY3VycmVudCB2YWx1ZSBvZiB0aGUgW1tDaGFubmVsXV0gY2FsbGVkIGBuYW1lYC5cbiAgICogSWYgdGhlIGBuYW1lYCBpcyBhbiBhcnJheSwgaXQgcmV0dXJucyBhIHNldCBvZiBuYW1lIDogY2hhbm5lbCBhcyBhbiBvYmplY3QgaW5zdGVhZC5cbiAgICogWW91IGNhbiBhbHNvIGdpdmUgYSBsaXN0ZW5lciB3aGljaCB3aWxsIGJlIGV4ZWN1dGVkIHdoZW4gdGhlIGNoYW5uZWwgY2hhbmdlcyBpdHMgdmFsdWUgKG9wdGlvbmFsKS5cbiAgICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgb2YgdGhlIGNoYW5uZWxcbiAgICogQHBhcmFtIGxpc3RlbmVyIEEgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIGV4ZWN1dGVkIHdoZW4gdGhlIGNoYW5uZWwgY2hhbmdlcyBpdHMgdmFsdWVcbiAgICogQHJldHVybnMgQ3VycmVudCB2YWx1ZSBvZiB0aGUgY2hhbm5lbFxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IGF1dG8gPSB0aGlzLl9fYXV0by5iaW5kKCB0aGlzICk7XG5cbiAgLyoqXG4gICAqIEN1cnZlcyBvZiB0aGUgYXV0b21hdG9uLlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IGN1cnZlczogQ3VydmVbXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBDaGFubmVscyBvZiB0aGUgdGltZWxpbmUuXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgY2hhbm5lbHM6IENoYW5uZWxbXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBNYXAgb2YgY2hhbm5lbHMsIG5hbWUgdnMuIGNoYW5uZWwgaXRzZWxmLlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IG1hcE5hbWVUb0NoYW5uZWwgPSBuZXcgTWFwPHN0cmluZywgQ2hhbm5lbD4oKTtcblxuICAvKipcbiAgICogQ3VycmVudCB0aW1lIG9mIHRoZSBhdXRvbWF0b24uXG4gICAqIENhbiBiZSBzZXQgYnkgW1t1cGRhdGVdXSwgYmUgcmV0cmlldmVkIGJ5IFtbZ2V0IHRpbWVdXSwgYmUgdXNlZCBieSBbW2F1dG9dXVxuICAgKi9cbiAgcHJvdGVjdGVkIF9fdGltZTogbnVtYmVyID0gMC4wO1xuXG4gIC8qKlxuICAgKiBWZXJzaW9uIG9mIHRoZSBhdXRvbWF0b24uXG4gICAqL1xuICBwcm90ZWN0ZWQgX192ZXJzaW9uOiBzdHJpbmcgPSBwcm9jZXNzLmVudi5WRVJTSU9OITtcblxuICAvKipcbiAgICogUmVzb2x1dGlvbiBvZiB0aGUgdGltZWxpbmUuXG4gICAqL1xuICBwcm90ZWN0ZWQgX19yZXNvbHV0aW9uOiBudW1iZXIgPSAxMDAwO1xuXG4gIC8qKlxuICAgKiBBIG1hcCBvZiBmeCBkZWZpbml0aW9ucy5cbiAgICovXG4gIHByb3RlY3RlZCBfX2Z4RGVmaW5pdGlvbnM6IHsgWyBuYW1lOiBzdHJpbmcgXTogRnhEZWZpbml0aW9uIH0gPSB7fTtcblxuICBwdWJsaWMgY29uc3RydWN0b3IoXG4gICAgZGF0YTogU2VyaWFsaXplZEF1dG9tYXRvbixcbiAgICBvcHRpb25zOiBBdXRvbWF0b25PcHRpb25zID0ge31cbiAgKSB7XG4gICAgb3B0aW9ucy5meERlZmluaXRpb25zICYmIHRoaXMuYWRkRnhEZWZpbml0aW9ucyggb3B0aW9ucy5meERlZmluaXRpb25zICk7XG4gICAgdGhpcy5kZXNlcmlhbGl6ZSggZGF0YSApO1xuICB9XG5cbiAgLyoqXG4gICAqIEN1cnJlbnQgdGltZSBvZiB0aGUgYXV0b21hdG9uLCB0aGF0IGlzIHNldCB2aWEgW1t1cGRhdGVdXS5cbiAgICovXG4gIHB1YmxpYyBnZXQgdGltZSgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fX3RpbWU7IH1cblxuICAvKipcbiAgICogVmVyc2lvbiBvZiB0aGUgYXV0b21hdG9uLlxuICAgKi9cbiAgcHVibGljIGdldCB2ZXJzaW9uKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLl9fdmVyc2lvbjsgfVxuXG4gIC8qKlxuICAgKiBSZXNvbHV0aW9uID0gU2FtcGxpbmcgcG9pbnQgcGVyIHNlY29uZC5cbiAgICovXG4gIHB1YmxpYyBnZXQgcmVzb2x1dGlvbigpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fX3Jlc29sdXRpb247IH1cblxuICAvKipcbiAgICogTG9hZCBzZXJpYWxpemVkIGF1dG9tYXRvbiBkYXRhLlxuICAgKiBAcGFyYW0gZGF0YSBTZXJpYWxpemVkIG9iamVjdCBjb250YWlucyBhdXRvbWF0b24gZGF0YS5cbiAgICovXG4gIHB1YmxpYyBkZXNlcmlhbGl6ZSggZGF0YTogU2VyaWFsaXplZEF1dG9tYXRvbiApOiB2b2lkIHtcbiAgICB0aGlzLl9fcmVzb2x1dGlvbiA9IGRhdGEucmVzb2x1dGlvbjtcblxuICAgIHRoaXMuY3VydmVzLnNwbGljZSggMCApO1xuICAgIHRoaXMuY3VydmVzLnB1c2goXG4gICAgICAuLi5kYXRhLmN1cnZlcy5tYXAoICggZGF0YSApID0+IG5ldyBDdXJ2ZSggdGhpcywgZGF0YSApIClcbiAgICApO1xuXG4gICAgdGhpcy5tYXBOYW1lVG9DaGFubmVsLmNsZWFyKCk7XG5cbiAgICB0aGlzLmNoYW5uZWxzLnNwbGljZSggMCApO1xuICAgIHRoaXMuY2hhbm5lbHMucHVzaChcbiAgICAgIC4uLmRhdGEuY2hhbm5lbHMubWFwKCAoIFsgbmFtZSwgZGF0YSBdICkgPT4ge1xuICAgICAgICBjb25zdCBjaGFubmVsID0gbmV3IENoYW5uZWwoIHRoaXMsIGRhdGEgKTtcblxuICAgICAgICBpZiAoIHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAnZGV2ZWxvcG1lbnQnICkge1xuICAgICAgICAgIGlmICggdGhpcy5tYXBOYW1lVG9DaGFubmVsLmhhcyggbmFtZSApICkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCBgRHVwbGljYXRlZCBjaGFubmVsOiAkeyBuYW1lIH1gICk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5tYXBOYW1lVG9DaGFubmVsLnNldCggbmFtZSwgY2hhbm5lbCApO1xuICAgICAgICByZXR1cm4gY2hhbm5lbDtcbiAgICAgIH0gKVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGZ4IGRlZmluaXRpb25zLlxuICAgKiBAcGFyYW0gZnhEZWZpbml0aW9ucyBBIG1hcCBvZiBpZCAtIGZ4IGRlZmluaXRpb25cbiAgICovXG4gIHB1YmxpYyBhZGRGeERlZmluaXRpb25zKCBmeERlZmluaXRpb25zOiB7IFsgaWQ6IHN0cmluZyBdOiBGeERlZmluaXRpb24gfSApOiB2b2lkIHtcbiAgICBPYmplY3QuZW50cmllcyggZnhEZWZpbml0aW9ucyApLmZvckVhY2goICggWyBpZCwgZnhEZWYgXSApID0+IHtcbiAgICAgIGlmICggdHlwZW9mIGZ4RGVmLmZ1bmMgPT09ICdmdW5jdGlvbicgKSB7IC8vIGlnbm9yZSB1bnJlbGF0ZWQgZW50cmllc1xuICAgICAgICBpZiAoIHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAnZGV2ZWxvcG1lbnQnICkge1xuICAgICAgICAgIGlmICggdGhpcy5fX2Z4RGVmaW5pdGlvbnNbIGlkIF0gIT0gbnVsbCApIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybiggYE92ZXJ3cml0aW5nIHRoZSBleGlzdGluZyBmeCBkZWZpbml0aW9uOiAkeyBpZCB9YCApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX19meERlZmluaXRpb25zWyBpZCBdID0gZnhEZWY7XG4gICAgICB9XG4gICAgfSApO1xuXG4gICAgdGhpcy5wcmVjYWxjQWxsKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgZnggZGVmaW5pdGlvbi5cbiAgICogSWYgaXQgY2FuJ3QgZmluZCB0aGUgZGVmaW5pdGlvbiwgaXQgcmV0dXJucyBgbnVsbGAgaW5zdGVhZC5cbiAgICogQHBhcmFtIGlkIFVuaXF1ZSBpZCBmb3IgdGhlIEZ4IGRlZmluaXRpb25cbiAgICovXG4gIHB1YmxpYyBnZXRGeERlZmluaXRpb24oIGlkOiBzdHJpbmcgKTogRnhEZWZpbml0aW9uIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuX19meERlZmluaXRpb25zWyBpZCBdIHx8IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgY3VydmUuXG4gICAqIEBwYXJhbSBpbmRleCBBbiBpbmRleCBvZiB0aGUgY3VydmVcbiAgICovXG4gIHB1YmxpYyBnZXRDdXJ2ZSggaW5kZXg6IG51bWJlciApOiBDdXJ2ZSB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLmN1cnZlc1sgaW5kZXggXSB8fCBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFByZWNhbGN1bGF0ZSBhbGwgY3VydmVzLlxuICAgKi9cbiAgcHVibGljIHByZWNhbGNBbGwoKTogdm9pZCB7XG4gICAgT2JqZWN0LnZhbHVlcyggdGhpcy5jdXJ2ZXMgKS5mb3JFYWNoKCAoIGN1cnZlICkgPT4gY3VydmUucHJlY2FsYygpICk7XG4gIH1cblxuICAvKipcbiAgICogUmVzZXQgdGhlIGludGVybmFsIHN0YXRlcyBvZiBjaGFubmVscy5cbiAgICogKipDYWxsIHRoaXMgbWV0aG9kIHdoZW4geW91IHNlZWsgdGhlIHRpbWUuKipcbiAgICovXG4gIHB1YmxpYyByZXNldCgpOiB2b2lkIHtcbiAgICBPYmplY3QudmFsdWVzKCB0aGlzLmNoYW5uZWxzICkuZm9yRWFjaCggKCBjaGFubmVsICkgPT4gY2hhbm5lbC5yZXNldCgpICk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBlbnRpcmUgYXV0b21hdG9uLlxuICAgKiAqKllvdSBtYXkgd2FudCB0byBjYWxsIHRoaXMgaW4geW91ciB1cGRhdGUgbG9vcC4qKlxuICAgKiBAcGFyYW0gdGltZSBDdXJyZW50IHRpbWVcbiAgICovXG4gIHB1YmxpYyB1cGRhdGUoIHRpbWU6IG51bWJlciApOiB2b2lkIHtcbiAgICBjb25zdCB0ID0gTWF0aC5tYXgoIHRpbWUsIDAuMCApO1xuXG4gICAgLy8gY2FjaGUgdGhlIHRpbWVcbiAgICB0aGlzLl9fdGltZSA9IHQ7XG5cbiAgICAvLyB1cGRhdGUgY2hhbm5lbHNcbiAgICBjb25zdCBhcnJheSA9IHRoaXMuY2hhbm5lbHMubWFwKCAoIGNoYW5uZWwgKSA9PiBjaGFubmVsLmNvbnN1bWUoIHRoaXMuX190aW1lICkgKS5mbGF0KCAxICk7XG4gICAgYXJyYXkuc29ydCggKCBbIGEgXSwgWyBiIF0gKSA9PiBhIC0gYiApLmZvckVhY2goICggWyBfLCBmdW5jIF0gKSA9PiBmdW5jKCkgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NpZ25lZCB0byB7QGxpbmsgQXV0b21hdG9uI2F1dG99IG9uIGl0cyBpbml0aWFsaXplIHBoYXNlLlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbmFtZSBvZiB0aGUgY2hhbm5lbFxuICAgKiBAcGFyYW0gbGlzdGVuZXIgQSBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgZXhlY3V0ZWQgd2hlbiB0aGUgY2hhbm5lbCBjaGFuZ2VzIGl0cyB2YWx1ZVxuICAgKiBAcmV0dXJucyBDdXJyZW50IHZhbHVlIG9mIHRoZSBjaGFubmVsXG4gICAqL1xuICBwcm90ZWN0ZWQgX19hdXRvKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBsaXN0ZW5lcj86ICggZXZlbnQ6IENoYW5uZWxVcGRhdGVFdmVudCApID0+IHZvaWRcbiAgKTogbnVtYmVyIHtcbiAgICBjb25zdCBjaGFubmVsID0gdGhpcy5tYXBOYW1lVG9DaGFubmVsLmdldCggbmFtZSApO1xuXG4gICAgaWYgKCBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50JyApIHtcbiAgICAgIGlmICggIWNoYW5uZWwgKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvciggYE5vIHN1Y2ggY2hhbm5lbDogJHsgbmFtZSB9YCApO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICggbGlzdGVuZXIgKSB7XG4gICAgICBjaGFubmVsIS5zdWJzY3JpYmUoIGxpc3RlbmVyICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNoYW5uZWwhLmN1cnJlbnRWYWx1ZTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0lBR0E7OztVQUdhLFdBQVc7Ozs7OztRQTZEdEIsWUFBb0IsU0FBb0IsRUFBRSxJQUEyQjtZQUNuRSxJQUFJLENBQUMs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
