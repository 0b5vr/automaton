/*!
* @fms-cat/automaton v4.1.0
* Animation engine for creative coding
*
* Copyright (c) 2017-2020 FMS_Cat
* @fms-cat/automaton is distributed under MIT License
* https://github.com/FMS-Cat/automaton/blob/master/LICENSE
*/
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

export { Automaton, Channel, ChannelItem, Curve };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b21hdG9uLm1vZHVsZS5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL0NoYW5uZWxJdGVtLnRzIiwiLi4vc3JjL0NoYW5uZWwudHMiLCIuLi9zcmMvdXRpbHMvYmV6aWVyRWFzaW5nLnRzIiwiLi4vc3JjL0N1cnZlLnRzIiwiLi4vc3JjL0F1dG9tYXRvbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBdXRvbWF0b24sIEN1cnZlIH0gZnJvbSAnLic7XG5pbXBvcnQgdHlwZSB7IFNlcmlhbGl6ZWRDaGFubmVsSXRlbSB9IGZyb20gJy4vdHlwZXMvU2VyaWFsaXplZENoYW5uZWxJdGVtJztcblxuLyoqXG4gKiBSZXByZXNlbnRzIGFuIGl0ZW0gb2YgYSBbW0NoYW5uZWxdXS5cbiAqL1xuZXhwb3J0IGNsYXNzIENoYW5uZWxJdGVtIHtcbiAgLyoqXG4gICAqIFRoZSBwYXJlbnQgYXV0b21hdG9uLlxuICAgKi9cbiAgcHJvdGVjdGVkIHJlYWRvbmx5IF9fYXV0b21hdG9uOiBBdXRvbWF0b247XG5cbiAgLyoqXG4gICAqIEJlZ2lubmluZyB0aW1lcG9pbnQgb2YgdGhlIGl0ZW0uXG4gICAqL1xuICBwdWJsaWMgdGltZSE6IG51bWJlcjtcblxuICAvKipcbiAgICogTGVuZ3RoIG9mIHRoZSBpdGVtLlxuICAgKi9cbiAgcHVibGljIGxlbmd0aCE6IG51bWJlcjtcblxuICAvKipcbiAgICogVmFsdWUgb2YgdGhlIGl0ZW0uXG4gICAqL1xuICBwdWJsaWMgdmFsdWUhOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgcmVzZXQgY2hhbm5lbHMgdmFsdWUgdG8gemVybyBhdCB0aGUgZW5kIG9mIHRoaXMgaXRlbSBvciBub3QuXG4gICAqL1xuICBwdWJsaWMgcmVzZXQ/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBUaGlzIHdpbGwgb25seSBtYWtlIHNlbnNlIHdoZW4ge0BsaW5rIGN1cnZlfSBpcyBzcGVjaWZpZWQuXG4gICAqIFRoZSB0aW1lIG9mZnNldCBvZiB0aGUgaXRlbS5cbiAgICovXG4gIHB1YmxpYyBvZmZzZXQhOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoaXMgd2lsbCBvbmx5IG1ha2Ugc2Vuc2Ugd2hlbiB7QGxpbmsgY3VydmV9IGlzIHNwZWNpZmllZC5cbiAgICogVGhlIHNwZWVkIHJhdGUgb2YgdGhlIGl0ZW0uXG4gICAqL1xuICBwdWJsaWMgc3BlZWQhOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoaXMgd2lsbCBvbmx5IG1ha2Ugc2Vuc2Ugd2hlbiB7QGxpbmsgY3VydmV9IGlzIHNwZWNpZmllZC5cbiAgICogVGhlIHNjYWxlIG9mIHRoZSBpdGVtIGluIHRoZSB2YWx1ZSBheGlzLlxuICAgKi9cbiAgcHVibGljIGFtcCE6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIGN1cnZlIG9mIHRoZSBpdGVtLlxuICAgKi9cbiAgcHVibGljIGN1cnZlPzogQ3VydmU7XG5cbiAgLyoqXG4gICAqIEVuZGluZyB0aW1lcG9pbnQgb2YgdGhlIGl0ZW0uXG4gICAqL1xuICBwdWJsaWMgZ2V0IGVuZCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLnRpbWUgKyB0aGlzLmxlbmd0aDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RvciBvZiB0aGUgW1tDaGFubmVsSXRlbV1dLlxuICAgKiBAcGFyYW0gYXV0b21hdG9uIFBhcmVudCBhdXRvbWF0b25cbiAgICogQHBhcmFtIGRhdGEgRGF0YSBvZiB0aGUgaXRlbVxuICAgKi9cbiAgcHVibGljIGNvbnN0cnVjdG9yKCBhdXRvbWF0b246IEF1dG9tYXRvbiwgZGF0YTogU2VyaWFsaXplZENoYW5uZWxJdGVtICkge1xuICAgIHRoaXMuX19hdXRvbWF0b24gPSBhdXRvbWF0b247XG5cbiAgICB0aGlzLmRlc2VyaWFsaXplKCBkYXRhICk7XG4gIH1cblxuICBwdWJsaWMgZ2V0VmFsdWUoIHRpbWU6IG51bWJlciApOiBudW1iZXIge1xuICAgIGlmICggdGhpcy5yZXNldCAmJiB0aGlzLmxlbmd0aCA8PSB0aW1lICkge1xuICAgICAgcmV0dXJuIDAuMDtcbiAgICB9XG5cbiAgICBpZiAoIHRoaXMuY3VydmUgKSB7XG4gICAgICBjb25zdCB0ID0gdGhpcy5vZmZzZXQhICsgdGltZSAqIHRoaXMuc3BlZWQhO1xuICAgICAgcmV0dXJuIHRoaXMudmFsdWUgKyB0aGlzLmFtcCAqIHRoaXMuY3VydmUuZ2V0VmFsdWUoIHQgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMudmFsdWU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERlc2VyaWFsaXplIGEgc2VyaWFsaXplZCBkYXRhIG9mIGl0ZW0gZnJvbSBbW1NlcmlhbGl6ZWRDaGFubmVsSXRlbV1dLlxuICAgKiBAcGFyYW0gZGF0YSBBIHNlcmlhbGl6ZWQgaXRlbS5cbiAgICovXG4gIHB1YmxpYyBkZXNlcmlhbGl6ZSggZGF0YTogU2VyaWFsaXplZENoYW5uZWxJdGVtICk6IHZvaWQge1xuICAgIHRoaXMudGltZSA9IGRhdGEudGltZSA/PyAwLjA7XG4gICAgdGhpcy5sZW5ndGggPSBkYXRhLmxlbmd0aCA/PyAwLjA7XG4gICAgdGhpcy52YWx1ZSA9IGRhdGEudmFsdWUgPz8gMC4wO1xuICAgIHRoaXMub2Zmc2V0ID0gZGF0YS5vZmZzZXQgPz8gMC4wO1xuICAgIHRoaXMuc3BlZWQgPSBkYXRhLnNwZWVkID8/IDEuMDtcbiAgICB0aGlzLmFtcCA9IGRhdGEuYW1wID8/IDEuMDtcbiAgICB0aGlzLnJlc2V0ID0gZGF0YS5yZXNldDtcbiAgICBpZiAoIGRhdGEuY3VydmUgIT0gbnVsbCApIHtcbiAgICAgIHRoaXMuY3VydmUgPSB0aGlzLl9fYXV0b21hdG9uLmdldEN1cnZlKCBkYXRhLmN1cnZlICkhO1xuICAgICAgdGhpcy5sZW5ndGggPSBkYXRhLmxlbmd0aCA/PyB0aGlzLmN1cnZlLmxlbmd0aCA/PyAwLjA7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBBdXRvbWF0b24gfSBmcm9tICcuL0F1dG9tYXRvbic7XG5pbXBvcnQgeyBDaGFubmVsSXRlbSB9IGZyb20gJy4vQ2hhbm5lbEl0ZW0nO1xuaW1wb3J0IHR5cGUgeyBDaGFubmVsVXBkYXRlRXZlbnQgfSBmcm9tICcuL3R5cGVzL0NoYW5uZWxVcGRhdGVFdmVudCc7XG5pbXBvcnQgdHlwZSB7IFNlcmlhbGl6ZWRDaGFubmVsIH0gZnJvbSAnLi90eXBlcy9TZXJpYWxpemVkQ2hhbm5lbCc7XG5cbi8qKlxuICogSXQgcmVwcmVzZW50cyBhIGNoYW5uZWwgb2YgQXV0b21hdG9uLlxuICovXG5leHBvcnQgY2xhc3MgQ2hhbm5lbCB7XG4gIC8qKlxuICAgKiBUaGUgcGFyZW50IGF1dG9tYXRvbi5cbiAgICovXG4gIHByb3RlY3RlZCBfX2F1dG9tYXRvbjogQXV0b21hdG9uO1xuXG4gIC8qKlxuICAgKiBMaXN0IG9mIGNoYW5uZWwgaXRlbXMuXG4gICAqL1xuICBwcm90ZWN0ZWQgX19pdGVtczogQ2hhbm5lbEl0ZW1bXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBBIGNhY2hlIG9mIGxhc3QgY2FsY3VsYXRlZCB2YWx1ZS5cbiAgICovXG4gIHByb3RlY3RlZCBfX3ZhbHVlOiBudW1iZXIgPSAwLjA7XG5cbiAgLyoqXG4gICAqIFRoZSB0aW1lIHRoYXQgd2FzIHVzZWQgZm9yIHRoZSBjYWxjdWxhdGlvbiBvZiBbW19fbGFzdFZhbHVlXV0uXG4gICAqL1xuICBwcm90ZWN0ZWQgX190aW1lOiBudW1iZXIgPSAtSW5maW5pdHk7XG5cbiAgLyoqXG4gICAqIFRoZSBpbmRleCBvZiBbW19faXRlbXNdXSBpdCBzaG91bGQgZXZhbHVhdGUgbmV4dC5cbiAgICovXG4gIHByb3RlY3RlZCBfX2hlYWQ6IG51bWJlciA9IDA7XG5cbiAgLyoqXG4gICAqIEFuIGFycmF5IG9mIGxpc3RlbmVycy5cbiAgICovXG4gIHByb3RlY3RlZCBfX2xpc3RlbmVyczogQXJyYXk8KCBldmVudDogQ2hhbm5lbFVwZGF0ZUV2ZW50ICkgPT4gdm9pZD4gPSBbXTtcblxuICAvKipcbiAgICogQ29uc3RydWN0b3Igb2YgdGhlIFtbQ2hhbm5lbF1dLlxuICAgKiBAcGFyYW0gYXV0b21hdG9uIFBhcmVudCBhdXRvbWF0b25cbiAgICogQHBhcmFtIGRhdGEgRGF0YSBvZiB0aGUgY2hhbm5lbFxuICAgKi9cbiAgcHVibGljIGNvbnN0cnVjdG9yKCBhdXRvbWF0b246IEF1dG9tYXRvbiwgZGF0YTogU2VyaWFsaXplZENoYW5uZWwgKSB7XG4gICAgdGhpcy5fX2F1dG9tYXRvbiA9IGF1dG9tYXRvbjtcblxuICAgIHRoaXMuZGVzZXJpYWxpemUoIGRhdGEgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIGNhY2hlIG9mIGxhc3QgY2FsY3VsYXRlZCB2YWx1ZS5cbiAgICovXG4gIHB1YmxpYyBnZXQgY3VycmVudFZhbHVlKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9fdmFsdWU7IH1cblxuICAvKipcbiAgICogVGhlIHRpbWUgdGhhdCB3YXMgdXNlZCBmb3IgdGhlIGNhbGN1bGF0aW9uIG9mIFtbX19sYXN0VmFsdWVdXS5cbiAgICovXG4gIHB1YmxpYyBnZXQgY3VycmVudFRpbWUoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX190aW1lOyB9XG5cbiAgLyoqXG4gICAqIExvYWQgYSBzZXJpYWxpemVkIGRhdGEgb2YgYSBjaGFubmVsLlxuICAgKiBAcGFyYW0gZGF0YSBEYXRhIG9mIGEgY2hhbm5lbFxuICAgKi9cbiAgcHVibGljIGRlc2VyaWFsaXplKCBkYXRhOiBTZXJpYWxpemVkQ2hhbm5lbCApOiB2b2lkIHtcbiAgICB0aGlzLl9faXRlbXMgPSBkYXRhLml0ZW1zPy5tYXAoICggaXRlbSApID0+IG5ldyBDaGFubmVsSXRlbSggdGhpcy5fX2F1dG9tYXRvbiwgaXRlbSApICkgPz8gW107XG4gIH1cblxuICAvKipcbiAgICogUmVzZXQgdGhlIGludGVybmFsIHN0YXRlcy5cbiAgICogQ2FsbCB0aGlzIG1ldGhvZCB3aGVuIHlvdSBzZWVrIHRoZSB0aW1lLlxuICAgKi9cbiAgcHVibGljIHJlc2V0KCk6IHZvaWQge1xuICAgIHRoaXMuX190aW1lID0gLUluZmluaXR5O1xuICAgIHRoaXMuX192YWx1ZSA9IDA7XG4gICAgdGhpcy5fX2hlYWQgPSAwO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIG5ldyBsaXN0ZW5lciB0aGF0IHJlY2VpdmVzIGEgW1tDaGFubmVsVXBkYXRlRXZlbnRdXSB3aGVuIGFuIHVwZGF0ZSBpcyBoYXBwZW5lZC5cbiAgICogQHBhcmFtIGxpc3RlbmVyIEEgc3Vic2NyaWJpbmcgbGlzdGVuZXJcbiAgICovXG4gIHB1YmxpYyBzdWJzY3JpYmUoIGxpc3RlbmVyOiAoIGV2ZW50OiBDaGFubmVsVXBkYXRlRXZlbnQgKSA9PiB2b2lkICk6IHZvaWQge1xuICAgIHRoaXMuX19saXN0ZW5lcnMucHVzaCggbGlzdGVuZXIgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIHZhbHVlIG9mIHNwZWNpZmllZCB0aW1lIHBvaW50LlxuICAgKiBAcGFyYW0gdGltZSBUaW1lIGF0IHRoZSBwb2ludCB5b3Ugd2FudCB0byBncmFiIHRoZSB2YWx1ZS5cbiAgICogQHJldHVybnMgUmVzdWx0IHZhbHVlXG4gICAqL1xuICBwdWJsaWMgZ2V0VmFsdWUoIHRpbWU6IG51bWJlciApOiBudW1iZXIge1xuICAgIGxldCBuZXh0ID0gdGhpcy5fX2l0ZW1zLmZpbmRJbmRleCggKCBpdGVtICkgPT4gKCB0aW1lIDwgaXRlbS50aW1lICkgKTtcblxuICAgIC8vIGl0J3MgdGhlIGZpcnN0IG9uZSFcbiAgICBpZiAoIG5leHQgPT09IDAgKSB7XG4gICAgICByZXR1cm4gMC4wO1xuICAgIH1cblxuICAgIC8vIGl0J3MgdGhlIGxhc3Qgb25lIVxuICAgIGlmICggbmV4dCA9PT0gLTEgKSB7XG4gICAgICBuZXh0ID0gdGhpcy5fX2l0ZW1zLmxlbmd0aDtcbiAgICB9XG5cbiAgICBjb25zdCBpdGVtID0gdGhpcy5fX2l0ZW1zWyBuZXh0IC0gMSBdO1xuICAgIGlmICggaXRlbS5lbmQgPCB0aW1lICkge1xuICAgICAgcmV0dXJuIGl0ZW0uZ2V0VmFsdWUoIGl0ZW0ubGVuZ3RoICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBpdGVtLmdldFZhbHVlKCB0aW1lIC0gaXRlbS50aW1lICk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgbWV0aG9kIGlzIGludGVuZGVkIHRvIGJlIHVzZWQgYnkgW1tBdXRvbWF0b24udXBkYXRlXV0uXG4gICAqIENvbnN1bWUgYW5kIHJldHVybiBpdGVtcy5cbiAgICogQHBhcmFtIHRpbWUgVGhlIGN1cnJlbnQgdGltZSBvZiB0aGUgcGFyZW50IFtbQXV0b21hdG9uXV1cbiAgICogQHJldHVybnMgQXJyYXkgb2YgdHVwbGVzLCBbIHRpbWluZyBvZiB0aGUgZXZlbnQsIGEgZnVuY3Rpb24gdGhhdCBleGVjdXRlIHRoZSBldmVudCBdXG4gICAqL1xuICBwdWJsaWMgY29uc3VtZSggdGltZTogbnVtYmVyICk6IFsgdGltZTogbnVtYmVyLCB1cGRhdGU6ICgpID0+IHZvaWQgXVtdIHtcbiAgICBjb25zdCByZXQ6IFsgbnVtYmVyLCAoKSA9PiB2b2lkIF1bXSA9IFtdO1xuXG4gICAgY29uc3QgcHJldlRpbWUgPSB0aGlzLl9fdGltZTtcblxuICAgIGZvciAoIGxldCBpID0gdGhpcy5fX2hlYWQ7IGkgPCB0aGlzLl9faXRlbXMubGVuZ3RoOyBpICsrICkge1xuICAgICAgY29uc3QgaXRlbSA9IHRoaXMuX19pdGVtc1sgaSBdO1xuICAgICAgY29uc3QgeyB0aW1lOiBiZWdpbiwgZW5kLCBsZW5ndGggfSA9IGl0ZW07XG4gICAgICBsZXQgZWxhcHNlZCA9IHRpbWUgLSBiZWdpbjtcblxuICAgICAgaWYgKCBlbGFwc2VkIDwgMC4wICkge1xuICAgICAgICBicmVhaztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBwcm9ncmVzczogbnVtYmVyO1xuICAgICAgICBsZXQgaW5pdDogdHJ1ZSB8IHVuZGVmaW5lZDtcbiAgICAgICAgbGV0IHVuaW5pdDogdHJ1ZSB8IHVuZGVmaW5lZDtcblxuICAgICAgICBpZiAoIGxlbmd0aCA8PSBlbGFwc2VkICkge1xuICAgICAgICAgIGVsYXBzZWQgPSBsZW5ndGg7XG4gICAgICAgICAgcHJvZ3Jlc3MgPSAxLjA7XG4gICAgICAgICAgdW5pbml0ID0gdHJ1ZTtcblxuICAgICAgICAgIGlmICggaSA9PT0gdGhpcy5fX2hlYWQgKSB7XG4gICAgICAgICAgICB0aGlzLl9faGVhZCArKztcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcHJvZ3Jlc3MgPSBsZW5ndGggIT09IDAuMFxuICAgICAgICAgICAgPyBlbGFwc2VkIC8gbGVuZ3RoXG4gICAgICAgICAgICA6IDEuMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggcHJldlRpbWUgPCBiZWdpbiApIHtcbiAgICAgICAgICBpbml0ID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldC5wdXNoKCBbIGJlZ2luICsgZWxhcHNlZCwgKCkgPT4ge1xuICAgICAgICAgIHRoaXMuX192YWx1ZSA9IGl0ZW0uZ2V0VmFsdWUoIGVsYXBzZWQgKTtcblxuICAgICAgICAgIHRoaXMuX19saXN0ZW5lcnMuZm9yRWFjaCggKCBsaXN0ZW5lciApID0+IGxpc3RlbmVyKCB7XG4gICAgICAgICAgICB0aW1lLFxuICAgICAgICAgICAgZWxhcHNlZCxcbiAgICAgICAgICAgIGJlZ2luLFxuICAgICAgICAgICAgZW5kLFxuICAgICAgICAgICAgbGVuZ3RoLFxuICAgICAgICAgICAgdmFsdWU6IHRoaXMuX192YWx1ZSxcbiAgICAgICAgICAgIHByb2dyZXNzLFxuICAgICAgICAgICAgaW5pdCxcbiAgICAgICAgICAgIHVuaW5pdCxcbiAgICAgICAgICB9ICkgKTtcbiAgICAgICAgfSBdICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fX3RpbWUgPSB0aW1lO1xuXG4gICAgcmV0dXJuIHJldDtcbiAgfVxufVxuIiwiaW1wb3J0IHR5cGUgeyBCZXppZXJOb2RlIH0gZnJvbSAnLi4vdHlwZXMvQmV6aWVyTm9kZSc7XG5cbmludGVyZmFjZSBDdWJpY0JlemllckNvbnRyb2xQb2ludHMge1xuICBwMDogbnVtYmVyO1xuICBwMTogbnVtYmVyO1xuICBwMjogbnVtYmVyO1xuICBwMzogbnVtYmVyO1xufVxuXG5jb25zdCBORVdUT05fSVRFUiA9IDQ7XG5jb25zdCBORVdUT05fRVBTSUxPTiA9IDAuMDAxO1xuY29uc3QgU1VCRElWX0lURVIgPSAxMDtcbmNvbnN0IFNVQkRJVl9FUFNJTE9OID0gMC4wMDAwMDE7XG5jb25zdCBUQUJMRV9TSVpFID0gMjE7XG5cbmNvbnN0IF9fY2FjaGU6IG51bWJlcltdID0gW107XG5cbmZ1bmN0aW9uIGNsYW1wKCB4OiBudW1iZXIsIG1pbjogbnVtYmVyLCBtYXg6IG51bWJlciApOiBudW1iZXIge1xuICByZXR1cm4gTWF0aC5taW4oIE1hdGgubWF4KCB4LCBtaW4gKSwgbWF4ICk7XG59XG5cbi8qXG4gKiAoMS10KSgxLXQpKDEtdCkgYTAgPSAoMS0ydCt0dCkoMS10KSBhMFxuICogICAgICAgICAgICAgICAgICAgID0gKDEtdC0ydCsydHQrdHQtdHR0KSBhMFxuICogICAgICAgICAgICAgICAgICAgID0gKDEtM3QrM3R0LXR0dCkgYTBcbiAqXG4gKiAzKDEtdCkoMS10KXQgYTEgPSAzKDEtMnQrdHQpdCBhMVxuICogICAgICAgICAgICAgICAgID0gKDN0LTZ0dCszdHR0KSBhMVxuICpcbiAqIDMoMS10KXR0IGEyID0gKDN0dC0zdHR0KSBhMlxuICpcbiAqIHR0dCBhM1xuICpcbiAqIChhMy0zYTIrM2ExLWEwKSB0dHQgKyAoM2EyLTZhMSszYTApIHR0ICsgKDNhMS0zYTApIHQgKyBhMFxuICovXG5cbmZ1bmN0aW9uIEEoIGNwczogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzICk6IG51bWJlciB7XG4gIHJldHVybiBjcHMucDMgLSAzLjAgKiBjcHMucDIgKyAzLjAgKiBjcHMucDEgLSBjcHMucDA7XG59XG5cbmZ1bmN0aW9uIEIoIGNwczogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzICk6IG51bWJlciB7XG4gIHJldHVybiAzLjAgKiBjcHMucDIgLSA2LjAgKiBjcHMucDEgKyAzLjAgKiBjcHMucDA7XG59XG5cbmZ1bmN0aW9uIEMoIGNwczogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzICk6IG51bWJlciB7XG4gIHJldHVybiAzLjAgKiBjcHMucDEgLSAzLjAgKiBjcHMucDA7XG59XG5cbmZ1bmN0aW9uIGN1YmljQmV6aWVyKCB0OiBudW1iZXIsIGNwczogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzICk6IG51bWJlciB7XG4gIHJldHVybiAoICggQSggY3BzICkgKiB0ICsgQiggY3BzICkgKSAqIHQgKyBDKCBjcHMgKSApICogdCArIGNwcy5wMDtcbn1cblxuZnVuY3Rpb24gZGVsdGFDdWJpY0JlemllciggdDogbnVtYmVyLCBjcHM6IEN1YmljQmV6aWVyQ29udHJvbFBvaW50cyApOiBudW1iZXIge1xuICByZXR1cm4gKCAzLjAgKiBBKCBjcHMgKSAqIHQgKyAyLjAgKiBCKCBjcHMgKSApICogdCArIEMoIGNwcyApO1xufVxuXG5mdW5jdGlvbiBzdWJkaXYoIHg6IG51bWJlciwgYTogbnVtYmVyLCBiOiBudW1iZXIsIGNwczogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzICk6IG51bWJlciB7XG4gIGxldCBjYW5kaWRhdGVYID0gMDtcbiAgbGV0IHQgPSAwO1xuXG4gIGZvciAoIGxldCBpID0gMDsgaSA8IFNVQkRJVl9JVEVSOyBpICsrICkge1xuICAgIHQgPSBhICsgKCBiIC0gYSApIC8gMi4wO1xuICAgIGNhbmRpZGF0ZVggPSBjdWJpY0JlemllciggdCwgY3BzICkgLSB4O1xuICAgICggMC4wIDwgY2FuZGlkYXRlWCApID8gKCBiID0gdCApIDogKCBhID0gdCApO1xuICAgIGlmICggU1VCRElWX0VQU0lMT04gPCBNYXRoLmFicyggY2FuZGlkYXRlWCApICkgeyBicmVhazsgfVxuICB9XG5cbiAgcmV0dXJuIHQ7XG59XG5cbmZ1bmN0aW9uIG5ld3RvbiggeDogbnVtYmVyLCB0OiBudW1iZXIsIGNwczogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzICk6IG51bWJlciB7XG4gIGZvciAoIGxldCBpID0gMDsgaSA8IE5FV1RPTl9JVEVSOyBpICsrICkge1xuICAgIGNvbnN0IGQgPSBkZWx0YUN1YmljQmV6aWVyKCB0LCBjcHMgKTtcbiAgICBpZiAoIGQgPT09IDAuMCApIHsgcmV0dXJuIHQ7IH1cbiAgICBjb25zdCBjeCA9IGN1YmljQmV6aWVyKCB0LCBjcHMgKSAtIHg7XG4gICAgdCAtPSBjeCAvIGQ7XG4gIH1cblxuICByZXR1cm4gdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJhd0JlemllckVhc2luZyhcbiAgY3BzeDogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzLFxuICBjcHN5OiBDdWJpY0JlemllckNvbnRyb2xQb2ludHMsXG4gIHg6IG51bWJlclxuKTogbnVtYmVyIHtcbiAgaWYgKCB4IDw9IGNwc3gucDAgKSB7IHJldHVybiBjcHN5LnAwOyB9IC8vIGNsYW1wZWRcbiAgaWYgKCBjcHN4LnAzIDw9IHggKSB7IHJldHVybiBjcHN5LnAzOyB9IC8vIGNsYW1wZWRcblxuICBjcHN4LnAxID0gY2xhbXAoIGNwc3gucDEsIGNwc3gucDAsIGNwc3gucDMgKTtcbiAgY3BzeC5wMiA9IGNsYW1wKCBjcHN4LnAyLCBjcHN4LnAwLCBjcHN4LnAzICk7XG5cbiAgZm9yICggbGV0IGkgPSAwOyBpIDwgVEFCTEVfU0laRTsgaSArKyApIHtcbiAgICBfX2NhY2hlWyBpIF0gPSBjdWJpY0JlemllciggaSAvICggVEFCTEVfU0laRSAtIDEuMCApLCBjcHN4ICk7XG4gIH1cblxuICBsZXQgc2FtcGxlID0gMDtcbiAgZm9yICggbGV0IGkgPSAxOyBpIDwgVEFCTEVfU0laRTsgaSArKyApIHtcbiAgICBzYW1wbGUgPSBpIC0gMTtcbiAgICBpZiAoIHggPCBfX2NhY2hlWyBpIF0gKSB7IGJyZWFrOyB9XG4gIH1cblxuICBjb25zdCBkaXN0ID0gKCB4IC0gX19jYWNoZVsgc2FtcGxlIF0gKSAvICggX19jYWNoZVsgc2FtcGxlICsgMSBdIC0gX19jYWNoZVsgc2FtcGxlIF0gKTtcbiAgbGV0IHQgPSAoIHNhbXBsZSArIGRpc3QgKSAvICggVEFCTEVfU0laRSAtIDEgKTtcbiAgY29uc3QgZCA9IGRlbHRhQ3ViaWNCZXppZXIoIHQsIGNwc3ggKSAvICggY3BzeC5wMyAtIGNwc3gucDAgKTtcblxuICBpZiAoIE5FV1RPTl9FUFNJTE9OIDw9IGQgKSB7XG4gICAgdCA9IG5ld3RvbiggeCwgdCwgY3BzeCApO1xuICB9IGVsc2UgaWYgKCBkICE9PSAwLjAgKSB7XG4gICAgdCA9IHN1YmRpdiggeCwgKCBzYW1wbGUgKSAvICggVEFCTEVfU0laRSAtIDEgKSwgKCBzYW1wbGUgKyAxLjAgKSAvICggVEFCTEVfU0laRSAtIDEgKSwgY3BzeCApO1xuICB9XG5cbiAgcmV0dXJuIGN1YmljQmV6aWVyKCB0LCBjcHN5ICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBiZXppZXJFYXNpbmcoIG5vZGUwOiBCZXppZXJOb2RlLCBub2RlMTogQmV6aWVyTm9kZSwgdGltZTogbnVtYmVyICk6IG51bWJlciB7XG4gIHJldHVybiByYXdCZXppZXJFYXNpbmcoXG4gICAge1xuICAgICAgcDA6IG5vZGUwLnRpbWUsXG4gICAgICBwMTogbm9kZTAudGltZSArIG5vZGUwLm91dFRpbWUsXG4gICAgICBwMjogbm9kZTEudGltZSArIG5vZGUxLmluVGltZSxcbiAgICAgIHAzOiBub2RlMS50aW1lXG4gICAgfSxcbiAgICB7XG4gICAgICBwMDogbm9kZTAudmFsdWUsXG4gICAgICBwMTogbm9kZTAudmFsdWUgKyBub2RlMC5vdXRWYWx1ZSxcbiAgICAgIHAyOiBub2RlMS52YWx1ZSArIG5vZGUxLmluVmFsdWUsXG4gICAgICBwMzogbm9kZTEudmFsdWVcbiAgICB9LFxuICAgIHRpbWVcbiAgKTtcbn1cbiIsImltcG9ydCB7IEF1dG9tYXRvbiB9IGZyb20gJy4vQXV0b21hdG9uJztcbmltcG9ydCB7IGJlemllckVhc2luZyB9IGZyb20gJy4vdXRpbHMvYmV6aWVyRWFzaW5nJztcbmltcG9ydCB0eXBlIHsgQmV6aWVyTm9kZSB9IGZyb20gJy4vdHlwZXMvQmV6aWVyTm9kZSc7XG5pbXBvcnQgdHlwZSB7IEZ4Q29udGV4dCB9IGZyb20gJy4vdHlwZXMvRnhDb250ZXh0JztcbmltcG9ydCB0eXBlIHsgRnhTZWN0aW9uIH0gZnJvbSAnLi90eXBlcy9GeFNlY3Rpb24nO1xuaW1wb3J0IHR5cGUgeyBTZXJpYWxpemVkQ3VydmUgfSBmcm9tICcuL3R5cGVzL1NlcmlhbGl6ZWRDdXJ2ZSc7XG5cbi8qKlxuICogSXQgcmVwcmVzZW50cyBhIGN1cnZlIG9mIEF1dG9tYXRvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIEN1cnZlIHtcbiAgLyoqXG4gICAqIFRoZSBwYXJlbnQgYXV0b21hdG9uLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fYXV0b21hdG9uOiBBdXRvbWF0b247XG5cbiAgLyoqXG4gICAqIEFuIGFycmF5IG9mIHByZWNhbGN1bGF0ZWQgdmFsdWUuXG4gICAqIEl0cyBsZW5ndGggaXMgc2FtZSBhcyBgY3VydmUuX19hdXRvbWF0b24ucmVzb2x1dGlvbiAqIGN1cnZlLl9fYXV0b21hdG9uLmxlbmd0aCArIDFgLlxuICAqL1xuICBwcm90ZWN0ZWQgX192YWx1ZXMhOiBGbG9hdDMyQXJyYXk7XG5cbiAgLyoqXG4gICAqIExpc3Qgb2YgYmV6aWVyIG5vZGUuXG4gICAqL1xuICBwcm90ZWN0ZWQgX19ub2RlczogQmV6aWVyTm9kZVtdID0gW107XG5cbiAgLyoqXG4gICAqIExpc3Qgb2YgZnggc2VjdGlvbnMuXG4gICAqL1xuICBwcm90ZWN0ZWQgX19meHM6IEZ4U2VjdGlvbltdID0gW107XG5cbiAgLyoqXG4gICAqIFRoZSBsZW5ndGggb2YgdGhpcyBjdXJ2ZS5cbiAgICovXG4gIHB1YmxpYyBnZXQgbGVuZ3RoKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX19ub2Rlc1sgdGhpcy5fX25vZGVzLmxlbmd0aCAtIDEgXS50aW1lO1xuICB9XG5cblxuICAvKipcbiAgICogQ29uc3RydWN0b3Igb2YgYSBbW0N1cnZlXV0uXG4gICAqIEBwYXJhbSBhdXRvbWF0b24gUGFyZW50IGF1dG9tYXRvblxuICAgKiBAcGFyYW0gZGF0YSBEYXRhIG9mIHRoZSBjdXJ2ZVxuICAgKi9cbiAgcHVibGljIGNvbnN0cnVjdG9yKCBhdXRvbWF0b246IEF1dG9tYXRvbiwgZGF0YTogU2VyaWFsaXplZEN1cnZlICkge1xuICAgIHRoaXMuX19hdXRvbWF0b24gPSBhdXRvbWF0b247XG5cbiAgICB0aGlzLmRlc2VyaWFsaXplKCBkYXRhICk7XG4gIH1cblxuICAvKipcbiAgICogTG9hZCBhIHNlcmlhbGl6ZWQgZGF0YSBvZiBhIGN1cnZlLlxuICAgKiBAcGFyYW0gZGF0YSBEYXRhIG9mIGEgY3VydmVcbiAgICovXG4gIHB1YmxpYyBkZXNlcmlhbGl6ZSggZGF0YTogU2VyaWFsaXplZEN1cnZlICk6IHZvaWQge1xuICAgIHRoaXMuX19ub2RlcyA9IGRhdGEubm9kZXMubWFwKCAoIG5vZGUgKSA9PiAoIHtcbiAgICAgIHRpbWU6IG5vZGVbIDAgXSA/PyAwLjAsXG4gICAgICB2YWx1ZTogbm9kZVsgMSBdID8/IDAuMCxcbiAgICAgIGluVGltZTogbm9kZVsgMiBdID8/IDAuMCxcbiAgICAgIGluVmFsdWU6IG5vZGVbIDMgXSA/PyAwLjAsXG4gICAgICBvdXRUaW1lOiBub2RlWyA0IF0gPz8gMC4wLFxuICAgICAgb3V0VmFsdWU6IG5vZGVbIDUgXSA/PyAwLjAsXG4gICAgfSApICk7XG5cbiAgICB0aGlzLl9fZnhzID0gW107XG4gICAgZGF0YS5meHM/LmZvckVhY2goICggZnggKSA9PiB7XG4gICAgICBpZiAoIGZ4LmJ5cGFzcyApIHsgcmV0dXJuOyB9XG4gICAgICB0aGlzLl9fZnhzLnB1c2goIHtcbiAgICAgICAgdGltZTogZngudGltZSA/PyAwLjAsXG4gICAgICAgIGxlbmd0aDogZngubGVuZ3RoID8/IDAuMCxcbiAgICAgICAgcm93OiBmeC5yb3cgPz8gMCxcbiAgICAgICAgZGVmOiBmeC5kZWYsXG4gICAgICAgIHBhcmFtczogZngucGFyYW1zXG4gICAgICB9ICk7XG4gICAgfSApO1xuXG4gICAgdGhpcy5wcmVjYWxjKCk7XG4gIH1cblxuICAvKipcbiAgICogUHJlY2FsY3VsYXRlIHZhbHVlIG9mIHNhbXBsZXMuXG4gICAqL1xuICBwdWJsaWMgcHJlY2FsYygpOiB2b2lkIHtcbiAgICB0aGlzLl9fdmFsdWVzID0gbmV3IEZsb2F0MzJBcnJheShcbiAgICAgIE1hdGguY2VpbCggdGhpcy5fX2F1dG9tYXRvbi5yZXNvbHV0aW9uICogdGhpcy5sZW5ndGggKSArIDFcbiAgICApO1xuXG4gICAgdGhpcy5fX2dlbmVyYXRlQ3VydmUoKTtcbiAgICB0aGlzLl9fYXBwbHlGeHMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIHZhbHVlIG9mIHNwZWNpZmllZCB0aW1lIHBvaW50LlxuICAgKiBAcGFyYW0gdGltZSBUaW1lIGF0IHRoZSBwb2ludCB5b3Ugd2FudCB0byBncmFiIHRoZSB2YWx1ZS5cbiAgICogQHJldHVybnMgUmVzdWx0IHZhbHVlXG4gICAqL1xuICBwdWJsaWMgZ2V0VmFsdWUoIHRpbWU6IG51bWJlciApOiBudW1iZXIge1xuICAgIGlmICggdGltZSA8IDAuMCApIHtcbiAgICAgIC8vIGNsYW1wIGxlZnRcbiAgICAgIHJldHVybiB0aGlzLl9fdmFsdWVzWyAwIF07XG5cbiAgICB9IGVsc2UgaWYgKCB0aGlzLmxlbmd0aCA8PSB0aW1lICkge1xuICAgICAgLy8gY2xhbXAgcmlnaHRcbiAgICAgIHJldHVybiB0aGlzLl9fdmFsdWVzWyB0aGlzLl9fdmFsdWVzLmxlbmd0aCAtIDEgXTtcblxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBmZXRjaCB0d28gdmFsdWVzIHRoZW4gZG8gdGhlIGxpbmVhciBpbnRlcnBvbGF0aW9uXG4gICAgICBjb25zdCBpbmRleCA9IHRpbWUgKiB0aGlzLl9fYXV0b21hdG9uLnJlc29sdXRpb247XG4gICAgICBjb25zdCBpbmRleGkgPSBNYXRoLmZsb29yKCBpbmRleCApO1xuICAgICAgY29uc3QgaW5kZXhmID0gaW5kZXggJSAxLjA7XG5cbiAgICAgIGNvbnN0IHYwID0gdGhpcy5fX3ZhbHVlc1sgaW5kZXhpIF07XG4gICAgICBjb25zdCB2MSA9IHRoaXMuX192YWx1ZXNbIGluZGV4aSArIDEgXTtcblxuICAgICAgY29uc3QgdiA9IHYwICsgKCB2MSAtIHYwICkgKiBpbmRleGY7XG5cbiAgICAgIHJldHVybiB2O1xuXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBmaXJzdCBzdGVwIG9mIHtAbGluayBwcmVjYWxjfTogZ2VuZXJhdGUgYSBjdXJ2ZSBvdXQgb2Ygbm9kZXMuXG4gICAqL1xuICBwcm90ZWN0ZWQgX19nZW5lcmF0ZUN1cnZlKCk6IHZvaWQge1xuICAgIGxldCBub2RlVGFpbCA9IHRoaXMuX19ub2Rlc1sgMCBdO1xuICAgIGxldCBpVGFpbCA9IDA7XG4gICAgZm9yICggbGV0IGlOb2RlID0gMDsgaU5vZGUgPCB0aGlzLl9fbm9kZXMubGVuZ3RoIC0gMTsgaU5vZGUgKysgKSB7XG4gICAgICBjb25zdCBub2RlMCA9IG5vZGVUYWlsO1xuICAgICAgbm9kZVRhaWwgPSB0aGlzLl9fbm9kZXNbIGlOb2RlICsgMSBdO1xuICAgICAgY29uc3QgaTAgPSBpVGFpbDtcbiAgICAgIGlUYWlsID0gTWF0aC5mbG9vciggbm9kZVRhaWwudGltZSAqIHRoaXMuX19hdXRvbWF0b24ucmVzb2x1dGlvbiApO1xuXG4gICAgICB0aGlzLl9fdmFsdWVzWyBpMCBdID0gbm9kZTAudmFsdWU7XG4gICAgICBmb3IgKCBsZXQgaSA9IGkwICsgMTsgaSA8PSBpVGFpbDsgaSArKyApIHtcbiAgICAgICAgY29uc3QgdGltZSA9IGkgLyB0aGlzLl9fYXV0b21hdG9uLnJlc29sdXRpb247XG4gICAgICAgIGNvbnN0IHZhbHVlID0gYmV6aWVyRWFzaW5nKCBub2RlMCwgbm9kZVRhaWwsIHRpbWUgKTtcbiAgICAgICAgdGhpcy5fX3ZhbHVlc1sgaSBdID0gdmFsdWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yICggbGV0IGkgPSBpVGFpbCArIDE7IGkgPCB0aGlzLl9fdmFsdWVzLmxlbmd0aDsgaSArKyApIHtcbiAgICAgIHRoaXMuX192YWx1ZXNbIGkgXSA9IG5vZGVUYWlsLnZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgc2Vjb25kIHN0ZXAgb2Yge0BsaW5rIHByZWNhbGN9OiBhcHBseSBmeHMgdG8gdGhlIGdlbmVyYXRlZCBjdXJ2ZXMuXG4gICAqL1xuICBwcm90ZWN0ZWQgX19hcHBseUZ4cygpOiB2b2lkIHtcbiAgICBmb3IgKCBsZXQgaUZ4ID0gMDsgaUZ4IDwgdGhpcy5fX2Z4cy5sZW5ndGg7IGlGeCArKyApIHtcbiAgICAgIGNvbnN0IGZ4ID0gdGhpcy5fX2Z4c1sgaUZ4IF07XG4gICAgICBjb25zdCBmeERlZiA9IHRoaXMuX19hdXRvbWF0b24uZ2V0RnhEZWZpbml0aW9uKCBmeC5kZWYgKTtcbiAgICAgIGlmICggIWZ4RGVmICkge1xuICAgICAgICBpZiAoIHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAnZGV2ZWxvcG1lbnQnICkge1xuICAgICAgICAgIGNvbnNvbGUud2FybiggYE5vIHN1Y2ggZnggZGVmaW5pdGlvbjogJHsgZnguZGVmIH1gICk7XG4gICAgICAgIH1cblxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgYXZhaWxhYmxlRW5kID0gTWF0aC5taW4oIHRoaXMubGVuZ3RoLCBmeC50aW1lICsgZngubGVuZ3RoICk7XG4gICAgICBjb25zdCBpMCA9IE1hdGguY2VpbCggdGhpcy5fX2F1dG9tYXRvbi5yZXNvbHV0aW9uICogZngudGltZSApO1xuICAgICAgY29uc3QgaTEgPSBNYXRoLmZsb29yKCB0aGlzLl9fYXV0b21hdG9uLnJlc29sdXRpb24gKiBhdmFpbGFibGVFbmQgKTtcbiAgICAgIGlmICggaTEgPD0gaTAgKSB7XG4gICAgICAgIGlmICggcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdkZXZlbG9wbWVudCcgKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvciggJ0xlbmd0aCBvZiB0aGUgZnggc2VjdGlvbiBpcyBiZWluZyBuZWdhdGl2ZScgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB0ZW1wTGVuZ3RoID0gaTEgLSBpMCArIDE7XG4gICAgICBjb25zdCB0ZW1wVmFsdWVzID0gbmV3IEZsb2F0MzJBcnJheSggdGVtcExlbmd0aCApO1xuXG4gICAgICBjb25zdCBjb250ZXh0OiBGeENvbnRleHQgPSB7XG4gICAgICAgIGluZGV4OiBpMCxcbiAgICAgICAgaTAsXG4gICAgICAgIGkxLFxuICAgICAgICB0aW1lOiBmeC50aW1lLFxuICAgICAgICB0MDogZngudGltZSxcbiAgICAgICAgdDE6IGZ4LnRpbWUgKyBmeC5sZW5ndGgsXG4gICAgICAgIGRlbHRhVGltZTogMS4wIC8gdGhpcy5fX2F1dG9tYXRvbi5yZXNvbHV0aW9uLFxuICAgICAgICB2YWx1ZTogMC4wLFxuICAgICAgICBwcm9ncmVzczogMC4wLFxuICAgICAgICBlbGFwc2VkOiAwLjAsXG4gICAgICAgIHJlc29sdXRpb246IHRoaXMuX19hdXRvbWF0b24ucmVzb2x1dGlvbixcbiAgICAgICAgbGVuZ3RoOiBmeC5sZW5ndGgsXG4gICAgICAgIHBhcmFtczogZngucGFyYW1zLFxuICAgICAgICBhcnJheTogdGhpcy5fX3ZhbHVlcyxcbiAgICAgICAgZ2V0VmFsdWU6IHRoaXMuZ2V0VmFsdWUuYmluZCggdGhpcyApLFxuICAgICAgICBpbml0OiB0cnVlLFxuICAgICAgICBzdGF0ZToge31cbiAgICAgIH07XG5cbiAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRlbXBMZW5ndGg7IGkgKysgKSB7XG4gICAgICAgIGNvbnRleHQuaW5kZXggPSBpICsgaTA7XG4gICAgICAgIGNvbnRleHQudGltZSA9IGNvbnRleHQuaW5kZXggLyB0aGlzLl9fYXV0b21hdG9uLnJlc29sdXRpb247XG4gICAgICAgIGNvbnRleHQudmFsdWUgPSB0aGlzLl9fdmFsdWVzWyBpICsgaTAgXTtcbiAgICAgICAgY29udGV4dC5lbGFwc2VkID0gY29udGV4dC50aW1lIC0gZngudGltZTtcbiAgICAgICAgY29udGV4dC5wcm9ncmVzcyA9IGNvbnRleHQuZWxhcHNlZCAvIGZ4Lmxlbmd0aDtcbiAgICAgICAgdGVtcFZhbHVlc1sgaSBdID0gZnhEZWYuZnVuYyggY29udGV4dCApO1xuXG4gICAgICAgIGNvbnRleHQuaW5pdCA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9fdmFsdWVzLnNldCggdGVtcFZhbHVlcywgaTAgKTtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IENoYW5uZWwgfSBmcm9tICcuL0NoYW5uZWwnO1xuaW1wb3J0IHsgQ3VydmUgfSBmcm9tICcuL0N1cnZlJztcbmltcG9ydCB0eXBlIHsgQXV0b21hdG9uT3B0aW9ucyB9IGZyb20gJy4vdHlwZXMvQXV0b21hdG9uT3B0aW9ucyc7XG5pbXBvcnQgdHlwZSB7IENoYW5uZWxVcGRhdGVFdmVudCB9IGZyb20gJy4vdHlwZXMvQ2hhbm5lbFVwZGF0ZUV2ZW50JztcbmltcG9ydCB0eXBlIHsgRnhEZWZpbml0aW9uIH0gZnJvbSAnLi90eXBlcy9GeERlZmluaXRpb24nO1xuaW1wb3J0IHR5cGUgeyBTZXJpYWxpemVkQXV0b21hdG9uIH0gZnJvbSAnLi90eXBlcy9TZXJpYWxpemVkQXV0b21hdG9uJztcblxuLyoqXG4gKiBJVCdTIEFVVE9NQVRPTiFcbiAqIEBwYXJhbSBkYXRhIFNlcmlhbGl6ZWQgZGF0YSBvZiB0aGUgYXV0b21hdG9uXG4gKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25zIGZvciB0aGlzIEF1dG9tYXRvbiBpbnN0YW5jZVxuICovXG5leHBvcnQgY2xhc3MgQXV0b21hdG9uIHtcbiAgLyoqXG4gICAqIEl0IHJldHVybnMgdGhlIGN1cnJlbnQgdmFsdWUgb2YgdGhlIFtbQ2hhbm5lbF1dIGNhbGxlZCBgbmFtZWAuXG4gICAqIElmIHRoZSBgbmFtZWAgaXMgYW4gYXJyYXksIGl0IHJldHVybnMgYSBzZXQgb2YgbmFtZSA6IGNoYW5uZWwgYXMgYW4gb2JqZWN0IGluc3RlYWQuXG4gICAqIFlvdSBjYW4gYWxzbyBnaXZlIGEgbGlzdGVuZXIgd2hpY2ggd2lsbCBiZSBleGVjdXRlZCB3aGVuIHRoZSBjaGFubmVsIGNoYW5nZXMgaXRzIHZhbHVlIChvcHRpb25hbCkuXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBjaGFubmVsXG4gICAqIEBwYXJhbSBsaXN0ZW5lciBBIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBleGVjdXRlZCB3aGVuIHRoZSBjaGFubmVsIGNoYW5nZXMgaXRzIHZhbHVlXG4gICAqIEByZXR1cm5zIEN1cnJlbnQgdmFsdWUgb2YgdGhlIGNoYW5uZWxcbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBhdXRvID0gdGhpcy5fX2F1dG8uYmluZCggdGhpcyApO1xuXG4gIC8qKlxuICAgKiBDdXJ2ZXMgb2YgdGhlIGF1dG9tYXRvbi5cbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBjdXJ2ZXM6IEN1cnZlW10gPSBbXTtcblxuICAvKipcbiAgICogQ2hhbm5lbHMgb2YgdGhlIHRpbWVsaW5lLlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IGNoYW5uZWxzOiBDaGFubmVsW10gPSBbXTtcblxuICAvKipcbiAgICogTWFwIG9mIGNoYW5uZWxzLCBuYW1lIHZzLiBjaGFubmVsIGl0c2VsZi5cbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBtYXBOYW1lVG9DaGFubmVsID0gbmV3IE1hcDxzdHJpbmcsIENoYW5uZWw+KCk7XG5cbiAgLyoqXG4gICAqIEN1cnJlbnQgdGltZSBvZiB0aGUgYXV0b21hdG9uLlxuICAgKiBDYW4gYmUgc2V0IGJ5IFtbdXBkYXRlXV0sIGJlIHJldHJpZXZlZCBieSBbW2dldCB0aW1lXV0sIGJlIHVzZWQgYnkgW1thdXRvXV1cbiAgICovXG4gIHByb3RlY3RlZCBfX3RpbWU6IG51bWJlciA9IDAuMDtcblxuICAvKipcbiAgICogVmVyc2lvbiBvZiB0aGUgYXV0b21hdG9uLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fdmVyc2lvbjogc3RyaW5nID0gcHJvY2Vzcy5lbnYuVkVSU0lPTiE7XG5cbiAgLyoqXG4gICAqIFJlc29sdXRpb24gb2YgdGhlIHRpbWVsaW5lLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fcmVzb2x1dGlvbjogbnVtYmVyID0gMTAwMDtcblxuICAvKipcbiAgICogQSBtYXAgb2YgZnggZGVmaW5pdGlvbnMuXG4gICAqL1xuICBwcm90ZWN0ZWQgX19meERlZmluaXRpb25zOiB7IFsgbmFtZTogc3RyaW5nIF06IEZ4RGVmaW5pdGlvbiB9ID0ge307XG5cbiAgcHVibGljIGNvbnN0cnVjdG9yKFxuICAgIGRhdGE6IFNlcmlhbGl6ZWRBdXRvbWF0b24sXG4gICAgb3B0aW9uczogQXV0b21hdG9uT3B0aW9ucyA9IHt9XG4gICkge1xuICAgIG9wdGlvbnMuZnhEZWZpbml0aW9ucyAmJiB0aGlzLmFkZEZ4RGVmaW5pdGlvbnMoIG9wdGlvbnMuZnhEZWZpbml0aW9ucyApO1xuICAgIHRoaXMuZGVzZXJpYWxpemUoIGRhdGEgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDdXJyZW50IHRpbWUgb2YgdGhlIGF1dG9tYXRvbiwgdGhhdCBpcyBzZXQgdmlhIFtbdXBkYXRlXV0uXG4gICAqL1xuICBwdWJsaWMgZ2V0IHRpbWUoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX190aW1lOyB9XG5cbiAgLyoqXG4gICAqIFZlcnNpb24gb2YgdGhlIGF1dG9tYXRvbi5cbiAgICovXG4gIHB1YmxpYyBnZXQgdmVyc2lvbigpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5fX3ZlcnNpb247IH1cblxuICAvKipcbiAgICogUmVzb2x1dGlvbiA9IFNhbXBsaW5nIHBvaW50IHBlciBzZWNvbmQuXG4gICAqL1xuICBwdWJsaWMgZ2V0IHJlc29sdXRpb24oKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX19yZXNvbHV0aW9uOyB9XG5cbiAgLyoqXG4gICAqIExvYWQgc2VyaWFsaXplZCBhdXRvbWF0b24gZGF0YS5cbiAgICogQHBhcmFtIGRhdGEgU2VyaWFsaXplZCBvYmplY3QgY29udGFpbnMgYXV0b21hdG9uIGRhdGEuXG4gICAqL1xuICBwdWJsaWMgZGVzZXJpYWxpemUoIGRhdGE6IFNlcmlhbGl6ZWRBdXRvbWF0b24gKTogdm9pZCB7XG4gICAgdGhpcy5fX3Jlc29sdXRpb24gPSBkYXRhLnJlc29sdXRpb247XG5cbiAgICB0aGlzLmN1cnZlcy5zcGxpY2UoIDAgKTtcbiAgICB0aGlzLmN1cnZlcy5wdXNoKFxuICAgICAgLi4uZGF0YS5jdXJ2ZXMubWFwKCAoIGRhdGEgKSA9PiBuZXcgQ3VydmUoIHRoaXMsIGRhdGEgKSApXG4gICAgKTtcblxuICAgIHRoaXMubWFwTmFtZVRvQ2hhbm5lbC5jbGVhcigpO1xuXG4gICAgdGhpcy5jaGFubmVscy5zcGxpY2UoIDAgKTtcbiAgICB0aGlzLmNoYW5uZWxzLnB1c2goXG4gICAgICAuLi5kYXRhLmNoYW5uZWxzLm1hcCggKCBbIG5hbWUsIGRhdGEgXSApID0+IHtcbiAgICAgICAgY29uc3QgY2hhbm5lbCA9IG5ldyBDaGFubmVsKCB0aGlzLCBkYXRhICk7XG5cbiAgICAgICAgaWYgKCBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50JyApIHtcbiAgICAgICAgICBpZiAoIHRoaXMubWFwTmFtZVRvQ2hhbm5lbC5oYXMoIG5hbWUgKSApIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybiggYER1cGxpY2F0ZWQgY2hhbm5lbDogJHsgbmFtZSB9YCApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubWFwTmFtZVRvQ2hhbm5lbC5zZXQoIG5hbWUsIGNoYW5uZWwgKTtcbiAgICAgICAgcmV0dXJuIGNoYW5uZWw7XG4gICAgICB9IClcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBmeCBkZWZpbml0aW9ucy5cbiAgICogQHBhcmFtIGZ4RGVmaW5pdGlvbnMgQSBtYXAgb2YgaWQgLSBmeCBkZWZpbml0aW9uXG4gICAqL1xuICBwdWJsaWMgYWRkRnhEZWZpbml0aW9ucyggZnhEZWZpbml0aW9uczogeyBbIGlkOiBzdHJpbmcgXTogRnhEZWZpbml0aW9uIH0gKTogdm9pZCB7XG4gICAgT2JqZWN0LmVudHJpZXMoIGZ4RGVmaW5pdGlvbnMgKS5mb3JFYWNoKCAoIFsgaWQsIGZ4RGVmIF0gKSA9PiB7XG4gICAgICBpZiAoIHR5cGVvZiBmeERlZi5mdW5jID09PSAnZnVuY3Rpb24nICkgeyAvLyBpZ25vcmUgdW5yZWxhdGVkIGVudHJpZXNcbiAgICAgICAgaWYgKCBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50JyApIHtcbiAgICAgICAgICBpZiAoIHRoaXMuX19meERlZmluaXRpb25zWyBpZCBdICE9IG51bGwgKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oIGBPdmVyd3JpdGluZyB0aGUgZXhpc3RpbmcgZnggZGVmaW5pdGlvbjogJHsgaWQgfWAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9fZnhEZWZpbml0aW9uc1sgaWQgXSA9IGZ4RGVmO1xuICAgICAgfVxuICAgIH0gKTtcblxuICAgIHRoaXMucHJlY2FsY0FsbCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIGZ4IGRlZmluaXRpb24uXG4gICAqIElmIGl0IGNhbid0IGZpbmQgdGhlIGRlZmluaXRpb24sIGl0IHJldHVybnMgYG51bGxgIGluc3RlYWQuXG4gICAqIEBwYXJhbSBpZCBVbmlxdWUgaWQgZm9yIHRoZSBGeCBkZWZpbml0aW9uXG4gICAqL1xuICBwdWJsaWMgZ2V0RnhEZWZpbml0aW9uKCBpZDogc3RyaW5nICk6IEZ4RGVmaW5pdGlvbiB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLl9fZnhEZWZpbml0aW9uc1sgaWQgXSB8fCBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIGN1cnZlLlxuICAgKiBAcGFyYW0gaW5kZXggQW4gaW5kZXggb2YgdGhlIGN1cnZlXG4gICAqL1xuICBwdWJsaWMgZ2V0Q3VydmUoIGluZGV4OiBudW1iZXIgKTogQ3VydmUgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5jdXJ2ZXNbIGluZGV4IF0gfHwgbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmVjYWxjdWxhdGUgYWxsIGN1cnZlcy5cbiAgICovXG4gIHB1YmxpYyBwcmVjYWxjQWxsKCk6IHZvaWQge1xuICAgIE9iamVjdC52YWx1ZXMoIHRoaXMuY3VydmVzICkuZm9yRWFjaCggKCBjdXJ2ZSApID0+IGN1cnZlLnByZWNhbGMoKSApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0IHRoZSBpbnRlcm5hbCBzdGF0ZXMgb2YgY2hhbm5lbHMuXG4gICAqICoqQ2FsbCB0aGlzIG1ldGhvZCB3aGVuIHlvdSBzZWVrIHRoZSB0aW1lLioqXG4gICAqL1xuICBwdWJsaWMgcmVzZXQoKTogdm9pZCB7XG4gICAgT2JqZWN0LnZhbHVlcyggdGhpcy5jaGFubmVscyApLmZvckVhY2goICggY2hhbm5lbCApID0+IGNoYW5uZWwucmVzZXQoKSApO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgZW50aXJlIGF1dG9tYXRvbi5cbiAgICogKipZb3UgbWF5IHdhbnQgdG8gY2FsbCB0aGlzIGluIHlvdXIgdXBkYXRlIGxvb3AuKipcbiAgICogQHBhcmFtIHRpbWUgQ3VycmVudCB0aW1lXG4gICAqL1xuICBwdWJsaWMgdXBkYXRlKCB0aW1lOiBudW1iZXIgKTogdm9pZCB7XG4gICAgY29uc3QgdCA9IE1hdGgubWF4KCB0aW1lLCAwLjAgKTtcblxuICAgIC8vIGNhY2hlIHRoZSB0aW1lXG4gICAgdGhpcy5fX3RpbWUgPSB0O1xuXG4gICAgLy8gdXBkYXRlIGNoYW5uZWxzXG4gICAgY29uc3QgYXJyYXkgPSB0aGlzLmNoYW5uZWxzLm1hcCggKCBjaGFubmVsICkgPT4gY2hhbm5lbC5jb25zdW1lKCB0aGlzLl9fdGltZSApICkuZmxhdCggMSApO1xuICAgIGFycmF5LnNvcnQoICggWyBhIF0sIFsgYiBdICkgPT4gYSAtIGIgKS5mb3JFYWNoKCAoIFsgXywgZnVuYyBdICkgPT4gZnVuYygpICk7XG4gIH1cblxuICAvKipcbiAgICogQXNzaWduZWQgdG8ge0BsaW5rIEF1dG9tYXRvbiNhdXRvfSBvbiBpdHMgaW5pdGlhbGl6ZSBwaGFzZS5cbiAgICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgb2YgdGhlIGNoYW5uZWxcbiAgICogQHBhcmFtIGxpc3RlbmVyIEEgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIGV4ZWN1dGVkIHdoZW4gdGhlIGNoYW5uZWwgY2hhbmdlcyBpdHMgdmFsdWVcbiAgICogQHJldHVybnMgQ3VycmVudCB2YWx1ZSBvZiB0aGUgY2hhbm5lbFxuICAgKi9cbiAgcHJvdGVjdGVkIF9fYXV0byhcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgbGlzdGVuZXI/OiAoIGV2ZW50OiBDaGFubmVsVXBkYXRlRXZlbnQgKSA9PiB2b2lkXG4gICk6IG51bWJlciB7XG4gICAgY29uc3QgY2hhbm5lbCA9IHRoaXMubWFwTmFtZVRvQ2hhbm5lbC5nZXQoIG5hbWUgKTtcblxuICAgIGlmICggcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdkZXZlbG9wbWVudCcgKSB7XG4gICAgICBpZiAoICFjaGFubmVsICkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoIGBObyBzdWNoIGNoYW5uZWw6ICR7IG5hbWUgfWAgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIGxpc3RlbmVyICkge1xuICAgICAgY2hhbm5lbCEuc3Vic2NyaWJlKCBsaXN0ZW5lciApO1xuICAgIH1cblxuICAgIHJldHVybiBjaGFubmVsIS5jdXJyZW50VmFsdWU7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUdBOzs7TUFHYSxXQUFXOzs7Ozs7SUE2RHRCLFlBQW9CLFNBQW9CLEVBQUUsSUFBMkI7UUFDbkUsSUFBSSxDQUFD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
