/*!
* @fms-cat/automaton v4.0.0
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
         * @param time The current time of the parent [[Automaton]]
         * @returns whether the value has been changed or not
         */
        update(time) {
            let value = this.__value;
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
                    value = item.getValue(elapsed);
                    this.__listeners.forEach((listener) => listener({
                        time,
                        elapsed,
                        begin,
                        end,
                        length,
                        value,
                        progress,
                        init,
                        uninit,
                    }));
                }
            }
            this.__time = time;
            this.__value = value;
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
            this.__version = '4.0.0';
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
            // grab the current value for each channels
            this.channels.forEach((channel) => {
                channel.update(this.__time);
            });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b21hdG9uLmpzIiwic291cmNlcyI6WyIuLi9zcmMvQ2hhbm5lbEl0ZW0udHMiLCIuLi9zcmMvQ2hhbm5lbC50cyIsIi4uL3NyYy91dGlscy9iZXppZXJFYXNpbmcudHMiLCIuLi9zcmMvQ3VydmUudHMiLCIuLi9zcmMvQXV0b21hdG9uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEF1dG9tYXRvbiwgQ3VydmUgfSBmcm9tICcuJztcbmltcG9ydCB0eXBlIHsgU2VyaWFsaXplZENoYW5uZWxJdGVtIH0gZnJvbSAnLi90eXBlcy9TZXJpYWxpemVkQ2hhbm5lbEl0ZW0nO1xuXG4vKipcbiAqIFJlcHJlc2VudHMgYW4gaXRlbSBvZiBhIFtbQ2hhbm5lbF1dLlxuICovXG5leHBvcnQgY2xhc3MgQ2hhbm5lbEl0ZW0ge1xuICAvKipcbiAgICogVGhlIHBhcmVudCBhdXRvbWF0b24uXG4gICAqL1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgX19hdXRvbWF0b246IEF1dG9tYXRvbjtcblxuICAvKipcbiAgICogQmVnaW5uaW5nIHRpbWVwb2ludCBvZiB0aGUgaXRlbS5cbiAgICovXG4gIHB1YmxpYyB0aW1lITogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBMZW5ndGggb2YgdGhlIGl0ZW0uXG4gICAqL1xuICBwdWJsaWMgbGVuZ3RoITogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBWYWx1ZSBvZiB0aGUgaXRlbS5cbiAgICovXG4gIHB1YmxpYyB2YWx1ZSE6IG51bWJlcjtcblxuICAvKipcbiAgICogV2hldGhlciByZXNldCBjaGFubmVscyB2YWx1ZSB0byB6ZXJvIGF0IHRoZSBlbmQgb2YgdGhpcyBpdGVtIG9yIG5vdC5cbiAgICovXG4gIHB1YmxpYyByZXNldD86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFRoaXMgd2lsbCBvbmx5IG1ha2Ugc2Vuc2Ugd2hlbiB7QGxpbmsgY3VydmV9IGlzIHNwZWNpZmllZC5cbiAgICogVGhlIHRpbWUgb2Zmc2V0IG9mIHRoZSBpdGVtLlxuICAgKi9cbiAgcHVibGljIG9mZnNldCE6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhpcyB3aWxsIG9ubHkgbWFrZSBzZW5zZSB3aGVuIHtAbGluayBjdXJ2ZX0gaXMgc3BlY2lmaWVkLlxuICAgKiBUaGUgc3BlZWQgcmF0ZSBvZiB0aGUgaXRlbS5cbiAgICovXG4gIHB1YmxpYyBzcGVlZCE6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhpcyB3aWxsIG9ubHkgbWFrZSBzZW5zZSB3aGVuIHtAbGluayBjdXJ2ZX0gaXMgc3BlY2lmaWVkLlxuICAgKiBUaGUgc2NhbGUgb2YgdGhlIGl0ZW0gaW4gdGhlIHZhbHVlIGF4aXMuXG4gICAqL1xuICBwdWJsaWMgYW1wITogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgY3VydmUgb2YgdGhlIGl0ZW0uXG4gICAqL1xuICBwdWJsaWMgY3VydmU/OiBDdXJ2ZTtcblxuICAvKipcbiAgICogRW5kaW5nIHRpbWVwb2ludCBvZiB0aGUgaXRlbS5cbiAgICovXG4gIHB1YmxpYyBnZXQgZW5kKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMudGltZSArIHRoaXMubGVuZ3RoO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yIG9mIHRoZSBbW0NoYW5uZWxJdGVtXV0uXG4gICAqIEBwYXJhbSBhdXRvbWF0b24gUGFyZW50IGF1dG9tYXRvblxuICAgKiBAcGFyYW0gZGF0YSBEYXRhIG9mIHRoZSBpdGVtXG4gICAqL1xuICBwdWJsaWMgY29uc3RydWN0b3IoIGF1dG9tYXRvbjogQXV0b21hdG9uLCBkYXRhOiBTZXJpYWxpemVkQ2hhbm5lbEl0ZW0gKSB7XG4gICAgdGhpcy5fX2F1dG9tYXRvbiA9IGF1dG9tYXRvbjtcblxuICAgIHRoaXMuZGVzZXJpYWxpemUoIGRhdGEgKTtcbiAgfVxuXG4gIHB1YmxpYyBnZXRWYWx1ZSggdGltZTogbnVtYmVyICk6IG51bWJlciB7XG4gICAgaWYgKCB0aGlzLnJlc2V0ICYmIHRoaXMubGVuZ3RoIDw9IHRpbWUgKSB7XG4gICAgICByZXR1cm4gMC4wO1xuICAgIH1cblxuICAgIGlmICggdGhpcy5jdXJ2ZSApIHtcbiAgICAgIGNvbnN0IHQgPSB0aGlzLm9mZnNldCEgKyB0aW1lICogdGhpcy5zcGVlZCE7XG4gICAgICByZXR1cm4gdGhpcy52YWx1ZSArIHRoaXMuYW1wICogdGhpcy5jdXJ2ZS5nZXRWYWx1ZSggdCApO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy52YWx1ZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRGVzZXJpYWxpemUgYSBzZXJpYWxpemVkIGRhdGEgb2YgaXRlbSBmcm9tIFtbU2VyaWFsaXplZENoYW5uZWxJdGVtXV0uXG4gICAqIEBwYXJhbSBkYXRhIEEgc2VyaWFsaXplZCBpdGVtLlxuICAgKi9cbiAgcHVibGljIGRlc2VyaWFsaXplKCBkYXRhOiBTZXJpYWxpemVkQ2hhbm5lbEl0ZW0gKTogdm9pZCB7XG4gICAgdGhpcy50aW1lID0gZGF0YS50aW1lID8/IDAuMDtcbiAgICB0aGlzLmxlbmd0aCA9IGRhdGEubGVuZ3RoID8/IDAuMDtcbiAgICB0aGlzLnZhbHVlID0gZGF0YS52YWx1ZSA/PyAwLjA7XG4gICAgdGhpcy5vZmZzZXQgPSBkYXRhLm9mZnNldCA/PyAwLjA7XG4gICAgdGhpcy5zcGVlZCA9IGRhdGEuc3BlZWQgPz8gMS4wO1xuICAgIHRoaXMuYW1wID0gZGF0YS5hbXAgPz8gMS4wO1xuICAgIHRoaXMucmVzZXQgPSBkYXRhLnJlc2V0O1xuICAgIGlmICggZGF0YS5jdXJ2ZSAhPSBudWxsICkge1xuICAgICAgdGhpcy5jdXJ2ZSA9IHRoaXMuX19hdXRvbWF0b24uZ2V0Q3VydmUoIGRhdGEuY3VydmUgKSE7XG4gICAgICB0aGlzLmxlbmd0aCA9IGRhdGEubGVuZ3RoID8/IHRoaXMuY3VydmUubGVuZ3RoID8/IDAuMDtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IEF1dG9tYXRvbiB9IGZyb20gJy4vQXV0b21hdG9uJztcbmltcG9ydCB7IENoYW5uZWxJdGVtIH0gZnJvbSAnLi9DaGFubmVsSXRlbSc7XG5pbXBvcnQgdHlwZSB7IENoYW5uZWxVcGRhdGVFdmVudCB9IGZyb20gJy4vdHlwZXMvQ2hhbm5lbFVwZGF0ZUV2ZW50JztcbmltcG9ydCB0eXBlIHsgU2VyaWFsaXplZENoYW5uZWwgfSBmcm9tICcuL3R5cGVzL1NlcmlhbGl6ZWRDaGFubmVsJztcblxuLyoqXG4gKiBJdCByZXByZXNlbnRzIGEgY2hhbm5lbCBvZiBBdXRvbWF0b24uXG4gKi9cbmV4cG9ydCBjbGFzcyBDaGFubmVsIHtcbiAgLyoqXG4gICAqIFRoZSBwYXJlbnQgYXV0b21hdG9uLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fYXV0b21hdG9uOiBBdXRvbWF0b247XG5cbiAgLyoqXG4gICAqIExpc3Qgb2YgY2hhbm5lbCBpdGVtcy5cbiAgICovXG4gIHByb3RlY3RlZCBfX2l0ZW1zOiBDaGFubmVsSXRlbVtdID0gW107XG5cbiAgLyoqXG4gICAqIEEgY2FjaGUgb2YgbGFzdCBjYWxjdWxhdGVkIHZhbHVlLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fdmFsdWU6IG51bWJlciA9IDAuMDtcblxuICAvKipcbiAgICogVGhlIHRpbWUgdGhhdCB3YXMgdXNlZCBmb3IgdGhlIGNhbGN1bGF0aW9uIG9mIFtbX19sYXN0VmFsdWVdXS5cbiAgICovXG4gIHByb3RlY3RlZCBfX3RpbWU6IG51bWJlciA9IC1JbmZpbml0eTtcblxuICAvKipcbiAgICogVGhlIGluZGV4IG9mIFtbX19pdGVtc11dIGl0IHNob3VsZCBldmFsdWF0ZSBuZXh0LlxuICAgKi9cbiAgcHJvdGVjdGVkIF9faGVhZDogbnVtYmVyID0gMDtcblxuICAvKipcbiAgICogQW4gYXJyYXkgb2YgbGlzdGVuZXJzLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fbGlzdGVuZXJzOiBBcnJheTwoIGV2ZW50OiBDaGFubmVsVXBkYXRlRXZlbnQgKSA9PiB2b2lkPiA9IFtdO1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RvciBvZiB0aGUgW1tDaGFubmVsXV0uXG4gICAqIEBwYXJhbSBhdXRvbWF0b24gUGFyZW50IGF1dG9tYXRvblxuICAgKiBAcGFyYW0gZGF0YSBEYXRhIG9mIHRoZSBjaGFubmVsXG4gICAqL1xuICBwdWJsaWMgY29uc3RydWN0b3IoIGF1dG9tYXRvbjogQXV0b21hdG9uLCBkYXRhOiBTZXJpYWxpemVkQ2hhbm5lbCApIHtcbiAgICB0aGlzLl9fYXV0b21hdG9uID0gYXV0b21hdG9uO1xuXG4gICAgdGhpcy5kZXNlcmlhbGl6ZSggZGF0YSApO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgY2FjaGUgb2YgbGFzdCBjYWxjdWxhdGVkIHZhbHVlLlxuICAgKi9cbiAgcHVibGljIGdldCBjdXJyZW50VmFsdWUoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX192YWx1ZTsgfVxuXG4gIC8qKlxuICAgKiBUaGUgdGltZSB0aGF0IHdhcyB1c2VkIGZvciB0aGUgY2FsY3VsYXRpb24gb2YgW1tfX2xhc3RWYWx1ZV1dLlxuICAgKi9cbiAgcHVibGljIGdldCBjdXJyZW50VGltZSgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fX3RpbWU7IH1cblxuICAvKipcbiAgICogTG9hZCBhIHNlcmlhbGl6ZWQgZGF0YSBvZiBhIGNoYW5uZWwuXG4gICAqIEBwYXJhbSBkYXRhIERhdGEgb2YgYSBjaGFubmVsXG4gICAqL1xuICBwdWJsaWMgZGVzZXJpYWxpemUoIGRhdGE6IFNlcmlhbGl6ZWRDaGFubmVsICk6IHZvaWQge1xuICAgIHRoaXMuX19pdGVtcyA9IGRhdGEuaXRlbXM/Lm1hcCggKCBpdGVtICkgPT4gbmV3IENoYW5uZWxJdGVtKCB0aGlzLl9fYXV0b21hdG9uLCBpdGVtICkgKSA/PyBbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgaW50ZXJuYWwgc3RhdGVzLlxuICAgKiBDYWxsIHRoaXMgbWV0aG9kIHdoZW4geW91IHNlZWsgdGhlIHRpbWUuXG4gICAqL1xuICBwdWJsaWMgcmVzZXQoKTogdm9pZCB7XG4gICAgdGhpcy5fX3RpbWUgPSAtSW5maW5pdHk7XG4gICAgdGhpcy5fX3ZhbHVlID0gMDtcbiAgICB0aGlzLl9faGVhZCA9IDA7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGEgbmV3IGxpc3RlbmVyIHRoYXQgcmVjZWl2ZXMgYSBbW0NoYW5uZWxVcGRhdGVFdmVudF1dIHdoZW4gYW4gdXBkYXRlIGlzIGhhcHBlbmVkLlxuICAgKiBAcGFyYW0gbGlzdGVuZXIgQSBzdWJzY3JpYmluZyBsaXN0ZW5lclxuICAgKi9cbiAgcHVibGljIHN1YnNjcmliZSggbGlzdGVuZXI6ICggZXZlbnQ6IENoYW5uZWxVcGRhdGVFdmVudCApID0+IHZvaWQgKTogdm9pZCB7XG4gICAgdGhpcy5fX2xpc3RlbmVycy5wdXNoKCBsaXN0ZW5lciApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiB0aGUgdmFsdWUgb2Ygc3BlY2lmaWVkIHRpbWUgcG9pbnQuXG4gICAqIEBwYXJhbSB0aW1lIFRpbWUgYXQgdGhlIHBvaW50IHlvdSB3YW50IHRvIGdyYWIgdGhlIHZhbHVlLlxuICAgKiBAcmV0dXJucyBSZXN1bHQgdmFsdWVcbiAgICovXG4gIHB1YmxpYyBnZXRWYWx1ZSggdGltZTogbnVtYmVyICk6IG51bWJlciB7XG4gICAgbGV0IG5leHQgPSB0aGlzLl9faXRlbXMuZmluZEluZGV4KCAoIGl0ZW0gKSA9PiAoIHRpbWUgPCBpdGVtLnRpbWUgKSApO1xuXG4gICAgLy8gaXQncyB0aGUgZmlyc3Qgb25lIVxuICAgIGlmICggbmV4dCA9PT0gMCApIHtcbiAgICAgIHJldHVybiAwLjA7XG4gICAgfVxuXG4gICAgLy8gaXQncyB0aGUgbGFzdCBvbmUhXG4gICAgaWYgKCBuZXh0ID09PSAtMSApIHtcbiAgICAgIG5leHQgPSB0aGlzLl9faXRlbXMubGVuZ3RoO1xuICAgIH1cblxuICAgIGNvbnN0IGl0ZW0gPSB0aGlzLl9faXRlbXNbIG5leHQgLSAxIF07XG4gICAgaWYgKCBpdGVtLmVuZCA8IHRpbWUgKSB7XG4gICAgICByZXR1cm4gaXRlbS5nZXRWYWx1ZSggaXRlbS5sZW5ndGggKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGl0ZW0uZ2V0VmFsdWUoIHRpbWUgLSBpdGVtLnRpbWUgKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVGhpcyBtZXRob2QgaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBieSBbW0F1dG9tYXRvbi51cGRhdGVdXS5cbiAgICogQHBhcmFtIHRpbWUgVGhlIGN1cnJlbnQgdGltZSBvZiB0aGUgcGFyZW50IFtbQXV0b21hdG9uXV1cbiAgICogQHJldHVybnMgd2hldGhlciB0aGUgdmFsdWUgaGFzIGJlZW4gY2hhbmdlZCBvciBub3RcbiAgICovXG4gIHB1YmxpYyB1cGRhdGUoIHRpbWU6IG51bWJlciApOiB2b2lkIHtcbiAgICBsZXQgdmFsdWUgPSB0aGlzLl9fdmFsdWU7XG4gICAgY29uc3QgcHJldlRpbWUgPSB0aGlzLl9fdGltZTtcblxuICAgIGZvciAoIGxldCBpID0gdGhpcy5fX2hlYWQ7IGkgPCB0aGlzLl9faXRlbXMubGVuZ3RoOyBpICsrICkge1xuICAgICAgY29uc3QgaXRlbSA9IHRoaXMuX19pdGVtc1sgaSBdO1xuICAgICAgY29uc3QgeyB0aW1lOiBiZWdpbiwgZW5kLCBsZW5ndGggfSA9IGl0ZW07XG4gICAgICBsZXQgZWxhcHNlZCA9IHRpbWUgLSBiZWdpbjtcblxuICAgICAgaWYgKCBlbGFwc2VkIDwgMC4wICkge1xuICAgICAgICBicmVhaztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBwcm9ncmVzczogbnVtYmVyO1xuICAgICAgICBsZXQgaW5pdDogdHJ1ZSB8IHVuZGVmaW5lZDtcbiAgICAgICAgbGV0IHVuaW5pdDogdHJ1ZSB8IHVuZGVmaW5lZDtcblxuICAgICAgICBpZiAoIGxlbmd0aCA8PSBlbGFwc2VkICkge1xuICAgICAgICAgIGVsYXBzZWQgPSBsZW5ndGg7XG4gICAgICAgICAgcHJvZ3Jlc3MgPSAxLjA7XG4gICAgICAgICAgdW5pbml0ID0gdHJ1ZTtcblxuICAgICAgICAgIGlmICggaSA9PT0gdGhpcy5fX2hlYWQgKSB7XG4gICAgICAgICAgICB0aGlzLl9faGVhZCArKztcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcHJvZ3Jlc3MgPSBsZW5ndGggIT09IDAuMFxuICAgICAgICAgICAgPyBlbGFwc2VkIC8gbGVuZ3RoXG4gICAgICAgICAgICA6IDEuMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggcHJldlRpbWUgPCBiZWdpbiApIHtcbiAgICAgICAgICBpbml0ID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhbHVlID0gaXRlbS5nZXRWYWx1ZSggZWxhcHNlZCApO1xuXG4gICAgICAgIHRoaXMuX19saXN0ZW5lcnMuZm9yRWFjaCggKCBsaXN0ZW5lciApID0+IGxpc3RlbmVyKCB7XG4gICAgICAgICAgdGltZSxcbiAgICAgICAgICBlbGFwc2VkLFxuICAgICAgICAgIGJlZ2luLFxuICAgICAgICAgIGVuZCxcbiAgICAgICAgICBsZW5ndGgsXG4gICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgcHJvZ3Jlc3MsXG4gICAgICAgICAgaW5pdCxcbiAgICAgICAgICB1bmluaXQsXG4gICAgICAgIH0gKSApO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX190aW1lID0gdGltZTtcbiAgICB0aGlzLl9fdmFsdWUgPSB2YWx1ZTtcbiAgfVxufVxuIiwiaW1wb3J0IHR5cGUgeyBCZXppZXJOb2RlIH0gZnJvbSAnLi4vdHlwZXMvQmV6aWVyTm9kZSc7XG5cbmludGVyZmFjZSBDdWJpY0JlemllckNvbnRyb2xQb2ludHMge1xuICBwMDogbnVtYmVyO1xuICBwMTogbnVtYmVyO1xuICBwMjogbnVtYmVyO1xuICBwMzogbnVtYmVyO1xufVxuXG5jb25zdCBORVdUT05fSVRFUiA9IDQ7XG5jb25zdCBORVdUT05fRVBTSUxPTiA9IDAuMDAxO1xuY29uc3QgU1VCRElWX0lURVIgPSAxMDtcbmNvbnN0IFNVQkRJVl9FUFNJTE9OID0gMC4wMDAwMDE7XG5jb25zdCBUQUJMRV9TSVpFID0gMjE7XG5cbmNvbnN0IF9fY2FjaGU6IG51bWJlcltdID0gW107XG5cbmZ1bmN0aW9uIGNsYW1wKCB4OiBudW1iZXIsIG1pbjogbnVtYmVyLCBtYXg6IG51bWJlciApOiBudW1iZXIge1xuICByZXR1cm4gTWF0aC5taW4oIE1hdGgubWF4KCB4LCBtaW4gKSwgbWF4ICk7XG59XG5cbi8qXG4gKiAoMS10KSgxLXQpKDEtdCkgYTAgPSAoMS0ydCt0dCkoMS10KSBhMFxuICogICAgICAgICAgICAgICAgICAgID0gKDEtdC0ydCsydHQrdHQtdHR0KSBhMFxuICogICAgICAgICAgICAgICAgICAgID0gKDEtM3QrM3R0LXR0dCkgYTBcbiAqXG4gKiAzKDEtdCkoMS10KXQgYTEgPSAzKDEtMnQrdHQpdCBhMVxuICogICAgICAgICAgICAgICAgID0gKDN0LTZ0dCszdHR0KSBhMVxuICpcbiAqIDMoMS10KXR0IGEyID0gKDN0dC0zdHR0KSBhMlxuICpcbiAqIHR0dCBhM1xuICpcbiAqIChhMy0zYTIrM2ExLWEwKSB0dHQgKyAoM2EyLTZhMSszYTApIHR0ICsgKDNhMS0zYTApIHQgKyBhMFxuICovXG5cbmZ1bmN0aW9uIEEoIGNwczogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzICk6IG51bWJlciB7XG4gIHJldHVybiBjcHMucDMgLSAzLjAgKiBjcHMucDIgKyAzLjAgKiBjcHMucDEgLSBjcHMucDA7XG59XG5cbmZ1bmN0aW9uIEIoIGNwczogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzICk6IG51bWJlciB7XG4gIHJldHVybiAzLjAgKiBjcHMucDIgLSA2LjAgKiBjcHMucDEgKyAzLjAgKiBjcHMucDA7XG59XG5cbmZ1bmN0aW9uIEMoIGNwczogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzICk6IG51bWJlciB7XG4gIHJldHVybiAzLjAgKiBjcHMucDEgLSAzLjAgKiBjcHMucDA7XG59XG5cbmZ1bmN0aW9uIGN1YmljQmV6aWVyKCB0OiBudW1iZXIsIGNwczogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzICk6IG51bWJlciB7XG4gIHJldHVybiAoICggQSggY3BzICkgKiB0ICsgQiggY3BzICkgKSAqIHQgKyBDKCBjcHMgKSApICogdCArIGNwcy5wMDtcbn1cblxuZnVuY3Rpb24gZGVsdGFDdWJpY0JlemllciggdDogbnVtYmVyLCBjcHM6IEN1YmljQmV6aWVyQ29udHJvbFBvaW50cyApOiBudW1iZXIge1xuICByZXR1cm4gKCAzLjAgKiBBKCBjcHMgKSAqIHQgKyAyLjAgKiBCKCBjcHMgKSApICogdCArIEMoIGNwcyApO1xufVxuXG5mdW5jdGlvbiBzdWJkaXYoIHg6IG51bWJlciwgYTogbnVtYmVyLCBiOiBudW1iZXIsIGNwczogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzICk6IG51bWJlciB7XG4gIGxldCBjYW5kaWRhdGVYID0gMDtcbiAgbGV0IHQgPSAwO1xuXG4gIGZvciAoIGxldCBpID0gMDsgaSA8IFNVQkRJVl9JVEVSOyBpICsrICkge1xuICAgIHQgPSBhICsgKCBiIC0gYSApIC8gMi4wO1xuICAgIGNhbmRpZGF0ZVggPSBjdWJpY0JlemllciggdCwgY3BzICkgLSB4O1xuICAgICggMC4wIDwgY2FuZGlkYXRlWCApID8gKCBiID0gdCApIDogKCBhID0gdCApO1xuICAgIGlmICggU1VCRElWX0VQU0lMT04gPCBNYXRoLmFicyggY2FuZGlkYXRlWCApICkgeyBicmVhazsgfVxuICB9XG5cbiAgcmV0dXJuIHQ7XG59XG5cbmZ1bmN0aW9uIG5ld3RvbiggeDogbnVtYmVyLCB0OiBudW1iZXIsIGNwczogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzICk6IG51bWJlciB7XG4gIGZvciAoIGxldCBpID0gMDsgaSA8IE5FV1RPTl9JVEVSOyBpICsrICkge1xuICAgIGNvbnN0IGQgPSBkZWx0YUN1YmljQmV6aWVyKCB0LCBjcHMgKTtcbiAgICBpZiAoIGQgPT09IDAuMCApIHsgcmV0dXJuIHQ7IH1cbiAgICBjb25zdCBjeCA9IGN1YmljQmV6aWVyKCB0LCBjcHMgKSAtIHg7XG4gICAgdCAtPSBjeCAvIGQ7XG4gIH1cblxuICByZXR1cm4gdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJhd0JlemllckVhc2luZyhcbiAgY3BzeDogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzLFxuICBjcHN5OiBDdWJpY0JlemllckNvbnRyb2xQb2ludHMsXG4gIHg6IG51bWJlclxuKTogbnVtYmVyIHtcbiAgaWYgKCB4IDw9IGNwc3gucDAgKSB7IHJldHVybiBjcHN5LnAwOyB9IC8vIGNsYW1wZWRcbiAgaWYgKCBjcHN4LnAzIDw9IHggKSB7IHJldHVybiBjcHN5LnAzOyB9IC8vIGNsYW1wZWRcblxuICBjcHN4LnAxID0gY2xhbXAoIGNwc3gucDEsIGNwc3gucDAsIGNwc3gucDMgKTtcbiAgY3BzeC5wMiA9IGNsYW1wKCBjcHN4LnAyLCBjcHN4LnAwLCBjcHN4LnAzICk7XG5cbiAgZm9yICggbGV0IGkgPSAwOyBpIDwgVEFCTEVfU0laRTsgaSArKyApIHtcbiAgICBfX2NhY2hlWyBpIF0gPSBjdWJpY0JlemllciggaSAvICggVEFCTEVfU0laRSAtIDEuMCApLCBjcHN4ICk7XG4gIH1cblxuICBsZXQgc2FtcGxlID0gMDtcbiAgZm9yICggbGV0IGkgPSAxOyBpIDwgVEFCTEVfU0laRTsgaSArKyApIHtcbiAgICBzYW1wbGUgPSBpIC0gMTtcbiAgICBpZiAoIHggPCBfX2NhY2hlWyBpIF0gKSB7IGJyZWFrOyB9XG4gIH1cblxuICBjb25zdCBkaXN0ID0gKCB4IC0gX19jYWNoZVsgc2FtcGxlIF0gKSAvICggX19jYWNoZVsgc2FtcGxlICsgMSBdIC0gX19jYWNoZVsgc2FtcGxlIF0gKTtcbiAgbGV0IHQgPSAoIHNhbXBsZSArIGRpc3QgKSAvICggVEFCTEVfU0laRSAtIDEgKTtcbiAgY29uc3QgZCA9IGRlbHRhQ3ViaWNCZXppZXIoIHQsIGNwc3ggKSAvICggY3BzeC5wMyAtIGNwc3gucDAgKTtcblxuICBpZiAoIE5FV1RPTl9FUFNJTE9OIDw9IGQgKSB7XG4gICAgdCA9IG5ld3RvbiggeCwgdCwgY3BzeCApO1xuICB9IGVsc2UgaWYgKCBkICE9PSAwLjAgKSB7XG4gICAgdCA9IHN1YmRpdiggeCwgKCBzYW1wbGUgKSAvICggVEFCTEVfU0laRSAtIDEgKSwgKCBzYW1wbGUgKyAxLjAgKSAvICggVEFCTEVfU0laRSAtIDEgKSwgY3BzeCApO1xuICB9XG5cbiAgcmV0dXJuIGN1YmljQmV6aWVyKCB0LCBjcHN5ICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBiZXppZXJFYXNpbmcoIG5vZGUwOiBCZXppZXJOb2RlLCBub2RlMTogQmV6aWVyTm9kZSwgdGltZTogbnVtYmVyICk6IG51bWJlciB7XG4gIHJldHVybiByYXdCZXppZXJFYXNpbmcoXG4gICAge1xuICAgICAgcDA6IG5vZGUwLnRpbWUsXG4gICAgICBwMTogbm9kZTAudGltZSArIG5vZGUwLm91dFRpbWUsXG4gICAgICBwMjogbm9kZTEudGltZSArIG5vZGUxLmluVGltZSxcbiAgICAgIHAzOiBub2RlMS50aW1lXG4gICAgfSxcbiAgICB7XG4gICAgICBwMDogbm9kZTAudmFsdWUsXG4gICAgICBwMTogbm9kZTAudmFsdWUgKyBub2RlMC5vdXRWYWx1ZSxcbiAgICAgIHAyOiBub2RlMS52YWx1ZSArIG5vZGUxLmluVmFsdWUsXG4gICAgICBwMzogbm9kZTEudmFsdWVcbiAgICB9LFxuICAgIHRpbWVcbiAgKTtcbn1cbiIsImltcG9ydCB7IEF1dG9tYXRvbiB9IGZyb20gJy4vQXV0b21hdG9uJztcbmltcG9ydCB7IGJlemllckVhc2luZyB9IGZyb20gJy4vdXRpbHMvYmV6aWVyRWFzaW5nJztcbmltcG9ydCB0eXBlIHsgQmV6aWVyTm9kZSB9IGZyb20gJy4vdHlwZXMvQmV6aWVyTm9kZSc7XG5pbXBvcnQgdHlwZSB7IEZ4Q29udGV4dCB9IGZyb20gJy4vdHlwZXMvRnhDb250ZXh0JztcbmltcG9ydCB0eXBlIHsgRnhTZWN0aW9uIH0gZnJvbSAnLi90eXBlcy9GeFNlY3Rpb24nO1xuaW1wb3J0IHR5cGUgeyBTZXJpYWxpemVkQ3VydmUgfSBmcm9tICcuL3R5cGVzL1NlcmlhbGl6ZWRDdXJ2ZSc7XG5cbi8qKlxuICogSXQgcmVwcmVzZW50cyBhIGN1cnZlIG9mIEF1dG9tYXRvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIEN1cnZlIHtcbiAgLyoqXG4gICAqIFRoZSBwYXJlbnQgYXV0b21hdG9uLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fYXV0b21hdG9uOiBBdXRvbWF0b247XG5cbiAgLyoqXG4gICAqIEFuIGFycmF5IG9mIHByZWNhbGN1bGF0ZWQgdmFsdWUuXG4gICAqIEl0cyBsZW5ndGggaXMgc2FtZSBhcyBgY3VydmUuX19hdXRvbWF0b24ucmVzb2x1dGlvbiAqIGN1cnZlLl9fYXV0b21hdG9uLmxlbmd0aCArIDFgLlxuICAqL1xuICBwcm90ZWN0ZWQgX192YWx1ZXMhOiBGbG9hdDMyQXJyYXk7XG5cbiAgLyoqXG4gICAqIExpc3Qgb2YgYmV6aWVyIG5vZGUuXG4gICAqL1xuICBwcm90ZWN0ZWQgX19ub2RlczogQmV6aWVyTm9kZVtdID0gW107XG5cbiAgLyoqXG4gICAqIExpc3Qgb2YgZnggc2VjdGlvbnMuXG4gICAqL1xuICBwcm90ZWN0ZWQgX19meHM6IEZ4U2VjdGlvbltdID0gW107XG5cbiAgLyoqXG4gICAqIFRoZSBsZW5ndGggb2YgdGhpcyBjdXJ2ZS5cbiAgICovXG4gIHB1YmxpYyBnZXQgbGVuZ3RoKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX19ub2Rlc1sgdGhpcy5fX25vZGVzLmxlbmd0aCAtIDEgXS50aW1lO1xuICB9XG5cblxuICAvKipcbiAgICogQ29uc3RydWN0b3Igb2YgYSBbW0N1cnZlXV0uXG4gICAqIEBwYXJhbSBhdXRvbWF0b24gUGFyZW50IGF1dG9tYXRvblxuICAgKiBAcGFyYW0gZGF0YSBEYXRhIG9mIHRoZSBjdXJ2ZVxuICAgKi9cbiAgcHVibGljIGNvbnN0cnVjdG9yKCBhdXRvbWF0b246IEF1dG9tYXRvbiwgZGF0YTogU2VyaWFsaXplZEN1cnZlICkge1xuICAgIHRoaXMuX19hdXRvbWF0b24gPSBhdXRvbWF0b247XG5cbiAgICB0aGlzLmRlc2VyaWFsaXplKCBkYXRhICk7XG4gIH1cblxuICAvKipcbiAgICogTG9hZCBhIHNlcmlhbGl6ZWQgZGF0YSBvZiBhIGN1cnZlLlxuICAgKiBAcGFyYW0gZGF0YSBEYXRhIG9mIGEgY3VydmVcbiAgICovXG4gIHB1YmxpYyBkZXNlcmlhbGl6ZSggZGF0YTogU2VyaWFsaXplZEN1cnZlICk6IHZvaWQge1xuICAgIHRoaXMuX19ub2RlcyA9IGRhdGEubm9kZXMubWFwKCAoIG5vZGUgKSA9PiAoIHtcbiAgICAgIHRpbWU6IG5vZGVbIDAgXSA/PyAwLjAsXG4gICAgICB2YWx1ZTogbm9kZVsgMSBdID8/IDAuMCxcbiAgICAgIGluVGltZTogbm9kZVsgMiBdID8/IDAuMCxcbiAgICAgIGluVmFsdWU6IG5vZGVbIDMgXSA/PyAwLjAsXG4gICAgICBvdXRUaW1lOiBub2RlWyA0IF0gPz8gMC4wLFxuICAgICAgb3V0VmFsdWU6IG5vZGVbIDUgXSA/PyAwLjAsXG4gICAgfSApICk7XG5cbiAgICB0aGlzLl9fZnhzID0gW107XG4gICAgZGF0YS5meHM/LmZvckVhY2goICggZnggKSA9PiB7XG4gICAgICBpZiAoIGZ4LmJ5cGFzcyApIHsgcmV0dXJuOyB9XG4gICAgICB0aGlzLl9fZnhzLnB1c2goIHtcbiAgICAgICAgdGltZTogZngudGltZSA/PyAwLjAsXG4gICAgICAgIGxlbmd0aDogZngubGVuZ3RoID8/IDAuMCxcbiAgICAgICAgcm93OiBmeC5yb3cgPz8gMCxcbiAgICAgICAgZGVmOiBmeC5kZWYsXG4gICAgICAgIHBhcmFtczogZngucGFyYW1zXG4gICAgICB9ICk7XG4gICAgfSApO1xuXG4gICAgdGhpcy5wcmVjYWxjKCk7XG4gIH1cblxuICAvKipcbiAgICogUHJlY2FsY3VsYXRlIHZhbHVlIG9mIHNhbXBsZXMuXG4gICAqL1xuICBwdWJsaWMgcHJlY2FsYygpOiB2b2lkIHtcbiAgICB0aGlzLl9fdmFsdWVzID0gbmV3IEZsb2F0MzJBcnJheShcbiAgICAgIE1hdGguY2VpbCggdGhpcy5fX2F1dG9tYXRvbi5yZXNvbHV0aW9uICogdGhpcy5sZW5ndGggKSArIDFcbiAgICApO1xuXG4gICAgdGhpcy5fX2dlbmVyYXRlQ3VydmUoKTtcbiAgICB0aGlzLl9fYXBwbHlGeHMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIHZhbHVlIG9mIHNwZWNpZmllZCB0aW1lIHBvaW50LlxuICAgKiBAcGFyYW0gdGltZSBUaW1lIGF0IHRoZSBwb2ludCB5b3Ugd2FudCB0byBncmFiIHRoZSB2YWx1ZS5cbiAgICogQHJldHVybnMgUmVzdWx0IHZhbHVlXG4gICAqL1xuICBwdWJsaWMgZ2V0VmFsdWUoIHRpbWU6IG51bWJlciApOiBudW1iZXIge1xuICAgIGlmICggdGltZSA8IDAuMCApIHtcbiAgICAgIC8vIGNsYW1wIGxlZnRcbiAgICAgIHJldHVybiB0aGlzLl9fdmFsdWVzWyAwIF07XG5cbiAgICB9IGVsc2UgaWYgKCB0aGlzLmxlbmd0aCA8PSB0aW1lICkge1xuICAgICAgLy8gY2xhbXAgcmlnaHRcbiAgICAgIHJldHVybiB0aGlzLl9fdmFsdWVzWyB0aGlzLl9fdmFsdWVzLmxlbmd0aCAtIDEgXTtcblxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBmZXRjaCB0d28gdmFsdWVzIHRoZW4gZG8gdGhlIGxpbmVhciBpbnRlcnBvbGF0aW9uXG4gICAgICBjb25zdCBpbmRleCA9IHRpbWUgKiB0aGlzLl9fYXV0b21hdG9uLnJlc29sdXRpb247XG4gICAgICBjb25zdCBpbmRleGkgPSBNYXRoLmZsb29yKCBpbmRleCApO1xuICAgICAgY29uc3QgaW5kZXhmID0gaW5kZXggJSAxLjA7XG5cbiAgICAgIGNvbnN0IHYwID0gdGhpcy5fX3ZhbHVlc1sgaW5kZXhpIF07XG4gICAgICBjb25zdCB2MSA9IHRoaXMuX192YWx1ZXNbIGluZGV4aSArIDEgXTtcblxuICAgICAgY29uc3QgdiA9IHYwICsgKCB2MSAtIHYwICkgKiBpbmRleGY7XG5cbiAgICAgIHJldHVybiB2O1xuXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBmaXJzdCBzdGVwIG9mIHtAbGluayBwcmVjYWxjfTogZ2VuZXJhdGUgYSBjdXJ2ZSBvdXQgb2Ygbm9kZXMuXG4gICAqL1xuICBwcm90ZWN0ZWQgX19nZW5lcmF0ZUN1cnZlKCk6IHZvaWQge1xuICAgIGxldCBub2RlVGFpbCA9IHRoaXMuX19ub2Rlc1sgMCBdO1xuICAgIGxldCBpVGFpbCA9IDA7XG4gICAgZm9yICggbGV0IGlOb2RlID0gMDsgaU5vZGUgPCB0aGlzLl9fbm9kZXMubGVuZ3RoIC0gMTsgaU5vZGUgKysgKSB7XG4gICAgICBjb25zdCBub2RlMCA9IG5vZGVUYWlsO1xuICAgICAgbm9kZVRhaWwgPSB0aGlzLl9fbm9kZXNbIGlOb2RlICsgMSBdO1xuICAgICAgY29uc3QgaTAgPSBpVGFpbDtcbiAgICAgIGlUYWlsID0gTWF0aC5mbG9vciggbm9kZVRhaWwudGltZSAqIHRoaXMuX19hdXRvbWF0b24ucmVzb2x1dGlvbiApO1xuXG4gICAgICB0aGlzLl9fdmFsdWVzWyBpMCBdID0gbm9kZTAudmFsdWU7XG4gICAgICBmb3IgKCBsZXQgaSA9IGkwICsgMTsgaSA8PSBpVGFpbDsgaSArKyApIHtcbiAgICAgICAgY29uc3QgdGltZSA9IGkgLyB0aGlzLl9fYXV0b21hdG9uLnJlc29sdXRpb247XG4gICAgICAgIGNvbnN0IHZhbHVlID0gYmV6aWVyRWFzaW5nKCBub2RlMCwgbm9kZVRhaWwsIHRpbWUgKTtcbiAgICAgICAgdGhpcy5fX3ZhbHVlc1sgaSBdID0gdmFsdWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yICggbGV0IGkgPSBpVGFpbCArIDE7IGkgPCB0aGlzLl9fdmFsdWVzLmxlbmd0aDsgaSArKyApIHtcbiAgICAgIHRoaXMuX192YWx1ZXNbIGkgXSA9IG5vZGVUYWlsLnZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgc2Vjb25kIHN0ZXAgb2Yge0BsaW5rIHByZWNhbGN9OiBhcHBseSBmeHMgdG8gdGhlIGdlbmVyYXRlZCBjdXJ2ZXMuXG4gICAqL1xuICBwcm90ZWN0ZWQgX19hcHBseUZ4cygpOiB2b2lkIHtcbiAgICBmb3IgKCBsZXQgaUZ4ID0gMDsgaUZ4IDwgdGhpcy5fX2Z4cy5sZW5ndGg7IGlGeCArKyApIHtcbiAgICAgIGNvbnN0IGZ4ID0gdGhpcy5fX2Z4c1sgaUZ4IF07XG4gICAgICBjb25zdCBmeERlZiA9IHRoaXMuX19hdXRvbWF0b24uZ2V0RnhEZWZpbml0aW9uKCBmeC5kZWYgKTtcbiAgICAgIGlmICggIWZ4RGVmICkge1xuICAgICAgICBpZiAoIHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAnZGV2ZWxvcG1lbnQnICkge1xuICAgICAgICAgIGNvbnNvbGUud2FybiggYE5vIHN1Y2ggZnggZGVmaW5pdGlvbjogJHsgZnguZGVmIH1gICk7XG4gICAgICAgIH1cblxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgYXZhaWxhYmxlRW5kID0gTWF0aC5taW4oIHRoaXMubGVuZ3RoLCBmeC50aW1lICsgZngubGVuZ3RoICk7XG4gICAgICBjb25zdCBpMCA9IE1hdGguY2VpbCggdGhpcy5fX2F1dG9tYXRvbi5yZXNvbHV0aW9uICogZngudGltZSApO1xuICAgICAgY29uc3QgaTEgPSBNYXRoLmZsb29yKCB0aGlzLl9fYXV0b21hdG9uLnJlc29sdXRpb24gKiBhdmFpbGFibGVFbmQgKTtcbiAgICAgIGlmICggaTEgPD0gaTAgKSB7XG4gICAgICAgIGlmICggcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdkZXZlbG9wbWVudCcgKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvciggJ0xlbmd0aCBvZiB0aGUgZnggc2VjdGlvbiBpcyBiZWluZyBuZWdhdGl2ZScgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB0ZW1wTGVuZ3RoID0gaTEgLSBpMCArIDE7XG4gICAgICBjb25zdCB0ZW1wVmFsdWVzID0gbmV3IEZsb2F0MzJBcnJheSggdGVtcExlbmd0aCApO1xuXG4gICAgICBjb25zdCBjb250ZXh0OiBGeENvbnRleHQgPSB7XG4gICAgICAgIGluZGV4OiBpMCxcbiAgICAgICAgaTAsXG4gICAgICAgIGkxLFxuICAgICAgICB0aW1lOiBmeC50aW1lLFxuICAgICAgICB0MDogZngudGltZSxcbiAgICAgICAgdDE6IGZ4LnRpbWUgKyBmeC5sZW5ndGgsXG4gICAgICAgIGRlbHRhVGltZTogMS4wIC8gdGhpcy5fX2F1dG9tYXRvbi5yZXNvbHV0aW9uLFxuICAgICAgICB2YWx1ZTogMC4wLFxuICAgICAgICBwcm9ncmVzczogMC4wLFxuICAgICAgICBlbGFwc2VkOiAwLjAsXG4gICAgICAgIHJlc29sdXRpb246IHRoaXMuX19hdXRvbWF0b24ucmVzb2x1dGlvbixcbiAgICAgICAgbGVuZ3RoOiBmeC5sZW5ndGgsXG4gICAgICAgIHBhcmFtczogZngucGFyYW1zLFxuICAgICAgICBhcnJheTogdGhpcy5fX3ZhbHVlcyxcbiAgICAgICAgZ2V0VmFsdWU6IHRoaXMuZ2V0VmFsdWUuYmluZCggdGhpcyApLFxuICAgICAgICBpbml0OiB0cnVlLFxuICAgICAgICBzdGF0ZToge31cbiAgICAgIH07XG5cbiAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRlbXBMZW5ndGg7IGkgKysgKSB7XG4gICAgICAgIGNvbnRleHQuaW5kZXggPSBpICsgaTA7XG4gICAgICAgIGNvbnRleHQudGltZSA9IGNvbnRleHQuaW5kZXggLyB0aGlzLl9fYXV0b21hdG9uLnJlc29sdXRpb247XG4gICAgICAgIGNvbnRleHQudmFsdWUgPSB0aGlzLl9fdmFsdWVzWyBpICsgaTAgXTtcbiAgICAgICAgY29udGV4dC5lbGFwc2VkID0gY29udGV4dC50aW1lIC0gZngudGltZTtcbiAgICAgICAgY29udGV4dC5wcm9ncmVzcyA9IGNvbnRleHQuZWxhcHNlZCAvIGZ4Lmxlbmd0aDtcbiAgICAgICAgdGVtcFZhbHVlc1sgaSBdID0gZnhEZWYuZnVuYyggY29udGV4dCApO1xuXG4gICAgICAgIGNvbnRleHQuaW5pdCA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9fdmFsdWVzLnNldCggdGVtcFZhbHVlcywgaTAgKTtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IENoYW5uZWwgfSBmcm9tICcuL0NoYW5uZWwnO1xuaW1wb3J0IHsgQ3VydmUgfSBmcm9tICcuL0N1cnZlJztcbmltcG9ydCB0eXBlIHsgQXV0b21hdG9uT3B0aW9ucyB9IGZyb20gJy4vdHlwZXMvQXV0b21hdG9uT3B0aW9ucyc7XG5pbXBvcnQgdHlwZSB7IENoYW5uZWxVcGRhdGVFdmVudCB9IGZyb20gJy4vdHlwZXMvQ2hhbm5lbFVwZGF0ZUV2ZW50JztcbmltcG9ydCB0eXBlIHsgRnhEZWZpbml0aW9uIH0gZnJvbSAnLi90eXBlcy9GeERlZmluaXRpb24nO1xuaW1wb3J0IHR5cGUgeyBTZXJpYWxpemVkQXV0b21hdG9uIH0gZnJvbSAnLi90eXBlcy9TZXJpYWxpemVkQXV0b21hdG9uJztcblxuLyoqXG4gKiBJVCdTIEFVVE9NQVRPTiFcbiAqIEBwYXJhbSBkYXRhIFNlcmlhbGl6ZWQgZGF0YSBvZiB0aGUgYXV0b21hdG9uXG4gKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25zIGZvciB0aGlzIEF1dG9tYXRvbiBpbnN0YW5jZVxuICovXG5leHBvcnQgY2xhc3MgQXV0b21hdG9uIHtcbiAgLyoqXG4gICAqIEl0IHJldHVybnMgdGhlIGN1cnJlbnQgdmFsdWUgb2YgdGhlIFtbQ2hhbm5lbF1dIGNhbGxlZCBgbmFtZWAuXG4gICAqIElmIHRoZSBgbmFtZWAgaXMgYW4gYXJyYXksIGl0IHJldHVybnMgYSBzZXQgb2YgbmFtZSA6IGNoYW5uZWwgYXMgYW4gb2JqZWN0IGluc3RlYWQuXG4gICAqIFlvdSBjYW4gYWxzbyBnaXZlIGEgbGlzdGVuZXIgd2hpY2ggd2lsbCBiZSBleGVjdXRlZCB3aGVuIHRoZSBjaGFubmVsIGNoYW5nZXMgaXRzIHZhbHVlIChvcHRpb25hbCkuXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBjaGFubmVsXG4gICAqIEBwYXJhbSBsaXN0ZW5lciBBIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBleGVjdXRlZCB3aGVuIHRoZSBjaGFubmVsIGNoYW5nZXMgaXRzIHZhbHVlXG4gICAqIEByZXR1cm5zIEN1cnJlbnQgdmFsdWUgb2YgdGhlIGNoYW5uZWxcbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBhdXRvID0gdGhpcy5fX2F1dG8uYmluZCggdGhpcyApO1xuXG4gIC8qKlxuICAgKiBDdXJ2ZXMgb2YgdGhlIGF1dG9tYXRvbi5cbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBjdXJ2ZXM6IEN1cnZlW10gPSBbXTtcblxuICAvKipcbiAgICogQ2hhbm5lbHMgb2YgdGhlIHRpbWVsaW5lLlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IGNoYW5uZWxzOiBDaGFubmVsW10gPSBbXTtcblxuICAvKipcbiAgICogTWFwIG9mIGNoYW5uZWxzLCBuYW1lIHZzLiBjaGFubmVsIGl0c2VsZi5cbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBtYXBOYW1lVG9DaGFubmVsID0gbmV3IE1hcDxzdHJpbmcsIENoYW5uZWw+KCk7XG5cbiAgLyoqXG4gICAqIEN1cnJlbnQgdGltZSBvZiB0aGUgYXV0b21hdG9uLlxuICAgKiBDYW4gYmUgc2V0IGJ5IFtbdXBkYXRlXV0sIGJlIHJldHJpZXZlZCBieSBbW2dldCB0aW1lXV0sIGJlIHVzZWQgYnkgW1thdXRvXV1cbiAgICovXG4gIHByb3RlY3RlZCBfX3RpbWU6IG51bWJlciA9IDAuMDtcblxuICAvKipcbiAgICogVmVyc2lvbiBvZiB0aGUgYXV0b21hdG9uLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fdmVyc2lvbjogc3RyaW5nID0gcHJvY2Vzcy5lbnYuVkVSU0lPTiE7XG5cbiAgLyoqXG4gICAqIFJlc29sdXRpb24gb2YgdGhlIHRpbWVsaW5lLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fcmVzb2x1dGlvbjogbnVtYmVyID0gMTAwMDtcblxuICAvKipcbiAgICogQSBtYXAgb2YgZnggZGVmaW5pdGlvbnMuXG4gICAqL1xuICBwcm90ZWN0ZWQgX19meERlZmluaXRpb25zOiB7IFsgbmFtZTogc3RyaW5nIF06IEZ4RGVmaW5pdGlvbiB9ID0ge307XG5cbiAgcHVibGljIGNvbnN0cnVjdG9yKFxuICAgIGRhdGE6IFNlcmlhbGl6ZWRBdXRvbWF0b24sXG4gICAgb3B0aW9uczogQXV0b21hdG9uT3B0aW9ucyA9IHt9XG4gICkge1xuICAgIG9wdGlvbnMuZnhEZWZpbml0aW9ucyAmJiB0aGlzLmFkZEZ4RGVmaW5pdGlvbnMoIG9wdGlvbnMuZnhEZWZpbml0aW9ucyApO1xuICAgIHRoaXMuZGVzZXJpYWxpemUoIGRhdGEgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDdXJyZW50IHRpbWUgb2YgdGhlIGF1dG9tYXRvbiwgdGhhdCBpcyBzZXQgdmlhIFtbdXBkYXRlXV0uXG4gICAqL1xuICBwdWJsaWMgZ2V0IHRpbWUoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX190aW1lOyB9XG5cbiAgLyoqXG4gICAqIFZlcnNpb24gb2YgdGhlIGF1dG9tYXRvbi5cbiAgICovXG4gIHB1YmxpYyBnZXQgdmVyc2lvbigpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5fX3ZlcnNpb247IH1cblxuICAvKipcbiAgICogUmVzb2x1dGlvbiA9IFNhbXBsaW5nIHBvaW50IHBlciBzZWNvbmQuXG4gICAqL1xuICBwdWJsaWMgZ2V0IHJlc29sdXRpb24oKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX19yZXNvbHV0aW9uOyB9XG5cbiAgLyoqXG4gICAqIExvYWQgc2VyaWFsaXplZCBhdXRvbWF0b24gZGF0YS5cbiAgICogQHBhcmFtIGRhdGEgU2VyaWFsaXplZCBvYmplY3QgY29udGFpbnMgYXV0b21hdG9uIGRhdGEuXG4gICAqL1xuICBwdWJsaWMgZGVzZXJpYWxpemUoIGRhdGE6IFNlcmlhbGl6ZWRBdXRvbWF0b24gKTogdm9pZCB7XG4gICAgdGhpcy5fX3Jlc29sdXRpb24gPSBkYXRhLnJlc29sdXRpb247XG5cbiAgICB0aGlzLmN1cnZlcy5zcGxpY2UoIDAgKTtcbiAgICB0aGlzLmN1cnZlcy5wdXNoKFxuICAgICAgLi4uZGF0YS5jdXJ2ZXMubWFwKCAoIGRhdGEgKSA9PiBuZXcgQ3VydmUoIHRoaXMsIGRhdGEgKSApXG4gICAgKTtcblxuICAgIHRoaXMubWFwTmFtZVRvQ2hhbm5lbC5jbGVhcigpO1xuXG4gICAgdGhpcy5jaGFubmVscy5zcGxpY2UoIDAgKTtcbiAgICB0aGlzLmNoYW5uZWxzLnB1c2goXG4gICAgICAuLi5kYXRhLmNoYW5uZWxzLm1hcCggKCBbIG5hbWUsIGRhdGEgXSApID0+IHtcbiAgICAgICAgY29uc3QgY2hhbm5lbCA9IG5ldyBDaGFubmVsKCB0aGlzLCBkYXRhICk7XG5cbiAgICAgICAgaWYgKCBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50JyApIHtcbiAgICAgICAgICBpZiAoIHRoaXMubWFwTmFtZVRvQ2hhbm5lbC5oYXMoIG5hbWUgKSApIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybiggYER1cGxpY2F0ZWQgY2hhbm5lbDogJHsgbmFtZSB9YCApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubWFwTmFtZVRvQ2hhbm5lbC5zZXQoIG5hbWUsIGNoYW5uZWwgKTtcbiAgICAgICAgcmV0dXJuIGNoYW5uZWw7XG4gICAgICB9IClcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBmeCBkZWZpbml0aW9ucy5cbiAgICogQHBhcmFtIGZ4RGVmaW5pdGlvbnMgQSBtYXAgb2YgaWQgLSBmeCBkZWZpbml0aW9uXG4gICAqL1xuICBwdWJsaWMgYWRkRnhEZWZpbml0aW9ucyggZnhEZWZpbml0aW9uczogeyBbIGlkOiBzdHJpbmcgXTogRnhEZWZpbml0aW9uIH0gKTogdm9pZCB7XG4gICAgT2JqZWN0LmVudHJpZXMoIGZ4RGVmaW5pdGlvbnMgKS5mb3JFYWNoKCAoIFsgaWQsIGZ4RGVmIF0gKSA9PiB7XG4gICAgICBpZiAoIHR5cGVvZiBmeERlZi5mdW5jID09PSAnZnVuY3Rpb24nICkgeyAvLyBpZ25vcmUgdW5yZWxhdGVkIGVudHJpZXNcbiAgICAgICAgaWYgKCBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50JyApIHtcbiAgICAgICAgICBpZiAoIHRoaXMuX19meERlZmluaXRpb25zWyBpZCBdICE9IG51bGwgKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oIGBPdmVyd3JpdGluZyB0aGUgZXhpc3RpbmcgZnggZGVmaW5pdGlvbjogJHsgaWQgfWAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9fZnhEZWZpbml0aW9uc1sgaWQgXSA9IGZ4RGVmO1xuICAgICAgfVxuICAgIH0gKTtcblxuICAgIHRoaXMucHJlY2FsY0FsbCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIGZ4IGRlZmluaXRpb24uXG4gICAqIElmIGl0IGNhbid0IGZpbmQgdGhlIGRlZmluaXRpb24sIGl0IHJldHVybnMgYG51bGxgIGluc3RlYWQuXG4gICAqIEBwYXJhbSBpZCBVbmlxdWUgaWQgZm9yIHRoZSBGeCBkZWZpbml0aW9uXG4gICAqL1xuICBwdWJsaWMgZ2V0RnhEZWZpbml0aW9uKCBpZDogc3RyaW5nICk6IEZ4RGVmaW5pdGlvbiB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLl9fZnhEZWZpbml0aW9uc1sgaWQgXSB8fCBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIGN1cnZlLlxuICAgKiBAcGFyYW0gaW5kZXggQW4gaW5kZXggb2YgdGhlIGN1cnZlXG4gICAqL1xuICBwdWJsaWMgZ2V0Q3VydmUoIGluZGV4OiBudW1iZXIgKTogQ3VydmUgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5jdXJ2ZXNbIGluZGV4IF0gfHwgbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmVjYWxjdWxhdGUgYWxsIGN1cnZlcy5cbiAgICovXG4gIHB1YmxpYyBwcmVjYWxjQWxsKCk6IHZvaWQge1xuICAgIE9iamVjdC52YWx1ZXMoIHRoaXMuY3VydmVzICkuZm9yRWFjaCggKCBjdXJ2ZSApID0+IGN1cnZlLnByZWNhbGMoKSApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0IHRoZSBpbnRlcm5hbCBzdGF0ZXMgb2YgY2hhbm5lbHMuXG4gICAqICoqQ2FsbCB0aGlzIG1ldGhvZCB3aGVuIHlvdSBzZWVrIHRoZSB0aW1lLioqXG4gICAqL1xuICBwdWJsaWMgcmVzZXQoKTogdm9pZCB7XG4gICAgT2JqZWN0LnZhbHVlcyggdGhpcy5jaGFubmVscyApLmZvckVhY2goICggY2hhbm5lbCApID0+IGNoYW5uZWwucmVzZXQoKSApO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgZW50aXJlIGF1dG9tYXRvbi5cbiAgICogKipZb3UgbWF5IHdhbnQgdG8gY2FsbCB0aGlzIGluIHlvdXIgdXBkYXRlIGxvb3AuKipcbiAgICogQHBhcmFtIHRpbWUgQ3VycmVudCB0aW1lXG4gICAqL1xuICBwdWJsaWMgdXBkYXRlKCB0aW1lOiBudW1iZXIgKTogdm9pZCB7XG4gICAgY29uc3QgdCA9IE1hdGgubWF4KCB0aW1lLCAwLjAgKTtcblxuICAgIC8vIGNhY2hlIHRoZSB0aW1lXG4gICAgdGhpcy5fX3RpbWUgPSB0O1xuXG4gICAgLy8gZ3JhYiB0aGUgY3VycmVudCB2YWx1ZSBmb3IgZWFjaCBjaGFubmVsc1xuICAgIHRoaXMuY2hhbm5lbHMuZm9yRWFjaCggKCBjaGFubmVsICkgPT4ge1xuICAgICAgY2hhbm5lbC51cGRhdGUoIHRoaXMuX190aW1lICk7XG4gICAgfSApO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2lnbmVkIHRvIHtAbGluayBBdXRvbWF0b24jYXV0b30gb24gaXRzIGluaXRpYWxpemUgcGhhc2UuXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBjaGFubmVsXG4gICAqIEBwYXJhbSBsaXN0ZW5lciBBIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBleGVjdXRlZCB3aGVuIHRoZSBjaGFubmVsIGNoYW5nZXMgaXRzIHZhbHVlXG4gICAqIEByZXR1cm5zIEN1cnJlbnQgdmFsdWUgb2YgdGhlIGNoYW5uZWxcbiAgICovXG4gIHByb3RlY3RlZCBfX2F1dG8oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGxpc3RlbmVyPzogKCBldmVudDogQ2hhbm5lbFVwZGF0ZUV2ZW50ICkgPT4gdm9pZFxuICApOiBudW1iZXIge1xuICAgIGNvbnN0IGNoYW5uZWwgPSB0aGlzLm1hcE5hbWVUb0NoYW5uZWwuZ2V0KCBuYW1lICk7XG5cbiAgICBpZiAoIHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAnZGV2ZWxvcG1lbnQnICkge1xuICAgICAgaWYgKCAhY2hhbm5lbCApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCBgTm8gc3VjaCBjaGFubmVsOiAkeyBuYW1lIH1gICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCBsaXN0ZW5lciApIHtcbiAgICAgIGNoYW5uZWwhLnN1YnNjcmliZSggbGlzdGVuZXIgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2hhbm5lbCEuY3VycmVudFZhbHVlO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7SUFHQTs7O1VBR2EsV0FBVzs7Ozs7O1FBNkR0QixZQUFvQixTQUFvQixFQUFFLElBQTJCO1lBQ25FLElBQUksQ0FBQyxXQUFXLEdBQUcsU0FBUyxDQUFDO1lBRTdCLElBQUksQ0FBQyxXQUFXLENBQUUsSUFBSSxDQUFFLENBQUM7U0FDMUI7Ozs7UUFiRCxJQUFXLEdBQUc7WUFDWixPQUFPLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztTQUNoQztRQWFNLFFBQVEsQ0FBRSxJQUFZO1lBQzNCLElBQUssSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsTUFBTSxJQUFJLElBQUksRUFBRztnQkFDdkMsT0FBTyxHQUFHLENBQUM7YUFDWjtZQUVELElBQUssSUFBSSxDQUFDLEtBQUssRUFBRztnQkFDaEIsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU8sR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQU0sQ0FBQztnQkFDNUMsT0FBTyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUUsQ0FBQyxDQUFFLENBQUM7YUFDekQ7aUJBQU07Z0JBQ0wsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO2FBQ25CO1NBQ0Y7Ozs7O1FBTU0sV0FBVyxDQUFFLElBQTJCOztZQUM3QyxJQUFJLENBQUMsSUFBSSxTQUFHLElBQUksQ0FBQyxJQUFJLG1DQUFJLEdBQUcsQ0FBQztZQUM3QixJQUFJLENBQUMsTUFBTSxTQUFHLElBQUksQ0FBQyxNQUFNLG1DQUFJLEdBQUcsQ0FBQztZQUNqQyxJQUFJLENBQUMsS0FBSyxTQUFHLElBQUksQ0FBQyxLQUFLLG1DQUFJLEdBQUcsQ0FBQztZQUMvQixJQUFJLENBQUMsTUFBTSxTQUFHLElBQUksQ0FBQyxNQUFNLG1DQUFJLEdBQUcsQ0FBQztZQUNqQyxJQUFJLENBQUMsS0FBSyxTQUFHLElBQUksQ0FBQyxLQUFLLG1DQUFJLEdBQUcsQ0FBQztZQUMvQixJQUFJLENBQUMsR0FBRyxTQUFHLElBQUksQ0FBQyxHQUFHLG1DQUFJLEdBQUcsQ0FBQztZQUMzQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDeEIsSUFBSyxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksRUFBRztnQkFDeEIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBRSxJQUFJLENBQUMsS0FBSyxDQUFHLENBQUM7Z0JBQ3RELElBQUksQ0FBQyxNQUFNLGVBQUcsSUFBSSxDQUFDLE1BQU0sbUNBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLG1DQUFJLEdBQUcsQ0FBQzthQUN2RDtTQUNGOzs7SUNqR0g7OztVQUdhLE9BQU87Ozs7OztRQW9DbEIsWUFBb0IsU0FBb0IsRUFBRSxJQUF1Qjs7OztZQTNCdkQsWUFBTyxHQUFrQixFQUFFLENBQUM7Ozs7WUFLNUIsWUFBTyxHQUFXLEdBQUcsQ0FBQzs7OztZQUt0QixXQUFNLEdBQVcsQ0FBQyxRQUFRLENBQUM7Ozs7WUFLM0IsV0FBTSxHQUFXLENBQUMsQ0FBQzs7OztZQUtuQixnQkFBVyxHQUFpRCxFQUFFLENBQUM7WUFRdkUsSUFBSSxDQUFDLFdBQVcsR0FBRyxTQUFTLENBQUM7WUFFN0IsSUFBSSxDQUFDLFdBQVcsQ0FBRSxJQUFJLENBQUUsQ0FBQztTQUMxQjs7OztRQUtELElBQVcsWUFBWSxLQUFhLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFOzs7O1FBSzFELElBQVcsV0FBVyxLQUFhLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFOzs7OztRQU1qRCxXQUFXLENBQUUsSUFBdUI7O1lBQ3pDLElBQUksQ0FBQyxPQUFPLGVBQUcsSUFBSSxDQUFDLEtBQUssMENBQUUsR0FBRyxDQUFFLENBQUUsSUFBSSxLQUFNLElBQUksV0FBVyxDQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFFLG9DQUFNLEVBQUUsQ0FBQztTQUMvRjs7Ozs7UUFNTSxLQUFLO1lBQ1YsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLFFBQVEsQ0FBQztZQUN4QixJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQztZQUNqQixJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztTQUNqQjs7Ozs7UUFNTSxTQUFTLENBQUUsUUFBK0M7WUFDL0QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUUsUUFBUSxDQUFFLENBQUM7U0FDbkM7Ozs7OztRQU9NLFFBQVEsQ0FBRSxJQUFZO1lBQzNCLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFFLENBQUUsSUFBSSxNQUFRLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFFLENBQUUsQ0FBQzs7WUFHdEUsSUFBSyxJQUFJLEtBQUssQ0FBQyxFQUFHO2dCQUNoQixPQUFPLEdBQUcsQ0FBQzthQUNaOztZQUdELElBQUssSUFBSSxLQUFLLENBQUMsQ0FBQyxFQUFHO2dCQUNqQixJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7YUFDNUI7WUFFRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFFLElBQUksR0FBRyxDQUFDLENBQUUsQ0FBQztZQUN0QyxJQUFLLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxFQUFHO2dCQUNyQixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDO2FBQ3JDO2lCQUFNO2dCQUNMLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBRSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBRSxDQUFDO2FBQzFDO1NBQ0Y7Ozs7OztRQU9NLE1BQU0sQ0FBRSxJQUFZO1lBQ3pCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDekIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUU3QixLQUFNLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRyxFQUFHO2dCQUN6RCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFDO2dCQUMvQixNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDO2dCQUMxQyxJQUFJLE9BQU8sR0FBRyxJQUFJLEdBQUcsS0FBSyxDQUFDO2dCQUUzQixJQUFLLE9BQU8sR0FBRyxHQUFHLEVBQUc7b0JBQ25CLE1BQU07aUJBQ1A7cUJBQU07b0JBQ0wsSUFBSSxRQUFnQixDQUFDO29CQUNyQixJQUFJLElBQXNCLENBQUM7b0JBQzNCLElBQUksTUFBd0IsQ0FBQztvQkFFN0IsSUFBSyxNQUFNLElBQUksT0FBTyxFQUFHO3dCQUN2QixPQUFPLEdBQUcsTUFBTSxDQUFDO3dCQUNqQixRQUFRLEdBQUcsR0FBRyxDQUFDO3dCQUNmLE1BQU0sR0FBRyxJQUFJLENBQUM7d0JBRWQsSUFBSyxDQUFDLEtBQUssSUFBSSxDQUFDLE1BQU0sRUFBRzs0QkFDdkIsSUFBSSxDQUFDLE1BQU0sRUFBRyxDQUFDO3lCQUNoQjtxQkFDRjt5QkFBTTt3QkFDTCxRQUFRLEdBQUcsTUFBTSxLQUFLLEdBQUc7OEJBQ3JCLE9BQU8sR0FBRyxNQUFNOzhCQUNoQixHQUFHLENBQUM7cUJBQ1Q7b0JBRUQsSUFBSyxRQUFRLEdBQUcsS0FBSyxFQUFHO3dCQUN0QixJQUFJLEdBQUcsSUFBSSxDQUFDO3FCQUNiO29CQUVELEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFFLE9BQU8sQ0FBRSxDQUFDO29CQUVqQyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBRSxDQUFFLFFBQVEsS0FBTSxRQUFRLENBQUU7d0JBQ2xELElBQUk7d0JBQ0osT0FBTzt3QkFDUCxLQUFLO3dCQUNMLEdBQUc7d0JBQ0gsTUFBTTt3QkFDTixLQUFLO3dCQUNMLFFBQVE7d0JBQ1IsSUFBSTt3QkFDSixNQUFNO3FCQUNQLENBQUUsQ0FBRSxDQUFDO2lCQUNQO2FBQ0Y7WUFFRCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztZQUNuQixJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztTQUN0Qjs7O0lDaEtILE1BQU0sV0FBVyxHQUFHLENBQUMsQ0FBQztJQUN0QixNQUFNLGNBQWMsR0FBRyxLQUFLLENBQUM7SUFDN0IsTUFBTSxXQUFXLEdBQUcsRUFBRSxDQUFDO0lBQ3ZCLE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQztJQUNoQyxNQUFNLFVBQVUsR0FBRyxFQUFFLENBQUM7SUFFdEIsTUFBTSxPQUFPLEdBQWEsRUFBRSxDQUFDO0lBRTdCLFNBQVMsS0FBSyxDQUFFLENBQVMsRUFBRSxHQUFXLEVBQUUsR0FBVztRQUNqRCxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBRSxDQUFDLEVBQUUsR0FBRyxDQUFFLEVBQUUsR0FBRyxDQUFFLENBQUM7SUFDN0MsQ0FBQztJQUVEOzs7Ozs7Ozs7Ozs7OztJQWVBLFNBQVMsQ0FBQyxDQUFFLEdBQTZCO1FBQ3ZDLE9BQU8sR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsRUFBRSxDQUFDO0lBQ3ZELENBQUM7SUFFRCxTQUFTLENBQUMsQ0FBRSxHQUE2QjtRQUN2QyxPQUFPLEdBQUcsR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsRUFBRSxDQUFDO0lBQ3BELENBQUM7SUFFRCxTQUFTLENBQUMsQ0FBRSxHQUE2QjtRQUN2QyxPQUFPLEdBQUcsR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsRUFBRSxDQUFDO0lBQ3JDLENBQUM7SUFFRCxTQUFTLFdBQVcsQ0FBRSxDQUFTLEVBQUUsR0FBNkI7UUFDNUQsT0FBTyxDQUFFLENBQUUsQ0FBQyxDQUFFLEdBQUcsQ0FBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUUsR0FBRyxDQUFFLElBQUssQ0FBQyxHQUFHLENBQUMsQ0FBRSxHQUFHLENBQUUsSUFBSyxDQUFDLEdBQUcsR0FBRyxDQUFDLEVBQUUsQ0FBQztJQUNyRSxDQUFDO0lBRUQsU0FBUyxnQkFBZ0IsQ0FBRSxDQUFTLEVBQUUsR0FBNkI7UUFDakUsT0FBTyxDQUFFLEdBQUcsR0FBRyxDQUFDLENBQUUsR0FBRyxDQUFFLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUUsR0FBRyxDQUFFLElBQUssQ0FBQyxHQUFHLENBQUMsQ0FBRSxHQUFHLENBQUUsQ0FBQztJQUNoRSxDQUFDO0lBRUQsU0FBUyxNQUFNLENBQUUsQ0FBUyxFQUFFLENBQVMsRUFBRSxDQUFTLEVBQUUsR0FBNkI7UUFDN0UsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDO1FBQ25CLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUVWLEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxXQUFXLEVBQUUsQ0FBQyxFQUFHLEVBQUc7WUFDdkMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFFLENBQUMsR0FBRyxDQUFDLElBQUssR0FBRyxDQUFDO1lBQ3hCLFVBQVUsR0FBRyxXQUFXLENBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBRSxHQUFHLENBQUMsQ0FBQztZQUN2QyxDQUFFLEdBQUcsR0FBRyxVQUFVLEtBQU8sQ0FBQyxHQUFHLENBQUMsS0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFFLENBQUM7WUFDN0MsSUFBSyxjQUFjLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBRSxVQUFVLENBQUUsRUFBRztnQkFBRSxNQUFNO2FBQUU7U0FDMUQ7UUFFRCxPQUFPLENBQUMsQ0FBQztJQUNYLENBQUM7SUFFRCxTQUFTLE1BQU0sQ0FBRSxDQUFTLEVBQUUsQ0FBUyxFQUFFLEdBQTZCO1FBQ2xFLEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxXQUFXLEVBQUUsQ0FBQyxFQUFHLEVBQUc7WUFDdkMsTUFBTSxDQUFDLEdBQUcsZ0JBQWdCLENBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBRSxDQUFDO1lBQ3JDLElBQUssQ0FBQyxLQUFLLEdBQUcsRUFBRztnQkFBRSxPQUFPLENBQUMsQ0FBQzthQUFFO1lBQzlCLE1BQU0sRUFBRSxHQUFHLFdBQVcsQ0FBRSxDQUFDLEVBQUUsR0FBRyxDQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3JDLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQ2I7UUFFRCxPQUFPLENBQUMsQ0FBQztJQUNYLENBQUM7YUFFZSxlQUFlLENBQzdCLElBQThCLEVBQzlCLElBQThCLEVBQzlCLENBQVM7UUFFVCxJQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFHO1lBQUUsT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFDO1NBQUU7UUFDdkMsSUFBSyxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBRztZQUFFLE9BQU8sSUFBSSxDQUFDLEVBQUUsQ0FBQztTQUFFO1FBRXZDLElBQUksQ0FBQyxFQUFFLEdBQUcsS0FBSyxDQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFFLENBQUM7UUFDN0MsSUFBSSxDQUFDLEVBQUUsR0FBRyxLQUFLLENBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUUsQ0FBQztRQUU3QyxLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxFQUFFLENBQUMsRUFBRyxFQUFHO1lBQ3RDLE9BQU8sQ0FBRSxDQUFDLENBQUUsR0FBRyxXQUFXLENBQUUsQ0FBQyxJQUFLLFVBQVUsR0FBRyxHQUFHLENBQUUsRUFBRSxJQUFJLENBQUUsQ0FBQztTQUM5RDtRQUVELElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQztRQUNmLEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLEVBQUUsQ0FBQyxFQUFHLEVBQUc7WUFDdEMsTUFBTSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDZixJQUFLLENBQUMsR0FBRyxPQUFPLENBQUUsQ0FBQyxDQUFFLEVBQUc7Z0JBQUUsTUFBTTthQUFFO1NBQ25DO1FBRUQsTUFBTSxJQUFJLEdBQUcsQ0FBRSxDQUFDLEdBQUcsT0FBTyxDQUFFLE1BQU0sQ0FBRSxLQUFPLE9BQU8sQ0FBRSxNQUFNLEdBQUcsQ0FBQyxDQUFFLEdBQUcsT0FBTyxDQUFFLE1BQU0sQ0FBRSxDQUFFLENBQUM7UUFDdkYsSUFBSSxDQUFDLEdBQUcsQ0FBRSxNQUFNLEdBQUcsSUFBSSxLQUFPLFVBQVUsR0FBRyxDQUFDLENBQUUsQ0FBQztRQUMvQyxNQUFNLENBQUMsR0FBRyxnQkFBZ0IsQ0FBRSxDQUFDLEVBQUUsSUFBSSxDQUFFLElBQUssSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFFLENBQUM7UUFFOUQsSUFBSyxjQUFjLElBQUksQ0FBQyxFQUFHO1lBQ3pCLENBQUMsR0FBRyxNQUFNLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUUsQ0FBQztTQUMxQjthQUFNLElBQUssQ0FBQyxLQUFLLEdBQUcsRUFBRztZQUN0QixDQUFDLEdBQUcsTUFBTSxDQUFFLENBQUMsRUFBRSxDQUFFLE1BQU0sS0FBTyxVQUFVLEdBQUcsQ0FBQyxDQUFFLEVBQUUsQ0FBRSxNQUFNLEdBQUcsR0FBRyxLQUFPLFVBQVUsR0FBRyxDQUFDLENBQUUsRUFBRSxJQUFJLENBQUUsQ0FBQztTQUMvRjtRQUVELE9BQU8sV0FBVyxDQUFFLENBQUMsRUFBRSxJQUFJLENBQUUsQ0FBQztJQUNoQyxDQUFDO2FBRWUsWUFBWSxDQUFFLEtBQWlCLEVBQUUsS0FBaUIsRUFBRSxJQUFZO1FBQzlFLE9BQU8sZUFBZSxDQUNwQjtZQUNFLEVBQUUsRUFBRSxLQUFLLENBQUMsSUFBSTtZQUNkLEVBQUUsRUFBRSxLQUFLLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxPQUFPO1lBQzlCLEVBQUUsRUFBRSxLQUFLLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxNQUFNO1lBQzdCLEVBQUUsRUFBRSxLQUFLLENBQUMsSUFBSTtTQUNmLEVBQ0Q7WUFDRSxFQUFFLEVBQUUsS0FBSyxDQUFDLEtBQUs7WUFDZixFQUFFLEVBQUUsS0FBSyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsUUFBUTtZQUNoQyxFQUFFLEVBQUUsS0FBSyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsT0FBTztZQUMvQixFQUFFLEVBQUUsS0FBSyxDQUFDLEtBQUs7U0FDaEIsRUFDRCxJQUFJLENBQ0wsQ0FBQztJQUNKOztJQzVIQTs7O1VBR2EsS0FBSzs7Ozs7O1FBbUNoQixZQUFvQixTQUFvQixFQUFFLElBQXFCOzs7O1lBcEJyRCxZQUFPLEdBQWlCLEVBQUUsQ0FBQzs7OztZQUszQixVQUFLLEdBQWdCLEVBQUUsQ0FBQztZQWdCaEMsSUFBSSxDQUFDLFdBQVcsR0FBRyxTQUFTLENBQUM7WUFFN0IsSUFBSSxDQUFDLFdBQVcsQ0FBRSxJQUFJLENBQUUsQ0FBQztTQUMxQjs7OztRQWRELElBQVcsTUFBTTtZQUNmLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUUsQ0FBQyxJQUFJLENBQUM7U0FDckQ7Ozs7O1FBa0JNLFdBQVcsQ0FBRSxJQUFxQjs7WUFDdkMsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBRSxDQUFFLElBQUk7O2dCQUFNLFFBQUU7b0JBQzNDLElBQUksUUFBRSxJQUFJLENBQUUsQ0FBQyxDQUFFLG1DQUFJLEdBQUc7b0JBQ3RCLEtBQUssUUFBRSxJQUFJLENBQUUsQ0FBQyxDQUFFLG1DQUFJLEdBQUc7b0JBQ3ZCLE1BQU0sUUFBRSxJQUFJLENBQUUsQ0FBQyxDQUFFLG1DQUFJLEdBQUc7b0JBQ3hCLE9BQU8sUUFBRSxJQUFJLENBQUUsQ0FBQyxDQUFFLG1DQUFJLEdBQUc7b0JBQ3pCLE9BQU8sUUFBRSxJQUFJLENBQUUsQ0FBQyxDQUFFLG1DQUFJLEdBQUc7b0JBQ3pCLFFBQVEsUUFBRSxJQUFJLENBQUUsQ0FBQyxDQUFFLG1DQUFJLEdBQUc7aUJBQzNCLEVBQUU7YUFBQSxDQUFFLENBQUM7WUFFTixJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztZQUNoQixNQUFBLElBQUksQ0FBQyxHQUFHLDBDQUFFLE9BQU8sQ0FBRSxDQUFFLEVBQUU7O2dCQUNyQixJQUFLLEVBQUUsQ0FBQyxNQUFNLEVBQUc7b0JBQUUsT0FBTztpQkFBRTtnQkFDNUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUU7b0JBQ2YsSUFBSSxRQUFFLEVBQUUsQ0FBQyxJQUFJLG1DQUFJLEdBQUc7b0JBQ3BCLE1BQU0sUUFBRSxFQUFFLENBQUMsTUFBTSxtQ0FBSSxHQUFHO29CQUN4QixHQUFHLFFBQUUsRUFBRSxDQUFDLEdBQUcsbUNBQUksQ0FBQztvQkFDaEIsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHO29CQUNYLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTTtpQkFDbEIsQ0FBRSxDQUFDO2FBQ0wsRUFBRztZQUVKLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUNoQjs7OztRQUtNLE9BQU87WUFDWixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksWUFBWSxDQUM5QixJQUFJLENBQUMsSUFBSSxDQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUUsR0FBRyxDQUFDLENBQzNELENBQUM7WUFFRixJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDdkIsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1NBQ25COzs7Ozs7UUFPTSxRQUFRLENBQUUsSUFBWTtZQUMzQixJQUFLLElBQUksR0FBRyxHQUFHLEVBQUc7O2dCQUVoQixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUUsQ0FBQyxDQUFFLENBQUM7YUFFM0I7aUJBQU0sSUFBSyxJQUFJLENBQUMsTUFBTSxJQUFJLElBQUksRUFBRzs7Z0JBRWhDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBRSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUUsQ0FBQzthQUVsRDtpQkFBTTs7Z0JBRUwsTUFBTSxLQUFLLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDO2dCQUNqRCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFFLEtBQUssQ0FBRSxDQUFDO2dCQUNuQyxNQUFNLE1BQU0sR0FBRyxLQUFLLEdBQUcsR0FBRyxDQUFDO2dCQUUzQixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFFLE1BQU0sQ0FBRSxDQUFDO2dCQUNuQyxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFFLE1BQU0sR0FBRyxDQUFDLENBQUUsQ0FBQztnQkFFdkMsTUFBTSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSyxNQUFNLENBQUM7Z0JBRXBDLE9BQU8sQ0FBQyxDQUFDO2FBRVY7U0FDRjs7OztRQUtTLGVBQWU7WUFDdkIsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBQztZQUNqQyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7WUFDZCxLQUFNLElBQUksS0FBSyxHQUFHLENBQUMsRUFBRSxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRyxFQUFHO2dCQUMvRCxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUM7Z0JBQ3ZCLFFBQVEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFFLEtBQUssR0FBRyxDQUFDLENBQUUsQ0FBQztnQkFDckMsTUFBTSxFQUFFLEdBQUcsS0FBSyxDQUFDO2dCQUNqQixLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBRSxRQUFRLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFFLENBQUM7Z0JBRWxFLElBQUksQ0FBQyxRQUFRLENBQUUsRUFBRSxDQUFFLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQztnQkFDbEMsS0FBTSxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxFQUFHLEVBQUc7b0JBQ3ZDLE1BQU0sSUFBSSxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQztvQkFDN0MsTUFBTSxLQUFLLEdBQUcsWUFBWSxDQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFFLENBQUM7b0JBQ3BELElBQUksQ0FBQyxRQUFRLENBQUUsQ0FBQyxDQUFFLEdBQUcsS0FBSyxDQUFDO2lCQUM1QjthQUNGO1lBRUQsS0FBTSxJQUFJLENBQUMsR0FBRyxLQUFLLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUcsRUFBRztnQkFDeEQsSUFBSSxDQUFDLFFBQVEsQ0FBRSxDQUFDLENBQUUsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDO2FBQ3JDO1NBQ0Y7Ozs7UUFLUyxVQUFVO1lBQ2xCLEtBQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUcsRUFBRztnQkFDbkQsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBRSxHQUFHLENBQUUsQ0FBQztnQkFDN0IsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBRSxDQUFDO2dCQUN6RCxJQUFLLENBQUMsS0FBSyxFQUFHO29CQUNrQzt3QkFDNUMsT0FBTyxDQUFDLElBQUksQ0FBRSwwQkFBMkIsRUFBRSxDQUFDLEdBQUksRUFBRSxDQUFFLENBQUM7cUJBQ3REO29CQUVELFNBQVM7aUJBQ1Y7Z0JBRUQsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBRSxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBRSxDQUFDO2dCQUNsRSxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUUsQ0FBQztnQkFDOUQsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBRSxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsR0FBRyxZQUFZLENBQUUsQ0FBQztnQkFDcEUsSUFBSyxFQUFFLElBQUksRUFBRSxFQUFHO29CQUNnQzt3QkFDNUMsT0FBTyxDQUFDLEtBQUssQ0FBRSw0Q0FBNEMsQ0FBRSxDQUFDO3FCQUMvRDtvQkFFRCxTQUFTO2lCQUNWO2dCQUVELE1BQU0sVUFBVSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUMvQixNQUFNLFVBQVUsR0FBRyxJQUFJLFlBQVksQ0FBRSxVQUFVLENBQUUsQ0FBQztnQkFFbEQsTUFBTSxPQUFPLEdBQWM7b0JBQ3pCLEtBQUssRUFBRSxFQUFFO29CQUNULEVBQUU7b0JBQ0YsRUFBRTtvQkFDRixJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUk7b0JBQ2IsRUFBRSxFQUFFLEVBQUUsQ0FBQyxJQUFJO29CQUNYLEVBQUUsRUFBRSxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQyxNQUFNO29CQUN2QixTQUFTLEVBQUUsR0FBRyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVTtvQkFDNUMsS0FBSyxFQUFFLEdBQUc7b0JBQ1YsUUFBUSxFQUFFLEdBQUc7b0JBQ2IsT0FBTyxFQUFFLEdBQUc7b0JBQ1osVUFBVSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVTtvQkFDdkMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxNQUFNO29CQUNqQixNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU07b0JBQ2pCLEtBQUssRUFBRSxJQUFJLENBQUMsUUFBUTtvQkFDcEIsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFFLElBQUksQ0FBRTtvQkFDcEMsSUFBSSxFQUFFLElBQUk7b0JBQ1YsS0FBSyxFQUFFLEVBQUU7aUJBQ1YsQ0FBQztnQkFFRixLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxFQUFFLENBQUMsRUFBRyxFQUFHO29CQUN0QyxPQUFPLENBQUMsS0FBSyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7b0JBQ3ZCLE9BQU8sQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQztvQkFDM0QsT0FBTyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFFLENBQUMsR0FBRyxFQUFFLENBQUUsQ0FBQztvQkFDeEMsT0FBTyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUM7b0JBQ3pDLE9BQU8sQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDO29CQUMvQyxVQUFVLENBQUUsQ0FBQyxDQUFFLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBRSxPQUFPLENBQUUsQ0FBQztvQkFFeEMsT0FBTyxDQUFDLElBQUksR0FBRyxLQUFLLENBQUM7aUJBQ3RCO2dCQUVELElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFFLFVBQVUsRUFBRSxFQUFFLENBQUUsQ0FBQzthQUNyQztTQUNGOzs7SUMxTUg7Ozs7O1VBS2EsU0FBUztRQStDcEIsWUFDRSxJQUF5QixFQUN6QixVQUE0QixFQUFFOzs7Ozs7Ozs7WUF4Q2hCLFNBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBRSxJQUFJLENBQUUsQ0FBQzs7OztZQUtoQyxXQUFNLEdBQVksRUFBRSxDQUFDOzs7O1lBS3JCLGFBQVEsR0FBYyxFQUFFLENBQUM7Ozs7WUFLekIscUJBQWdCLEdBQUcsSUFBSSxHQUFHLEVBQW1CLENBQUM7Ozs7O1lBTXBELFdBQU0sR0FBVyxHQUFHLENBQUM7Ozs7WUFLckIsY0FBUyxHQUFXLE9BQW9CLENBQUM7Ozs7WUFLekMsaUJBQVksR0FBVyxJQUFJLENBQUM7Ozs7WUFLNUIsb0JBQWUsR0FBdUMsRUFBRSxDQUFDO1lBTWpFLE9BQU8sQ0FBQyxhQUFhLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFFLE9BQU8sQ0FBQyxhQUFhLENBQUUsQ0FBQztZQUN4RSxJQUFJLENBQUMsV0FBVyxDQUFFLElBQUksQ0FBRSxDQUFDO1NBQzFCOzs7O1FBS0QsSUFBVyxJQUFJLEtBQWEsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7Ozs7UUFLakQsSUFBVyxPQUFPLEtBQWEsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUU7Ozs7UUFLdkQsSUFBVyxVQUFVLEtBQWEsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUU7Ozs7O1FBTXRELFdBQVcsQ0FBRSxJQUF5QjtZQUMzQyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7WUFFcEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFFLENBQUM7WUFDeEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQ2QsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBRSxDQUFFLElBQUksS0FBTSxJQUFJLEtBQUssQ0FBRSxJQUFJLEVBQUUsSUFBSSxDQUFFLENBQUUsQ0FDMUQsQ0FBQztZQUVGLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUU5QixJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQztZQUMxQixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FDaEIsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBRSxDQUFFLENBQUUsSUFBSSxFQUFFLElBQUksQ0FBRTtnQkFDcEMsTUFBTSxPQUFPLEdBQUcsSUFBSSxPQUFPLENBQUUsSUFBSSxFQUFFLElBQUksQ0FBRSxDQUFDO2dCQUVJO29CQUM1QyxJQUFLLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUUsSUFBSSxDQUFFLEVBQUc7d0JBQ3ZDLE9BQU8sQ0FBQyxJQUFJLENBQUUsdUJBQXdCLElBQUssRUFBRSxDQUFFLENBQUM7cUJBQ2pEO2lCQUNGO2dCQUVELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBRSxDQUFDO2dCQUMzQyxPQUFPLE9BQU8sQ0FBQzthQUNoQixDQUFFLENBQ0osQ0FBQztTQUNIOzs7OztRQU1NLGdCQUFnQixDQUFFLGFBQStDO1lBQ3RFLE1BQU0sQ0FBQyxPQUFPLENBQUUsYUFBYSxDQUFFLENBQUMsT0FBTyxDQUFFLENBQUUsQ0FBRSxFQUFFLEVBQUUsS0FBSyxDQUFFO2dCQUN0RCxJQUFLLE9BQU8sS0FBSyxDQUFDLElBQUksS0FBSyxVQUFVLEVBQUc7b0JBQ1E7d0JBQzVDLElBQUssSUFBSSxDQUFDLGVBQWUsQ0FBRSxFQUFFLENBQUUsSUFBSSxJQUFJLEVBQUc7NEJBQ3hDLE9BQU8sQ0FBQyxJQUFJLENBQUUsMkNBQTRDLEVBQUcsRUFBRSxDQUFFLENBQUM7eUJBQ25FO3FCQUNGO29CQUVELElBQUksQ0FBQyxlQUFlLENBQUUsRUFBRSxDQUFFLEdBQUcsS0FBSyxDQUFDO2lCQUNwQzthQUNGLENBQUUsQ0FBQztZQUVKLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztTQUNuQjs7Ozs7O1FBT00sZUFBZSxDQUFFLEVBQVU7WUFDaEMsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFFLEVBQUUsQ0FBRSxJQUFJLElBQUksQ0FBQztTQUMzQzs7Ozs7UUFNTSxRQUFRLENBQUUsS0FBYTtZQUM1QixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUUsS0FBSyxDQUFFLElBQUksSUFBSSxDQUFDO1NBQ3JDOzs7O1FBS00sVUFBVTtZQUNmLE1BQU0sQ0FBQyxNQUFNLENBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLE9BQU8sQ0FBRSxDQUFFLEtBQUssS0FBTSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUUsQ0FBQztTQUN0RTs7Ozs7UUFNTSxLQUFLO1lBQ1YsTUFBTSxDQUFDLE1BQU0sQ0FBRSxJQUFJLENBQUMsUUFBUSxDQUFFLENBQUMsT0FBTyxDQUFFLENBQUUsT0FBTyxLQUFNLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBRSxDQUFDO1NBQzFFOzs7Ozs7UUFPTSxNQUFNLENBQUUsSUFBWTtZQUN6QixNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFFLElBQUksRUFBRSxHQUFHLENBQUUsQ0FBQzs7WUFHaEMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7O1lBR2hCLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFFLENBQUUsT0FBTztnQkFDOUIsT0FBTyxDQUFDLE1BQU0sQ0FBRSxJQUFJLENBQUMsTUFBTSxDQUFFLENBQUM7YUFDL0IsQ0FBRSxDQUFDO1NBQ0w7Ozs7Ozs7UUFRUyxNQUFNLENBQ2QsSUFBWSxFQUNaLFFBQWdEO1lBRWhELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUUsSUFBSSxDQUFFLENBQUM7WUFFSjtnQkFDNUMsSUFBSyxDQUFDLE9BQU8sRUFBRztvQkFDZCxNQUFNLElBQUksS0FBSyxDQUFFLG9CQUFxQixJQUFLLEVBQUUsQ0FBRSxDQUFDO2lCQUNqRDthQUNGO1lBRUQsSUFBSyxRQUFRLEVBQUc7Z0JBQ2QsT0FBUSxDQUFDLFNBQVMsQ0FBRSxRQUFRLENBQUUsQ0FBQzthQUNoQztZQUVELE9BQU8sT0FBUSxDQUFDLFlBQVksQ0FBQztTQUM5Qjs7Ozs7Ozs7Ozs7Ozs7In0=
