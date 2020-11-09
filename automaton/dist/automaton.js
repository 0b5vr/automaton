/*!
* @fms-cat/automaton v3.0.1
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
            this.__items = data.items.map((item) => new ChannelItem(this.__automaton, item));
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
            p1: node0.time + (node0.out.time),
            p2: node1.time + (node1.in.time),
            p3: node1.time
        }, {
            p0: node0.value,
            p1: node0.value + (node0.out.value),
            p2: node1.value + (node1.in.value),
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
                var _a, _b, _c, _d;
                return ({
                    time: (_a = node.time) !== null && _a !== void 0 ? _a : 0.0,
                    value: (_b = node.value) !== null && _b !== void 0 ? _b : 0.0,
                    in: (_c = node.in) !== null && _c !== void 0 ? _c : { time: 0.0, value: 0.0 },
                    out: (_d = node.out) !== null && _d !== void 0 ? _d : { time: 0.0, value: 0.0 }
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
             * Current time of the automaton.
             * Can be set by [[update]], be retrieved by [[get time]], be used by [[auto]]
             */
            this.__time = 0.0;
            /**
             * Version of the automaton.
             */
            this.__version = '3.0.1';
            /**
             * Resolution of the timeline.
             */
            this.__resolution = 1000;
            /**
             * Curves of the automaton.
             */
            this.__curves = [];
            /**
             * Channels of the timeline.
             */
            this.__channels = {};
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
            this.__curves = data.curves.map((data) => new Curve(this, data));
            for (const name in data.channels) {
                this.__channels[name] = new Channel(this, data.channels[name]);
            }
        }
        /**
         * Add fx definitions.
         * @param fxDefinitions A map of id - fx definition
         */
        addFxDefinitions(fxDefinitions) {
            Object.entries(fxDefinitions).forEach(([id, fxDef]) => {
                {
                    if (this.__fxDefinitions[id] != null) {
                        console.warn(`Overwriting the existing fx definition: ${id}`);
                    }
                }
                this.__fxDefinitions[id] = fxDef;
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
            return this.__curves[index] || null;
        }
        /**
         * Precalculate all curves.
         */
        precalcAll() {
            Object.values(this.__curves).forEach((curve) => curve.precalc());
        }
        /**
         * Reset the internal states of channels.
         * **Call this method when you seek the time.**
         */
        reset() {
            Object.values(this.__channels).forEach((channel) => channel.reset());
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
            for (const channel of Object.values(this.__channels)) {
                channel.update(this.__time);
            }
        }
        /**
         * Assigned to {@link Automaton#auto} on its initialize phase.
         * @param name The name of the channel
         * @param listener A function that will be executed when the channel changes its value
         * @returns Current value of the channel
         */
        __auto(name, listener) {
            if (listener) {
                this.__channels[name].subscribe(listener);
            }
            return this.__channels[name].currentValue;
        }
    }

    exports.Automaton = Automaton;
    exports.Channel = Channel;
    exports.ChannelItem = ChannelItem;
    exports.Curve = Curve;
    exports.default = Automaton;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b21hdG9uLmpzIiwic291cmNlcyI6WyIuLi9zcmMvQ2hhbm5lbEl0ZW0udHMiLCIuLi9zcmMvQ2hhbm5lbC50cyIsIi4uL3NyYy91dGlscy9iZXppZXJFYXNpbmcudHMiLCIuLi9zcmMvQ3VydmUudHMiLCIuLi9zcmMvQXV0b21hdG9uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEF1dG9tYXRvbiwgQ3VydmUgfSBmcm9tICcuJztcbmltcG9ydCB0eXBlIHsgU2VyaWFsaXplZENoYW5uZWxJdGVtIH0gZnJvbSAnLi90eXBlcy9TZXJpYWxpemVkQ2hhbm5lbEl0ZW0nO1xuXG4vKipcbiAqIFJlcHJlc2VudHMgYW4gaXRlbSBvZiBhIFtbQ2hhbm5lbF1dLlxuICovXG5leHBvcnQgY2xhc3MgQ2hhbm5lbEl0ZW0ge1xuICAvKipcbiAgICogVGhlIHBhcmVudCBhdXRvbWF0b24uXG4gICAqL1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgX19hdXRvbWF0b246IEF1dG9tYXRvbjtcblxuICAvKipcbiAgICogQmVnaW5uaW5nIHRpbWVwb2ludCBvZiB0aGUgaXRlbS5cbiAgICovXG4gIHB1YmxpYyB0aW1lITogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBMZW5ndGggb2YgdGhlIGl0ZW0uXG4gICAqL1xuICBwdWJsaWMgbGVuZ3RoITogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBWYWx1ZSBvZiB0aGUgaXRlbS5cbiAgICovXG4gIHB1YmxpYyB2YWx1ZSE6IG51bWJlcjtcblxuICAvKipcbiAgICogV2hldGhlciByZXNldCBjaGFubmVscyB2YWx1ZSB0byB6ZXJvIGF0IHRoZSBlbmQgb2YgdGhpcyBpdGVtIG9yIG5vdC5cbiAgICovXG4gIHB1YmxpYyByZXNldD86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFRoaXMgd2lsbCBvbmx5IG1ha2Ugc2Vuc2Ugd2hlbiB7QGxpbmsgY3VydmV9IGlzIHNwZWNpZmllZC5cbiAgICogVGhlIHRpbWUgb2Zmc2V0IG9mIHRoZSBpdGVtLlxuICAgKi9cbiAgcHVibGljIG9mZnNldCE6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhpcyB3aWxsIG9ubHkgbWFrZSBzZW5zZSB3aGVuIHtAbGluayBjdXJ2ZX0gaXMgc3BlY2lmaWVkLlxuICAgKiBUaGUgc3BlZWQgcmF0ZSBvZiB0aGUgaXRlbS5cbiAgICovXG4gIHB1YmxpYyBzcGVlZCE6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhpcyB3aWxsIG9ubHkgbWFrZSBzZW5zZSB3aGVuIHtAbGluayBjdXJ2ZX0gaXMgc3BlY2lmaWVkLlxuICAgKiBUaGUgc2NhbGUgb2YgdGhlIGl0ZW0gaW4gdGhlIHZhbHVlIGF4aXMuXG4gICAqL1xuICBwdWJsaWMgYW1wITogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgY3VydmUgb2YgdGhlIGl0ZW0uXG4gICAqL1xuICBwdWJsaWMgY3VydmU/OiBDdXJ2ZTtcblxuICAvKipcbiAgICogRW5kaW5nIHRpbWVwb2ludCBvZiB0aGUgaXRlbS5cbiAgICovXG4gIHB1YmxpYyBnZXQgZW5kKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMudGltZSArIHRoaXMubGVuZ3RoO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yIG9mIHRoZSBbW0NoYW5uZWxJdGVtXV0uXG4gICAqIEBwYXJhbSBhdXRvbWF0b24gUGFyZW50IGF1dG9tYXRvblxuICAgKiBAcGFyYW0gZGF0YSBEYXRhIG9mIHRoZSBpdGVtXG4gICAqL1xuICBwdWJsaWMgY29uc3RydWN0b3IoIGF1dG9tYXRvbjogQXV0b21hdG9uLCBkYXRhOiBTZXJpYWxpemVkQ2hhbm5lbEl0ZW0gKSB7XG4gICAgdGhpcy5fX2F1dG9tYXRvbiA9IGF1dG9tYXRvbjtcblxuICAgIHRoaXMuZGVzZXJpYWxpemUoIGRhdGEgKTtcbiAgfVxuXG4gIHB1YmxpYyBnZXRWYWx1ZSggdGltZTogbnVtYmVyICk6IG51bWJlciB7XG4gICAgaWYgKCB0aGlzLnJlc2V0ICYmIHRoaXMubGVuZ3RoIDw9IHRpbWUgKSB7XG4gICAgICByZXR1cm4gMC4wO1xuICAgIH1cblxuICAgIGlmICggdGhpcy5jdXJ2ZSApIHtcbiAgICAgIGNvbnN0IHQgPSB0aGlzLm9mZnNldCEgKyB0aW1lICogdGhpcy5zcGVlZCE7XG4gICAgICByZXR1cm4gdGhpcy52YWx1ZSArIHRoaXMuYW1wICogdGhpcy5jdXJ2ZS5nZXRWYWx1ZSggdCApO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy52YWx1ZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRGVzZXJpYWxpemUgYSBzZXJpYWxpemVkIGRhdGEgb2YgaXRlbSBmcm9tIFtbU2VyaWFsaXplZENoYW5uZWxJdGVtXV0uXG4gICAqIEBwYXJhbSBkYXRhIEEgc2VyaWFsaXplZCBpdGVtLlxuICAgKi9cbiAgcHVibGljIGRlc2VyaWFsaXplKCBkYXRhOiBTZXJpYWxpemVkQ2hhbm5lbEl0ZW0gKTogdm9pZCB7XG4gICAgdGhpcy50aW1lID0gZGF0YS50aW1lID8/IDAuMDtcbiAgICB0aGlzLmxlbmd0aCA9IGRhdGEubGVuZ3RoID8/IDAuMDtcbiAgICB0aGlzLnZhbHVlID0gZGF0YS52YWx1ZSA/PyAwLjA7XG4gICAgdGhpcy5vZmZzZXQgPSBkYXRhLm9mZnNldCA/PyAwLjA7XG4gICAgdGhpcy5zcGVlZCA9IGRhdGEuc3BlZWQgPz8gMS4wO1xuICAgIHRoaXMuYW1wID0gZGF0YS5hbXAgPz8gMS4wO1xuICAgIHRoaXMucmVzZXQgPSBkYXRhLnJlc2V0O1xuICAgIGlmICggZGF0YS5jdXJ2ZSAhPSBudWxsICkge1xuICAgICAgdGhpcy5jdXJ2ZSA9IHRoaXMuX19hdXRvbWF0b24uZ2V0Q3VydmUoIGRhdGEuY3VydmUgKSE7XG4gICAgICB0aGlzLmxlbmd0aCA9IGRhdGEubGVuZ3RoID8/IHRoaXMuY3VydmUubGVuZ3RoID8/IDAuMDtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IEF1dG9tYXRvbiB9IGZyb20gJy4vQXV0b21hdG9uJztcbmltcG9ydCB7IENoYW5uZWxJdGVtIH0gZnJvbSAnLi9DaGFubmVsSXRlbSc7XG5pbXBvcnQgdHlwZSB7IENoYW5uZWxVcGRhdGVFdmVudCB9IGZyb20gJy4vdHlwZXMvQ2hhbm5lbFVwZGF0ZUV2ZW50JztcbmltcG9ydCB0eXBlIHsgU2VyaWFsaXplZENoYW5uZWwgfSBmcm9tICcuL3R5cGVzL1NlcmlhbGl6ZWRDaGFubmVsJztcblxuLyoqXG4gKiBJdCByZXByZXNlbnRzIGEgY2hhbm5lbCBvZiBBdXRvbWF0b24uXG4gKi9cbmV4cG9ydCBjbGFzcyBDaGFubmVsIHtcbiAgLyoqXG4gICAqIFRoZSBwYXJlbnQgYXV0b21hdG9uLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fYXV0b21hdG9uOiBBdXRvbWF0b247XG5cbiAgLyoqXG4gICAqIExpc3Qgb2YgY2hhbm5lbCBpdGVtcy5cbiAgICovXG4gIHByb3RlY3RlZCBfX2l0ZW1zOiBDaGFubmVsSXRlbVtdID0gW107XG5cbiAgLyoqXG4gICAqIEEgY2FjaGUgb2YgbGFzdCBjYWxjdWxhdGVkIHZhbHVlLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fdmFsdWU6IG51bWJlciA9IDAuMDtcblxuICAvKipcbiAgICogVGhlIHRpbWUgdGhhdCB3YXMgdXNlZCBmb3IgdGhlIGNhbGN1bGF0aW9uIG9mIFtbX19sYXN0VmFsdWVdXS5cbiAgICovXG4gIHByb3RlY3RlZCBfX3RpbWU6IG51bWJlciA9IC1JbmZpbml0eTtcblxuICAvKipcbiAgICogVGhlIGluZGV4IG9mIFtbX19pdGVtc11dIGl0IHNob3VsZCBldmFsdWF0ZSBuZXh0LlxuICAgKi9cbiAgcHJvdGVjdGVkIF9faGVhZDogbnVtYmVyID0gMDtcblxuICAvKipcbiAgICogQW4gYXJyYXkgb2YgbGlzdGVuZXJzLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fbGlzdGVuZXJzOiBBcnJheTwoIGV2ZW50OiBDaGFubmVsVXBkYXRlRXZlbnQgKSA9PiB2b2lkPiA9IFtdO1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RvciBvZiB0aGUgW1tDaGFubmVsXV0uXG4gICAqIEBwYXJhbSBhdXRvbWF0b24gUGFyZW50IGF1dG9tYXRvblxuICAgKiBAcGFyYW0gZGF0YSBEYXRhIG9mIHRoZSBjaGFubmVsXG4gICAqL1xuICBwdWJsaWMgY29uc3RydWN0b3IoIGF1dG9tYXRvbjogQXV0b21hdG9uLCBkYXRhOiBTZXJpYWxpemVkQ2hhbm5lbCApIHtcbiAgICB0aGlzLl9fYXV0b21hdG9uID0gYXV0b21hdG9uO1xuXG4gICAgdGhpcy5kZXNlcmlhbGl6ZSggZGF0YSApO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgY2FjaGUgb2YgbGFzdCBjYWxjdWxhdGVkIHZhbHVlLlxuICAgKi9cbiAgcHVibGljIGdldCBjdXJyZW50VmFsdWUoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX192YWx1ZTsgfVxuXG4gIC8qKlxuICAgKiBUaGUgdGltZSB0aGF0IHdhcyB1c2VkIGZvciB0aGUgY2FsY3VsYXRpb24gb2YgW1tfX2xhc3RWYWx1ZV1dLlxuICAgKi9cbiAgcHVibGljIGdldCBjdXJyZW50VGltZSgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fX3RpbWU7IH1cblxuICAvKipcbiAgICogTG9hZCBhIHNlcmlhbGl6ZWQgZGF0YSBvZiBhIGNoYW5uZWwuXG4gICAqIEBwYXJhbSBkYXRhIERhdGEgb2YgYSBjaGFubmVsXG4gICAqL1xuICBwdWJsaWMgZGVzZXJpYWxpemUoIGRhdGE6IFNlcmlhbGl6ZWRDaGFubmVsICk6IHZvaWQge1xuICAgIHRoaXMuX19pdGVtcyA9IGRhdGEuaXRlbXMubWFwKCAoIGl0ZW0gKSA9PiBuZXcgQ2hhbm5lbEl0ZW0oIHRoaXMuX19hdXRvbWF0b24sIGl0ZW0gKSApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0IHRoZSBpbnRlcm5hbCBzdGF0ZXMuXG4gICAqIENhbGwgdGhpcyBtZXRob2Qgd2hlbiB5b3Ugc2VlayB0aGUgdGltZS5cbiAgICovXG4gIHB1YmxpYyByZXNldCgpOiB2b2lkIHtcbiAgICB0aGlzLl9fdGltZSA9IC1JbmZpbml0eTtcbiAgICB0aGlzLl9fdmFsdWUgPSAwO1xuICAgIHRoaXMuX19oZWFkID0gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYSBuZXcgbGlzdGVuZXIgdGhhdCByZWNlaXZlcyBhIFtbQ2hhbm5lbFVwZGF0ZUV2ZW50XV0gd2hlbiBhbiB1cGRhdGUgaXMgaGFwcGVuZWQuXG4gICAqIEBwYXJhbSBsaXN0ZW5lciBBIHN1YnNjcmliaW5nIGxpc3RlbmVyXG4gICAqL1xuICBwdWJsaWMgc3Vic2NyaWJlKCBsaXN0ZW5lcjogKCBldmVudDogQ2hhbm5lbFVwZGF0ZUV2ZW50ICkgPT4gdm9pZCApOiB2b2lkIHtcbiAgICB0aGlzLl9fbGlzdGVuZXJzLnB1c2goIGxpc3RlbmVyICk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIHRoZSB2YWx1ZSBvZiBzcGVjaWZpZWQgdGltZSBwb2ludC5cbiAgICogQHBhcmFtIHRpbWUgVGltZSBhdCB0aGUgcG9pbnQgeW91IHdhbnQgdG8gZ3JhYiB0aGUgdmFsdWUuXG4gICAqIEByZXR1cm5zIFJlc3VsdCB2YWx1ZVxuICAgKi9cbiAgcHVibGljIGdldFZhbHVlKCB0aW1lOiBudW1iZXIgKTogbnVtYmVyIHtcbiAgICBsZXQgbmV4dCA9IHRoaXMuX19pdGVtcy5maW5kSW5kZXgoICggaXRlbSApID0+ICggdGltZSA8IGl0ZW0udGltZSApICk7XG5cbiAgICAvLyBpdCdzIHRoZSBmaXJzdCBvbmUhXG4gICAgaWYgKCBuZXh0ID09PSAwICkge1xuICAgICAgcmV0dXJuIDAuMDtcbiAgICB9XG5cbiAgICAvLyBpdCdzIHRoZSBsYXN0IG9uZSFcbiAgICBpZiAoIG5leHQgPT09IC0xICkge1xuICAgICAgbmV4dCA9IHRoaXMuX19pdGVtcy5sZW5ndGg7XG4gICAgfVxuXG4gICAgY29uc3QgaXRlbSA9IHRoaXMuX19pdGVtc1sgbmV4dCAtIDEgXTtcbiAgICBpZiAoIGl0ZW0uZW5kIDwgdGltZSApIHtcbiAgICAgIHJldHVybiBpdGVtLmdldFZhbHVlKCBpdGVtLmxlbmd0aCApO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gaXRlbS5nZXRWYWx1ZSggdGltZSAtIGl0ZW0udGltZSApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIG1ldGhvZCBpcyBpbnRlbmRlZCB0byBiZSB1c2VkIGJ5IFtbQXV0b21hdG9uLnVwZGF0ZV1dLlxuICAgKiBAcGFyYW0gdGltZSBUaGUgY3VycmVudCB0aW1lIG9mIHRoZSBwYXJlbnQgW1tBdXRvbWF0b25dXVxuICAgKiBAcmV0dXJucyB3aGV0aGVyIHRoZSB2YWx1ZSBoYXMgYmVlbiBjaGFuZ2VkIG9yIG5vdFxuICAgKi9cbiAgcHVibGljIHVwZGF0ZSggdGltZTogbnVtYmVyICk6IHZvaWQge1xuICAgIGxldCB2YWx1ZSA9IHRoaXMuX192YWx1ZTtcbiAgICBjb25zdCBwcmV2VGltZSA9IHRoaXMuX190aW1lO1xuXG4gICAgZm9yICggbGV0IGkgPSB0aGlzLl9faGVhZDsgaSA8IHRoaXMuX19pdGVtcy5sZW5ndGg7IGkgKysgKSB7XG4gICAgICBjb25zdCBpdGVtID0gdGhpcy5fX2l0ZW1zWyBpIF07XG4gICAgICBjb25zdCB7IHRpbWU6IGJlZ2luLCBlbmQsIGxlbmd0aCB9ID0gaXRlbTtcbiAgICAgIGxldCBlbGFwc2VkID0gdGltZSAtIGJlZ2luO1xuXG4gICAgICBpZiAoIGVsYXBzZWQgPCAwLjAgKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IHByb2dyZXNzOiBudW1iZXI7XG4gICAgICAgIGxldCBpbml0OiB0cnVlIHwgdW5kZWZpbmVkO1xuICAgICAgICBsZXQgdW5pbml0OiB0cnVlIHwgdW5kZWZpbmVkO1xuXG4gICAgICAgIGlmICggbGVuZ3RoIDw9IGVsYXBzZWQgKSB7XG4gICAgICAgICAgZWxhcHNlZCA9IGxlbmd0aDtcbiAgICAgICAgICBwcm9ncmVzcyA9IDEuMDtcbiAgICAgICAgICB1bmluaXQgPSB0cnVlO1xuXG4gICAgICAgICAgaWYgKCBpID09PSB0aGlzLl9faGVhZCApIHtcbiAgICAgICAgICAgIHRoaXMuX19oZWFkICsrO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwcm9ncmVzcyA9IGxlbmd0aCAhPT0gMC4wXG4gICAgICAgICAgICA/IGVsYXBzZWQgLyBsZW5ndGhcbiAgICAgICAgICAgIDogMS4wO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBwcmV2VGltZSA8IGJlZ2luICkge1xuICAgICAgICAgIGluaXQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFsdWUgPSBpdGVtLmdldFZhbHVlKCBlbGFwc2VkICk7XG5cbiAgICAgICAgdGhpcy5fX2xpc3RlbmVycy5mb3JFYWNoKCAoIGxpc3RlbmVyICkgPT4gbGlzdGVuZXIoIHtcbiAgICAgICAgICB0aW1lLFxuICAgICAgICAgIGVsYXBzZWQsXG4gICAgICAgICAgYmVnaW4sXG4gICAgICAgICAgZW5kLFxuICAgICAgICAgIGxlbmd0aCxcbiAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICBwcm9ncmVzcyxcbiAgICAgICAgICBpbml0LFxuICAgICAgICAgIHVuaW5pdCxcbiAgICAgICAgfSApICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fX3RpbWUgPSB0aW1lO1xuICAgIHRoaXMuX192YWx1ZSA9IHZhbHVlO1xuICB9XG59XG4iLCJpbXBvcnQgdHlwZSB7IEJlemllck5vZGUgfSBmcm9tICcuLi90eXBlcy9CZXppZXJOb2RlJztcblxuaW50ZXJmYWNlIEN1YmljQmV6aWVyQ29udHJvbFBvaW50cyB7XG4gIHAwOiBudW1iZXI7XG4gIHAxOiBudW1iZXI7XG4gIHAyOiBudW1iZXI7XG4gIHAzOiBudW1iZXI7XG59XG5cbmNvbnN0IE5FV1RPTl9JVEVSID0gNDtcbmNvbnN0IE5FV1RPTl9FUFNJTE9OID0gMC4wMDE7XG5jb25zdCBTVUJESVZfSVRFUiA9IDEwO1xuY29uc3QgU1VCRElWX0VQU0lMT04gPSAwLjAwMDAwMTtcbmNvbnN0IFRBQkxFX1NJWkUgPSAyMTtcblxuY29uc3QgX19jYWNoZTogbnVtYmVyW10gPSBbXTtcblxuZnVuY3Rpb24gY2xhbXAoIHg6IG51bWJlciwgbWluOiBudW1iZXIsIG1heDogbnVtYmVyICk6IG51bWJlciB7XG4gIHJldHVybiBNYXRoLm1pbiggTWF0aC5tYXgoIHgsIG1pbiApLCBtYXggKTtcbn1cblxuLypcbiAqICgxLXQpKDEtdCkoMS10KSBhMCA9ICgxLTJ0K3R0KSgxLXQpIGEwXG4gKiAgICAgICAgICAgICAgICAgICAgPSAoMS10LTJ0KzJ0dCt0dC10dHQpIGEwXG4gKiAgICAgICAgICAgICAgICAgICAgPSAoMS0zdCszdHQtdHR0KSBhMFxuICpcbiAqIDMoMS10KSgxLXQpdCBhMSA9IDMoMS0ydCt0dCl0IGExXG4gKiAgICAgICAgICAgICAgICAgPSAoM3QtNnR0KzN0dHQpIGExXG4gKlxuICogMygxLXQpdHQgYTIgPSAoM3R0LTN0dHQpIGEyXG4gKlxuICogdHR0IGEzXG4gKlxuICogKGEzLTNhMiszYTEtYTApIHR0dCArICgzYTItNmExKzNhMCkgdHQgKyAoM2ExLTNhMCkgdCArIGEwXG4gKi9cblxuZnVuY3Rpb24gQSggY3BzOiBDdWJpY0JlemllckNvbnRyb2xQb2ludHMgKTogbnVtYmVyIHtcbiAgcmV0dXJuIGNwcy5wMyAtIDMuMCAqIGNwcy5wMiArIDMuMCAqIGNwcy5wMSAtIGNwcy5wMDtcbn1cblxuZnVuY3Rpb24gQiggY3BzOiBDdWJpY0JlemllckNvbnRyb2xQb2ludHMgKTogbnVtYmVyIHtcbiAgcmV0dXJuIDMuMCAqIGNwcy5wMiAtIDYuMCAqIGNwcy5wMSArIDMuMCAqIGNwcy5wMDtcbn1cblxuZnVuY3Rpb24gQyggY3BzOiBDdWJpY0JlemllckNvbnRyb2xQb2ludHMgKTogbnVtYmVyIHtcbiAgcmV0dXJuIDMuMCAqIGNwcy5wMSAtIDMuMCAqIGNwcy5wMDtcbn1cblxuZnVuY3Rpb24gY3ViaWNCZXppZXIoIHQ6IG51bWJlciwgY3BzOiBDdWJpY0JlemllckNvbnRyb2xQb2ludHMgKTogbnVtYmVyIHtcbiAgcmV0dXJuICggKCBBKCBjcHMgKSAqIHQgKyBCKCBjcHMgKSApICogdCArIEMoIGNwcyApICkgKiB0ICsgY3BzLnAwO1xufVxuXG5mdW5jdGlvbiBkZWx0YUN1YmljQmV6aWVyKCB0OiBudW1iZXIsIGNwczogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzICk6IG51bWJlciB7XG4gIHJldHVybiAoIDMuMCAqIEEoIGNwcyApICogdCArIDIuMCAqIEIoIGNwcyApICkgKiB0ICsgQyggY3BzICk7XG59XG5cbmZ1bmN0aW9uIHN1YmRpdiggeDogbnVtYmVyLCBhOiBudW1iZXIsIGI6IG51bWJlciwgY3BzOiBDdWJpY0JlemllckNvbnRyb2xQb2ludHMgKTogbnVtYmVyIHtcbiAgbGV0IGNhbmRpZGF0ZVggPSAwO1xuICBsZXQgdCA9IDA7XG5cbiAgZm9yICggbGV0IGkgPSAwOyBpIDwgU1VCRElWX0lURVI7IGkgKysgKSB7XG4gICAgdCA9IGEgKyAoIGIgLSBhICkgLyAyLjA7XG4gICAgY2FuZGlkYXRlWCA9IGN1YmljQmV6aWVyKCB0LCBjcHMgKSAtIHg7XG4gICAgKCAwLjAgPCBjYW5kaWRhdGVYICkgPyAoIGIgPSB0ICkgOiAoIGEgPSB0ICk7XG4gICAgaWYgKCBTVUJESVZfRVBTSUxPTiA8IE1hdGguYWJzKCBjYW5kaWRhdGVYICkgKSB7IGJyZWFrOyB9XG4gIH1cblxuICByZXR1cm4gdDtcbn1cblxuZnVuY3Rpb24gbmV3dG9uKCB4OiBudW1iZXIsIHQ6IG51bWJlciwgY3BzOiBDdWJpY0JlemllckNvbnRyb2xQb2ludHMgKTogbnVtYmVyIHtcbiAgZm9yICggbGV0IGkgPSAwOyBpIDwgTkVXVE9OX0lURVI7IGkgKysgKSB7XG4gICAgY29uc3QgZCA9IGRlbHRhQ3ViaWNCZXppZXIoIHQsIGNwcyApO1xuICAgIGlmICggZCA9PT0gMC4wICkgeyByZXR1cm4gdDsgfVxuICAgIGNvbnN0IGN4ID0gY3ViaWNCZXppZXIoIHQsIGNwcyApIC0geDtcbiAgICB0IC09IGN4IC8gZDtcbiAgfVxuXG4gIHJldHVybiB0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmF3QmV6aWVyRWFzaW5nKFxuICBjcHN4OiBDdWJpY0JlemllckNvbnRyb2xQb2ludHMsXG4gIGNwc3k6IEN1YmljQmV6aWVyQ29udHJvbFBvaW50cyxcbiAgeDogbnVtYmVyXG4pOiBudW1iZXIge1xuICBpZiAoIHggPD0gY3BzeC5wMCApIHsgcmV0dXJuIGNwc3kucDA7IH0gLy8gY2xhbXBlZFxuICBpZiAoIGNwc3gucDMgPD0geCApIHsgcmV0dXJuIGNwc3kucDM7IH0gLy8gY2xhbXBlZFxuXG4gIGNwc3gucDEgPSBjbGFtcCggY3BzeC5wMSwgY3BzeC5wMCwgY3BzeC5wMyApO1xuICBjcHN4LnAyID0gY2xhbXAoIGNwc3gucDIsIGNwc3gucDAsIGNwc3gucDMgKTtcblxuICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBUQUJMRV9TSVpFOyBpICsrICkge1xuICAgIF9fY2FjaGVbIGkgXSA9IGN1YmljQmV6aWVyKCBpIC8gKCBUQUJMRV9TSVpFIC0gMS4wICksIGNwc3ggKTtcbiAgfVxuXG4gIGxldCBzYW1wbGUgPSAwO1xuICBmb3IgKCBsZXQgaSA9IDE7IGkgPCBUQUJMRV9TSVpFOyBpICsrICkge1xuICAgIHNhbXBsZSA9IGkgLSAxO1xuICAgIGlmICggeCA8IF9fY2FjaGVbIGkgXSApIHsgYnJlYWs7IH1cbiAgfVxuXG4gIGNvbnN0IGRpc3QgPSAoIHggLSBfX2NhY2hlWyBzYW1wbGUgXSApIC8gKCBfX2NhY2hlWyBzYW1wbGUgKyAxIF0gLSBfX2NhY2hlWyBzYW1wbGUgXSApO1xuICBsZXQgdCA9ICggc2FtcGxlICsgZGlzdCApIC8gKCBUQUJMRV9TSVpFIC0gMSApO1xuICBjb25zdCBkID0gZGVsdGFDdWJpY0JlemllciggdCwgY3BzeCApIC8gKCBjcHN4LnAzIC0gY3BzeC5wMCApO1xuXG4gIGlmICggTkVXVE9OX0VQU0lMT04gPD0gZCApIHtcbiAgICB0ID0gbmV3dG9uKCB4LCB0LCBjcHN4ICk7XG4gIH0gZWxzZSBpZiAoIGQgIT09IDAuMCApIHtcbiAgICB0ID0gc3ViZGl2KCB4LCAoIHNhbXBsZSApIC8gKCBUQUJMRV9TSVpFIC0gMSApLCAoIHNhbXBsZSArIDEuMCApIC8gKCBUQUJMRV9TSVpFIC0gMSApLCBjcHN4ICk7XG4gIH1cblxuICByZXR1cm4gY3ViaWNCZXppZXIoIHQsIGNwc3kgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJlemllckVhc2luZyggbm9kZTA6IEJlemllck5vZGUsIG5vZGUxOiBCZXppZXJOb2RlLCB0aW1lOiBudW1iZXIgKTogbnVtYmVyIHtcbiAgcmV0dXJuIHJhd0JlemllckVhc2luZyhcbiAgICB7XG4gICAgICBwMDogbm9kZTAudGltZSxcbiAgICAgIHAxOiBub2RlMC50aW1lICsgKCBub2RlMC5vdXQudGltZSApLFxuICAgICAgcDI6IG5vZGUxLnRpbWUgKyAoIG5vZGUxLmluLnRpbWUgKSxcbiAgICAgIHAzOiBub2RlMS50aW1lXG4gICAgfSxcbiAgICB7XG4gICAgICBwMDogbm9kZTAudmFsdWUsXG4gICAgICBwMTogbm9kZTAudmFsdWUgKyAoIG5vZGUwLm91dC52YWx1ZSApLFxuICAgICAgcDI6IG5vZGUxLnZhbHVlICsgKCBub2RlMS5pbi52YWx1ZSApLFxuICAgICAgcDM6IG5vZGUxLnZhbHVlXG4gICAgfSxcbiAgICB0aW1lXG4gICk7XG59XG4iLCJpbXBvcnQgeyBBdXRvbWF0b24gfSBmcm9tICcuL0F1dG9tYXRvbic7XG5pbXBvcnQgeyBiZXppZXJFYXNpbmcgfSBmcm9tICcuL3V0aWxzL2JlemllckVhc2luZyc7XG5pbXBvcnQgdHlwZSB7IEJlemllck5vZGUgfSBmcm9tICcuL3R5cGVzL0Jlemllck5vZGUnO1xuaW1wb3J0IHR5cGUgeyBGeENvbnRleHQgfSBmcm9tICcuL3R5cGVzL0Z4RGVmaW5pdGlvbic7XG5pbXBvcnQgdHlwZSB7IEZ4U2VjdGlvbiB9IGZyb20gJy4vdHlwZXMvRnhTZWN0aW9uJztcbmltcG9ydCB0eXBlIHsgU2VyaWFsaXplZEN1cnZlIH0gZnJvbSAnLi90eXBlcy9TZXJpYWxpemVkQ3VydmUnO1xuXG4vKipcbiAqIEl0IHJlcHJlc2VudHMgYSBjdXJ2ZSBvZiBBdXRvbWF0b24uXG4gKi9cbmV4cG9ydCBjbGFzcyBDdXJ2ZSB7XG4gIC8qKlxuICAgKiBUaGUgcGFyZW50IGF1dG9tYXRvbi5cbiAgICovXG4gIHByb3RlY3RlZCBfX2F1dG9tYXRvbjogQXV0b21hdG9uO1xuXG4gIC8qKlxuICAgKiBBbiBhcnJheSBvZiBwcmVjYWxjdWxhdGVkIHZhbHVlLlxuICAgKiBJdHMgbGVuZ3RoIGlzIHNhbWUgYXMgYGN1cnZlLl9fYXV0b21hdG9uLnJlc29sdXRpb24gKiBjdXJ2ZS5fX2F1dG9tYXRvbi5sZW5ndGggKyAxYC5cbiAgKi9cbiAgcHJvdGVjdGVkIF9fdmFsdWVzITogRmxvYXQzMkFycmF5O1xuXG4gIC8qKlxuICAgKiBMaXN0IG9mIGJlemllciBub2RlLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fbm9kZXM6IEJlemllck5vZGVbXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBMaXN0IG9mIGZ4IHNlY3Rpb25zLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fZnhzOiBGeFNlY3Rpb25bXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBUaGUgbGVuZ3RoIG9mIHRoaXMgY3VydmUuXG4gICAqL1xuICBwdWJsaWMgZ2V0IGxlbmd0aCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9fbm9kZXNbIHRoaXMuX19ub2Rlcy5sZW5ndGggLSAxIF0udGltZTtcbiAgfVxuXG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yIG9mIGEgW1tDdXJ2ZV1dLlxuICAgKiBAcGFyYW0gYXV0b21hdG9uIFBhcmVudCBhdXRvbWF0b25cbiAgICogQHBhcmFtIGRhdGEgRGF0YSBvZiB0aGUgY3VydmVcbiAgICovXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggYXV0b21hdG9uOiBBdXRvbWF0b24sIGRhdGE6IFNlcmlhbGl6ZWRDdXJ2ZSApIHtcbiAgICB0aGlzLl9fYXV0b21hdG9uID0gYXV0b21hdG9uO1xuXG4gICAgdGhpcy5kZXNlcmlhbGl6ZSggZGF0YSApO1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWQgYSBzZXJpYWxpemVkIGRhdGEgb2YgYSBjdXJ2ZS5cbiAgICogQHBhcmFtIGRhdGEgRGF0YSBvZiBhIGN1cnZlXG4gICAqL1xuICBwdWJsaWMgZGVzZXJpYWxpemUoIGRhdGE6IFNlcmlhbGl6ZWRDdXJ2ZSApOiB2b2lkIHtcbiAgICB0aGlzLl9fbm9kZXMgPSBkYXRhLm5vZGVzLm1hcCggKCBub2RlICkgPT4gKCB7XG4gICAgICB0aW1lOiBub2RlLnRpbWUgPz8gMC4wLFxuICAgICAgdmFsdWU6IG5vZGUudmFsdWUgPz8gMC4wLFxuICAgICAgaW46IG5vZGUuaW4gPz8geyB0aW1lOiAwLjAsIHZhbHVlOiAwLjAgfSxcbiAgICAgIG91dDogbm9kZS5vdXQgPz8geyB0aW1lOiAwLjAsIHZhbHVlOiAwLjAgfVxuICAgIH0gKSApO1xuXG4gICAgdGhpcy5fX2Z4cyA9IFtdO1xuICAgIGRhdGEuZnhzPy5mb3JFYWNoKCAoIGZ4ICkgPT4ge1xuICAgICAgaWYgKCBmeC5ieXBhc3MgKSB7IHJldHVybjsgfVxuICAgICAgdGhpcy5fX2Z4cy5wdXNoKCB7XG4gICAgICAgIHRpbWU6IGZ4LnRpbWUgPz8gMC4wLFxuICAgICAgICBsZW5ndGg6IGZ4Lmxlbmd0aCA/PyAwLjAsXG4gICAgICAgIHJvdzogZngucm93ID8/IDAsXG4gICAgICAgIGRlZjogZnguZGVmLFxuICAgICAgICBwYXJhbXM6IGZ4LnBhcmFtc1xuICAgICAgfSApO1xuICAgIH0gKTtcblxuICAgIHRoaXMucHJlY2FsYygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFByZWNhbGN1bGF0ZSB2YWx1ZSBvZiBzYW1wbGVzLlxuICAgKi9cbiAgcHVibGljIHByZWNhbGMoKTogdm9pZCB7XG4gICAgdGhpcy5fX3ZhbHVlcyA9IG5ldyBGbG9hdDMyQXJyYXkoXG4gICAgICBNYXRoLmNlaWwoIHRoaXMuX19hdXRvbWF0b24ucmVzb2x1dGlvbiAqIHRoaXMubGVuZ3RoICkgKyAxXG4gICAgKTtcblxuICAgIHRoaXMuX19nZW5lcmF0ZUN1cnZlKCk7XG4gICAgdGhpcy5fX2FwcGx5RnhzKCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIHRoZSB2YWx1ZSBvZiBzcGVjaWZpZWQgdGltZSBwb2ludC5cbiAgICogQHBhcmFtIHRpbWUgVGltZSBhdCB0aGUgcG9pbnQgeW91IHdhbnQgdG8gZ3JhYiB0aGUgdmFsdWUuXG4gICAqIEByZXR1cm5zIFJlc3VsdCB2YWx1ZVxuICAgKi9cbiAgcHVibGljIGdldFZhbHVlKCB0aW1lOiBudW1iZXIgKTogbnVtYmVyIHtcbiAgICBpZiAoIHRpbWUgPCAwLjAgKSB7XG4gICAgICAvLyBjbGFtcCBsZWZ0XG4gICAgICByZXR1cm4gdGhpcy5fX3ZhbHVlc1sgMCBdO1xuXG4gICAgfSBlbHNlIGlmICggdGhpcy5sZW5ndGggPD0gdGltZSApIHtcbiAgICAgIC8vIGNsYW1wIHJpZ2h0XG4gICAgICByZXR1cm4gdGhpcy5fX3ZhbHVlc1sgdGhpcy5fX3ZhbHVlcy5sZW5ndGggLSAxIF07XG5cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gZmV0Y2ggdHdvIHZhbHVlcyB0aGVuIGRvIHRoZSBsaW5lYXIgaW50ZXJwb2xhdGlvblxuICAgICAgY29uc3QgaW5kZXggPSB0aW1lICogdGhpcy5fX2F1dG9tYXRvbi5yZXNvbHV0aW9uO1xuICAgICAgY29uc3QgaW5kZXhpID0gTWF0aC5mbG9vciggaW5kZXggKTtcbiAgICAgIGNvbnN0IGluZGV4ZiA9IGluZGV4ICUgMS4wO1xuXG4gICAgICBjb25zdCB2MCA9IHRoaXMuX192YWx1ZXNbIGluZGV4aSBdO1xuICAgICAgY29uc3QgdjEgPSB0aGlzLl9fdmFsdWVzWyBpbmRleGkgKyAxIF07XG5cbiAgICAgIGNvbnN0IHYgPSB2MCArICggdjEgLSB2MCApICogaW5kZXhmO1xuXG4gICAgICByZXR1cm4gdjtcblxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgZmlyc3Qgc3RlcCBvZiB7QGxpbmsgcHJlY2FsY306IGdlbmVyYXRlIGEgY3VydmUgb3V0IG9mIG5vZGVzLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fZ2VuZXJhdGVDdXJ2ZSgpOiB2b2lkIHtcbiAgICBsZXQgbm9kZVRhaWwgPSB0aGlzLl9fbm9kZXNbIDAgXTtcbiAgICBsZXQgaVRhaWwgPSAwO1xuICAgIGZvciAoIGxldCBpTm9kZSA9IDA7IGlOb2RlIDwgdGhpcy5fX25vZGVzLmxlbmd0aCAtIDE7IGlOb2RlICsrICkge1xuICAgICAgY29uc3Qgbm9kZTAgPSBub2RlVGFpbDtcbiAgICAgIG5vZGVUYWlsID0gdGhpcy5fX25vZGVzWyBpTm9kZSArIDEgXTtcbiAgICAgIGNvbnN0IGkwID0gaVRhaWw7XG4gICAgICBpVGFpbCA9IE1hdGguZmxvb3IoIG5vZGVUYWlsLnRpbWUgKiB0aGlzLl9fYXV0b21hdG9uLnJlc29sdXRpb24gKTtcblxuICAgICAgdGhpcy5fX3ZhbHVlc1sgaTAgXSA9IG5vZGUwLnZhbHVlO1xuICAgICAgZm9yICggbGV0IGkgPSBpMCArIDE7IGkgPD0gaVRhaWw7IGkgKysgKSB7XG4gICAgICAgIGNvbnN0IHRpbWUgPSBpIC8gdGhpcy5fX2F1dG9tYXRvbi5yZXNvbHV0aW9uO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGJlemllckVhc2luZyggbm9kZTAsIG5vZGVUYWlsLCB0aW1lICk7XG4gICAgICAgIHRoaXMuX192YWx1ZXNbIGkgXSA9IHZhbHVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoIGxldCBpID0gaVRhaWwgKyAxOyBpIDwgdGhpcy5fX3ZhbHVlcy5sZW5ndGg7IGkgKysgKSB7XG4gICAgICB0aGlzLl9fdmFsdWVzWyBpIF0gPSBub2RlVGFpbC52YWx1ZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVGhlIHNlY29uZCBzdGVwIG9mIHtAbGluayBwcmVjYWxjfTogYXBwbHkgZnhzIHRvIHRoZSBnZW5lcmF0ZWQgY3VydmVzLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fYXBwbHlGeHMoKTogdm9pZCB7XG4gICAgZm9yICggbGV0IGlGeCA9IDA7IGlGeCA8IHRoaXMuX19meHMubGVuZ3RoOyBpRnggKysgKSB7XG4gICAgICBjb25zdCBmeCA9IHRoaXMuX19meHNbIGlGeCBdO1xuICAgICAgY29uc3QgZnhEZWYgPSB0aGlzLl9fYXV0b21hdG9uLmdldEZ4RGVmaW5pdGlvbiggZnguZGVmICk7XG4gICAgICBpZiAoICFmeERlZiApIHtcbiAgICAgICAgaWYgKCBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50JyApIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oIGBObyBzdWNoIGZ4IGRlZmluaXRpb246ICR7IGZ4LmRlZiB9YCApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGF2YWlsYWJsZUVuZCA9IE1hdGgubWluKCB0aGlzLmxlbmd0aCwgZngudGltZSArIGZ4Lmxlbmd0aCApO1xuICAgICAgY29uc3QgaTAgPSBNYXRoLmNlaWwoIHRoaXMuX19hdXRvbWF0b24ucmVzb2x1dGlvbiAqIGZ4LnRpbWUgKTtcbiAgICAgIGNvbnN0IGkxID0gTWF0aC5mbG9vciggdGhpcy5fX2F1dG9tYXRvbi5yZXNvbHV0aW9uICogYXZhaWxhYmxlRW5kICk7XG4gICAgICBpZiAoIGkxIDw9IGkwICkge1xuICAgICAgICBpZiAoIHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAnZGV2ZWxvcG1lbnQnICkge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoICdMZW5ndGggb2YgdGhlIGZ4IHNlY3Rpb24gaXMgYmVpbmcgbmVnYXRpdmUnICk7XG4gICAgICAgIH1cblxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdGVtcExlbmd0aCA9IGkxIC0gaTAgKyAxO1xuICAgICAgY29uc3QgdGVtcFZhbHVlcyA9IG5ldyBGbG9hdDMyQXJyYXkoIHRlbXBMZW5ndGggKTtcblxuICAgICAgY29uc3QgY29udGV4dDogRnhDb250ZXh0ID0ge1xuICAgICAgICBpbmRleDogaTAsXG4gICAgICAgIGkwLFxuICAgICAgICBpMSxcbiAgICAgICAgdGltZTogZngudGltZSxcbiAgICAgICAgdDA6IGZ4LnRpbWUsXG4gICAgICAgIHQxOiBmeC50aW1lICsgZngubGVuZ3RoLFxuICAgICAgICBkZWx0YVRpbWU6IDEuMCAvIHRoaXMuX19hdXRvbWF0b24ucmVzb2x1dGlvbixcbiAgICAgICAgdmFsdWU6IDAuMCxcbiAgICAgICAgcHJvZ3Jlc3M6IDAuMCxcbiAgICAgICAgZWxhcHNlZDogMC4wLFxuICAgICAgICByZXNvbHV0aW9uOiB0aGlzLl9fYXV0b21hdG9uLnJlc29sdXRpb24sXG4gICAgICAgIGxlbmd0aDogZngubGVuZ3RoLFxuICAgICAgICBwYXJhbXM6IGZ4LnBhcmFtcyxcbiAgICAgICAgYXJyYXk6IHRoaXMuX192YWx1ZXMsXG4gICAgICAgIGdldFZhbHVlOiB0aGlzLmdldFZhbHVlLmJpbmQoIHRoaXMgKSxcbiAgICAgICAgaW5pdDogdHJ1ZSxcbiAgICAgICAgc3RhdGU6IHt9XG4gICAgICB9O1xuXG4gICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0ZW1wTGVuZ3RoOyBpICsrICkge1xuICAgICAgICBjb250ZXh0LmluZGV4ID0gaSArIGkwO1xuICAgICAgICBjb250ZXh0LnRpbWUgPSBjb250ZXh0LmluZGV4IC8gdGhpcy5fX2F1dG9tYXRvbi5yZXNvbHV0aW9uO1xuICAgICAgICBjb250ZXh0LnZhbHVlID0gdGhpcy5fX3ZhbHVlc1sgaSArIGkwIF07XG4gICAgICAgIGNvbnRleHQuZWxhcHNlZCA9IGNvbnRleHQudGltZSAtIGZ4LnRpbWU7XG4gICAgICAgIGNvbnRleHQucHJvZ3Jlc3MgPSBjb250ZXh0LmVsYXBzZWQgLyBmeC5sZW5ndGg7XG4gICAgICAgIHRlbXBWYWx1ZXNbIGkgXSA9IGZ4RGVmLmZ1bmMoIGNvbnRleHQgKTtcblxuICAgICAgICBjb250ZXh0LmluaXQgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fX3ZhbHVlcy5zZXQoIHRlbXBWYWx1ZXMsIGkwICk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBDaGFubmVsIH0gZnJvbSAnLi9DaGFubmVsJztcbmltcG9ydCB7IEN1cnZlIH0gZnJvbSAnLi9DdXJ2ZSc7XG5pbXBvcnQgdHlwZSB7IEF1dG9tYXRvbk9wdGlvbnMgfSBmcm9tICcuL3R5cGVzL0F1dG9tYXRvbk9wdGlvbnMnO1xuaW1wb3J0IHR5cGUgeyBDaGFubmVsVXBkYXRlRXZlbnQgfSBmcm9tICcuL3R5cGVzL0NoYW5uZWxVcGRhdGVFdmVudCc7XG5pbXBvcnQgdHlwZSB7IEZ4RGVmaW5pdGlvbiB9IGZyb20gJy4vdHlwZXMvRnhEZWZpbml0aW9uJztcbmltcG9ydCB0eXBlIHsgU2VyaWFsaXplZEF1dG9tYXRvbiB9IGZyb20gJy4vdHlwZXMvU2VyaWFsaXplZEF1dG9tYXRvbic7XG5cbi8qKlxuICogSVQnUyBBVVRPTUFUT04hXG4gKiBAcGFyYW0gZGF0YSBTZXJpYWxpemVkIGRhdGEgb2YgdGhlIGF1dG9tYXRvblxuICogQHBhcmFtIG9wdGlvbnMgT3B0aW9ucyBmb3IgdGhpcyBBdXRvbWF0b24gaW5zdGFuY2VcbiAqL1xuZXhwb3J0IGNsYXNzIEF1dG9tYXRvbiB7XG4gIC8qKlxuICAgKiBJdCByZXR1cm5zIHRoZSBjdXJyZW50IHZhbHVlIG9mIHRoZSBbW0NoYW5uZWxdXSBjYWxsZWQgYG5hbWVgLlxuICAgKiBJZiB0aGUgYG5hbWVgIGlzIGFuIGFycmF5LCBpdCByZXR1cm5zIGEgc2V0IG9mIG5hbWUgOiBjaGFubmVsIGFzIGFuIG9iamVjdCBpbnN0ZWFkLlxuICAgKiBZb3UgY2FuIGFsc28gZ2l2ZSBhIGxpc3RlbmVyIHdoaWNoIHdpbGwgYmUgZXhlY3V0ZWQgd2hlbiB0aGUgY2hhbm5lbCBjaGFuZ2VzIGl0cyB2YWx1ZSAob3B0aW9uYWwpLlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbmFtZSBvZiB0aGUgY2hhbm5lbFxuICAgKiBAcGFyYW0gbGlzdGVuZXIgQSBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgZXhlY3V0ZWQgd2hlbiB0aGUgY2hhbm5lbCBjaGFuZ2VzIGl0cyB2YWx1ZVxuICAgKiBAcmV0dXJucyBDdXJyZW50IHZhbHVlIG9mIHRoZSBjaGFubmVsXG4gICAqL1xuICBwdWJsaWMgYXV0byA9IHRoaXMuX19hdXRvLmJpbmQoIHRoaXMgKTtcblxuICAvKipcbiAgICogQ3VycmVudCB0aW1lIG9mIHRoZSBhdXRvbWF0b24uXG4gICAqIENhbiBiZSBzZXQgYnkgW1t1cGRhdGVdXSwgYmUgcmV0cmlldmVkIGJ5IFtbZ2V0IHRpbWVdXSwgYmUgdXNlZCBieSBbW2F1dG9dXVxuICAgKi9cbiAgcHJvdGVjdGVkIF9fdGltZTogbnVtYmVyID0gMC4wO1xuXG4gIC8qKlxuICAgKiBWZXJzaW9uIG9mIHRoZSBhdXRvbWF0b24uXG4gICAqL1xuICBwcm90ZWN0ZWQgX192ZXJzaW9uOiBzdHJpbmcgPSBwcm9jZXNzLmVudi5WRVJTSU9OITtcblxuICAvKipcbiAgICogUmVzb2x1dGlvbiBvZiB0aGUgdGltZWxpbmUuXG4gICAqL1xuICBwcm90ZWN0ZWQgX19yZXNvbHV0aW9uOiBudW1iZXIgPSAxMDAwO1xuXG4gIC8qKlxuICAgKiBDdXJ2ZXMgb2YgdGhlIGF1dG9tYXRvbi5cbiAgICovXG4gIHByb3RlY3RlZCBfX2N1cnZlczogQ3VydmVbXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBDaGFubmVscyBvZiB0aGUgdGltZWxpbmUuXG4gICAqL1xuICBwcm90ZWN0ZWQgX19jaGFubmVsczogeyBbIG5hbWU6IHN0cmluZyBdOiBDaGFubmVsIH0gPSB7fTtcblxuICAvKipcbiAgICogQSBtYXAgb2YgZnggZGVmaW5pdGlvbnMuXG4gICAqL1xuICBwcm90ZWN0ZWQgX19meERlZmluaXRpb25zOiB7IFsgbmFtZTogc3RyaW5nIF06IEZ4RGVmaW5pdGlvbiB9ID0ge307XG5cbiAgcHVibGljIGNvbnN0cnVjdG9yKFxuICAgIGRhdGE6IFNlcmlhbGl6ZWRBdXRvbWF0b24sXG4gICAgb3B0aW9uczogQXV0b21hdG9uT3B0aW9ucyA9IHt9XG4gICkge1xuICAgIG9wdGlvbnMuZnhEZWZpbml0aW9ucyAmJiB0aGlzLmFkZEZ4RGVmaW5pdGlvbnMoIG9wdGlvbnMuZnhEZWZpbml0aW9ucyApO1xuICAgIHRoaXMuZGVzZXJpYWxpemUoIGRhdGEgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDdXJyZW50IHRpbWUgb2YgdGhlIGF1dG9tYXRvbiwgdGhhdCBpcyBzZXQgdmlhIFtbdXBkYXRlXV0uXG4gICAqL1xuICBwdWJsaWMgZ2V0IHRpbWUoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX190aW1lOyB9XG5cbiAgLyoqXG4gICAqIFZlcnNpb24gb2YgdGhlIGF1dG9tYXRvbi5cbiAgICovXG4gIHB1YmxpYyBnZXQgdmVyc2lvbigpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5fX3ZlcnNpb247IH1cblxuICAvKipcbiAgICogUmVzb2x1dGlvbiA9IFNhbXBsaW5nIHBvaW50IHBlciBzZWNvbmQuXG4gICAqL1xuICBwdWJsaWMgZ2V0IHJlc29sdXRpb24oKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX19yZXNvbHV0aW9uOyB9XG5cbiAgLyoqXG4gICAqIExvYWQgc2VyaWFsaXplZCBhdXRvbWF0b24gZGF0YS5cbiAgICogQHBhcmFtIGRhdGEgU2VyaWFsaXplZCBvYmplY3QgY29udGFpbnMgYXV0b21hdG9uIGRhdGEuXG4gICAqL1xuICBwdWJsaWMgZGVzZXJpYWxpemUoIGRhdGE6IFNlcmlhbGl6ZWRBdXRvbWF0b24gKTogdm9pZCB7XG4gICAgdGhpcy5fX3Jlc29sdXRpb24gPSBkYXRhLnJlc29sdXRpb247XG5cbiAgICB0aGlzLl9fY3VydmVzID0gZGF0YS5jdXJ2ZXMubWFwKCAoIGRhdGEgKSA9PiBuZXcgQ3VydmUoIHRoaXMsIGRhdGEgKSApO1xuXG4gICAgZm9yICggY29uc3QgbmFtZSBpbiBkYXRhLmNoYW5uZWxzICkge1xuICAgICAgdGhpcy5fX2NoYW5uZWxzWyBuYW1lIF0gPSBuZXcgQ2hhbm5lbCggdGhpcywgZGF0YS5jaGFubmVsc1sgbmFtZSBdICk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBmeCBkZWZpbml0aW9ucy5cbiAgICogQHBhcmFtIGZ4RGVmaW5pdGlvbnMgQSBtYXAgb2YgaWQgLSBmeCBkZWZpbml0aW9uXG4gICAqL1xuICBwdWJsaWMgYWRkRnhEZWZpbml0aW9ucyggZnhEZWZpbml0aW9uczogeyBbIGlkOiBzdHJpbmcgXTogRnhEZWZpbml0aW9uIH0gKTogdm9pZCB7XG4gICAgT2JqZWN0LmVudHJpZXMoIGZ4RGVmaW5pdGlvbnMgKS5mb3JFYWNoKCAoIFsgaWQsIGZ4RGVmIF0gKSA9PiB7XG4gICAgICBpZiAoIHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAnZGV2ZWxvcG1lbnQnICkge1xuICAgICAgICBpZiAoIHRoaXMuX19meERlZmluaXRpb25zWyBpZCBdICE9IG51bGwgKSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKCBgT3ZlcndyaXRpbmcgdGhlIGV4aXN0aW5nIGZ4IGRlZmluaXRpb246ICR7IGlkIH1gICk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhpcy5fX2Z4RGVmaW5pdGlvbnNbIGlkIF0gPSBmeERlZjtcbiAgICB9ICk7XG5cbiAgICB0aGlzLnByZWNhbGNBbGwoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBmeCBkZWZpbml0aW9uLlxuICAgKiBJZiBpdCBjYW4ndCBmaW5kIHRoZSBkZWZpbml0aW9uLCBpdCByZXR1cm5zIGBudWxsYCBpbnN0ZWFkLlxuICAgKiBAcGFyYW0gaWQgVW5pcXVlIGlkIGZvciB0aGUgRnggZGVmaW5pdGlvblxuICAgKi9cbiAgcHVibGljIGdldEZ4RGVmaW5pdGlvbiggaWQ6IHN0cmluZyApOiBGeERlZmluaXRpb24gfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fX2Z4RGVmaW5pdGlvbnNbIGlkIF0gfHwgbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBjdXJ2ZS5cbiAgICogQHBhcmFtIGluZGV4IEFuIGluZGV4IG9mIHRoZSBjdXJ2ZVxuICAgKi9cbiAgcHVibGljIGdldEN1cnZlKCBpbmRleDogbnVtYmVyICk6IEN1cnZlIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuX19jdXJ2ZXNbIGluZGV4IF0gfHwgbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmVjYWxjdWxhdGUgYWxsIGN1cnZlcy5cbiAgICovXG4gIHB1YmxpYyBwcmVjYWxjQWxsKCk6IHZvaWQge1xuICAgIE9iamVjdC52YWx1ZXMoIHRoaXMuX19jdXJ2ZXMgKS5mb3JFYWNoKCAoIGN1cnZlICkgPT4gY3VydmUucHJlY2FsYygpICk7XG4gIH1cblxuICAvKipcbiAgICogUmVzZXQgdGhlIGludGVybmFsIHN0YXRlcyBvZiBjaGFubmVscy5cbiAgICogKipDYWxsIHRoaXMgbWV0aG9kIHdoZW4geW91IHNlZWsgdGhlIHRpbWUuKipcbiAgICovXG4gIHB1YmxpYyByZXNldCgpOiB2b2lkIHtcbiAgICBPYmplY3QudmFsdWVzKCB0aGlzLl9fY2hhbm5lbHMgKS5mb3JFYWNoKCAoIGNoYW5uZWwgKSA9PiBjaGFubmVsLnJlc2V0KCkgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIGVudGlyZSBhdXRvbWF0b24uXG4gICAqICoqWW91IG1heSB3YW50IHRvIGNhbGwgdGhpcyBpbiB5b3VyIHVwZGF0ZSBsb29wLioqXG4gICAqIEBwYXJhbSB0aW1lIEN1cnJlbnQgdGltZVxuICAgKi9cbiAgcHVibGljIHVwZGF0ZSggdGltZTogbnVtYmVyICk6IHZvaWQge1xuICAgIGNvbnN0IHQgPSBNYXRoLm1heCggdGltZSwgMC4wICk7XG5cbiAgICAvLyBjYWNoZSB0aGUgdGltZVxuICAgIHRoaXMuX190aW1lID0gdDtcblxuICAgIC8vIGdyYWIgdGhlIGN1cnJlbnQgdmFsdWUgZm9yIGVhY2ggY2hhbm5lbHNcbiAgICBmb3IgKCBjb25zdCBjaGFubmVsIG9mIE9iamVjdC52YWx1ZXMoIHRoaXMuX19jaGFubmVscyApICkge1xuICAgICAgY2hhbm5lbC51cGRhdGUoIHRoaXMuX190aW1lICk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFzc2lnbmVkIHRvIHtAbGluayBBdXRvbWF0b24jYXV0b30gb24gaXRzIGluaXRpYWxpemUgcGhhc2UuXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBjaGFubmVsXG4gICAqIEBwYXJhbSBsaXN0ZW5lciBBIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBleGVjdXRlZCB3aGVuIHRoZSBjaGFubmVsIGNoYW5nZXMgaXRzIHZhbHVlXG4gICAqIEByZXR1cm5zIEN1cnJlbnQgdmFsdWUgb2YgdGhlIGNoYW5uZWxcbiAgICovXG4gIHByb3RlY3RlZCBfX2F1dG8oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGxpc3RlbmVyPzogKCBldmVudDogQ2hhbm5lbFVwZGF0ZUV2ZW50ICkgPT4gdm9pZFxuICApOiBudW1iZXIge1xuICAgIGlmICggbGlzdGVuZXIgKSB7XG4gICAgICB0aGlzLl9fY2hhbm5lbHNbIG5hbWUgXS5zdWJzY3JpYmUoIGxpc3RlbmVyICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX19jaGFubmVsc1sgbmFtZSBdLmN1cnJlbnRWYWx1ZTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0lBR0E7OztVQUdhLFdBQVc7Ozs7OztRQTZEdEIsWUFBb0IsU0FBb0IsRUFBRSxJQUEyQjtZQUNuRSxJQUFJLENBQUMsV0FBVyxHQUFHLFNBQVMsQ0FBQztZQUU3QixJQUFJLENBQUMsV0FBVyxDQUFFLElBQUksQ0FBRSxDQUFDO1NBQzFCOzs7O1FBYkQsSUFBVyxHQUFHO1lBQ1osT0FBTyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7U0FDaEM7UUFhTSxRQUFRLENBQUUsSUFBWTtZQUMzQixJQUFLLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLE1B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
