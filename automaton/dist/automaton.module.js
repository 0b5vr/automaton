/*!
* @fms-cat/automaton v4.0.0
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

export { Automaton, Channel, ChannelItem, Curve };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b21hdG9uLm1vZHVsZS5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL0NoYW5uZWxJdGVtLnRzIiwiLi4vc3JjL0NoYW5uZWwudHMiLCIuLi9zcmMvdXRpbHMvYmV6aWVyRWFzaW5nLnRzIiwiLi4vc3JjL0N1cnZlLnRzIiwiLi4vc3JjL0F1dG9tYXRvbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBdXRvbWF0b24sIEN1cnZlIH0gZnJvbSAnLic7XG5pbXBvcnQgdHlwZSB7IFNlcmlhbGl6ZWRDaGFubmVsSXRlbSB9IGZyb20gJy4vdHlwZXMvU2VyaWFsaXplZENoYW5uZWxJdGVtJztcblxuLyoqXG4gKiBSZXByZXNlbnRzIGFuIGl0ZW0gb2YgYSBbW0NoYW5uZWxdXS5cbiAqL1xuZXhwb3J0IGNsYXNzIENoYW5uZWxJdGVtIHtcbiAgLyoqXG4gICAqIFRoZSBwYXJlbnQgYXV0b21hdG9uLlxuICAgKi9cbiAgcHJvdGVjdGVkIHJlYWRvbmx5IF9fYXV0b21hdG9uOiBBdXRvbWF0b247XG5cbiAgLyoqXG4gICAqIEJlZ2lubmluZyB0aW1lcG9pbnQgb2YgdGhlIGl0ZW0uXG4gICAqL1xuICBwdWJsaWMgdGltZSE6IG51bWJlcjtcblxuICAvKipcbiAgICogTGVuZ3RoIG9mIHRoZSBpdGVtLlxuICAgKi9cbiAgcHVibGljIGxlbmd0aCE6IG51bWJlcjtcblxuICAvKipcbiAgICogVmFsdWUgb2YgdGhlIGl0ZW0uXG4gICAqL1xuICBwdWJsaWMgdmFsdWUhOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgcmVzZXQgY2hhbm5lbHMgdmFsdWUgdG8gemVybyBhdCB0aGUgZW5kIG9mIHRoaXMgaXRlbSBvciBub3QuXG4gICAqL1xuICBwdWJsaWMgcmVzZXQ/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBUaGlzIHdpbGwgb25seSBtYWtlIHNlbnNlIHdoZW4ge0BsaW5rIGN1cnZlfSBpcyBzcGVjaWZpZWQuXG4gICAqIFRoZSB0aW1lIG9mZnNldCBvZiB0aGUgaXRlbS5cbiAgICovXG4gIHB1YmxpYyBvZmZzZXQhOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoaXMgd2lsbCBvbmx5IG1ha2Ugc2Vuc2Ugd2hlbiB7QGxpbmsgY3VydmV9IGlzIHNwZWNpZmllZC5cbiAgICogVGhlIHNwZWVkIHJhdGUgb2YgdGhlIGl0ZW0uXG4gICAqL1xuICBwdWJsaWMgc3BlZWQhOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoaXMgd2lsbCBvbmx5IG1ha2Ugc2Vuc2Ugd2hlbiB7QGxpbmsgY3VydmV9IGlzIHNwZWNpZmllZC5cbiAgICogVGhlIHNjYWxlIG9mIHRoZSBpdGVtIGluIHRoZSB2YWx1ZSBheGlzLlxuICAgKi9cbiAgcHVibGljIGFtcCE6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIGN1cnZlIG9mIHRoZSBpdGVtLlxuICAgKi9cbiAgcHVibGljIGN1cnZlPzogQ3VydmU7XG5cbiAgLyoqXG4gICAqIEVuZGluZyB0aW1lcG9pbnQgb2YgdGhlIGl0ZW0uXG4gICAqL1xuICBwdWJsaWMgZ2V0IGVuZCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLnRpbWUgKyB0aGlzLmxlbmd0aDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RvciBvZiB0aGUgW1tDaGFubmVsSXRlbV1dLlxuICAgKiBAcGFyYW0gYXV0b21hdG9uIFBhcmVudCBhdXRvbWF0b25cbiAgICogQHBhcmFtIGRhdGEgRGF0YSBvZiB0aGUgaXRlbVxuICAgKi9cbiAgcHVibGljIGNvbnN0cnVjdG9yKCBhdXRvbWF0b246IEF1dG9tYXRvbiwgZGF0YTogU2VyaWFsaXplZENoYW5uZWxJdGVtICkge1xuICAgIHRoaXMuX19hdXRvbWF0b24gPSBhdXRvbWF0b247XG5cbiAgICB0aGlzLmRlc2VyaWFsaXplKCBkYXRhICk7XG4gIH1cblxuICBwdWJsaWMgZ2V0VmFsdWUoIHRpbWU6IG51bWJlciApOiBudW1iZXIge1xuICAgIGlmICggdGhpcy5yZXNldCAmJiB0aGlzLmxlbmd0aCA8PSB0aW1lICkge1xuICAgICAgcmV0dXJuIDAuMDtcbiAgICB9XG5cbiAgICBpZiAoIHRoaXMuY3VydmUgKSB7XG4gICAgICBjb25zdCB0ID0gdGhpcy5vZmZzZXQhICsgdGltZSAqIHRoaXMuc3BlZWQhO1xuICAgICAgcmV0dXJuIHRoaXMudmFsdWUgKyB0aGlzLmFtcCAqIHRoaXMuY3VydmUuZ2V0VmFsdWUoIHQgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMudmFsdWU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERlc2VyaWFsaXplIGEgc2VyaWFsaXplZCBkYXRhIG9mIGl0ZW0gZnJvbSBbW1NlcmlhbGl6ZWRDaGFubmVsSXRlbV1dLlxuICAgKiBAcGFyYW0gZGF0YSBBIHNlcmlhbGl6ZWQgaXRlbS5cbiAgICovXG4gIHB1YmxpYyBkZXNlcmlhbGl6ZSggZGF0YTogU2VyaWFsaXplZENoYW5uZWxJdGVtICk6IHZvaWQge1xuICAgIHRoaXMudGltZSA9IGRhdGEudGltZSA/PyAwLjA7XG4gICAgdGhpcy5sZW5ndGggPSBkYXRhLmxlbmd0aCA/PyAwLjA7XG4gICAgdGhpcy52YWx1ZSA9IGRhdGEudmFsdWUgPz8gMC4wO1xuICAgIHRoaXMub2Zmc2V0ID0gZGF0YS5vZmZzZXQgPz8gMC4wO1xuICAgIHRoaXMuc3BlZWQgPSBkYXRhLnNwZWVkID8/IDEuMDtcbiAgICB0aGlzLmFtcCA9IGRhdGEuYW1wID8/IDEuMDtcbiAgICB0aGlzLnJlc2V0ID0gZGF0YS5yZXNldDtcbiAgICBpZiAoIGRhdGEuY3VydmUgIT0gbnVsbCApIHtcbiAgICAgIHRoaXMuY3VydmUgPSB0aGlzLl9fYXV0b21hdG9uLmdldEN1cnZlKCBkYXRhLmN1cnZlICkhO1xuICAgICAgdGhpcy5sZW5ndGggPSBkYXRhLmxlbmd0aCA/PyB0aGlzLmN1cnZlLmxlbmd0aCA/PyAwLjA7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBBdXRvbWF0b24gfSBmcm9tICcuL0F1dG9tYXRvbic7XG5pbXBvcnQgeyBDaGFubmVsSXRlbSB9IGZyb20gJy4vQ2hhbm5lbEl0ZW0nO1xuaW1wb3J0IHR5cGUgeyBDaGFubmVsVXBkYXRlRXZlbnQgfSBmcm9tICcuL3R5cGVzL0NoYW5uZWxVcGRhdGVFdmVudCc7XG5pbXBvcnQgdHlwZSB7IFNlcmlhbGl6ZWRDaGFubmVsIH0gZnJvbSAnLi90eXBlcy9TZXJpYWxpemVkQ2hhbm5lbCc7XG5cbi8qKlxuICogSXQgcmVwcmVzZW50cyBhIGNoYW5uZWwgb2YgQXV0b21hdG9uLlxuICovXG5leHBvcnQgY2xhc3MgQ2hhbm5lbCB7XG4gIC8qKlxuICAgKiBUaGUgcGFyZW50IGF1dG9tYXRvbi5cbiAgICovXG4gIHByb3RlY3RlZCBfX2F1dG9tYXRvbjogQXV0b21hdG9uO1xuXG4gIC8qKlxuICAgKiBMaXN0IG9mIGNoYW5uZWwgaXRlbXMuXG4gICAqL1xuICBwcm90ZWN0ZWQgX19pdGVtczogQ2hhbm5lbEl0ZW1bXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBBIGNhY2hlIG9mIGxhc3QgY2FsY3VsYXRlZCB2YWx1ZS5cbiAgICovXG4gIHByb3RlY3RlZCBfX3ZhbHVlOiBudW1iZXIgPSAwLjA7XG5cbiAgLyoqXG4gICAqIFRoZSB0aW1lIHRoYXQgd2FzIHVzZWQgZm9yIHRoZSBjYWxjdWxhdGlvbiBvZiBbW19fbGFzdFZhbHVlXV0uXG4gICAqL1xuICBwcm90ZWN0ZWQgX190aW1lOiBudW1iZXIgPSAtSW5maW5pdHk7XG5cbiAgLyoqXG4gICAqIFRoZSBpbmRleCBvZiBbW19faXRlbXNdXSBpdCBzaG91bGQgZXZhbHVhdGUgbmV4dC5cbiAgICovXG4gIHByb3RlY3RlZCBfX2hlYWQ6IG51bWJlciA9IDA7XG5cbiAgLyoqXG4gICAqIEFuIGFycmF5IG9mIGxpc3RlbmVycy5cbiAgICovXG4gIHByb3RlY3RlZCBfX2xpc3RlbmVyczogQXJyYXk8KCBldmVudDogQ2hhbm5lbFVwZGF0ZUV2ZW50ICkgPT4gdm9pZD4gPSBbXTtcblxuICAvKipcbiAgICogQ29uc3RydWN0b3Igb2YgdGhlIFtbQ2hhbm5lbF1dLlxuICAgKiBAcGFyYW0gYXV0b21hdG9uIFBhcmVudCBhdXRvbWF0b25cbiAgICogQHBhcmFtIGRhdGEgRGF0YSBvZiB0aGUgY2hhbm5lbFxuICAgKi9cbiAgcHVibGljIGNvbnN0cnVjdG9yKCBhdXRvbWF0b246IEF1dG9tYXRvbiwgZGF0YTogU2VyaWFsaXplZENoYW5uZWwgKSB7XG4gICAgdGhpcy5fX2F1dG9tYXRvbiA9IGF1dG9tYXRvbjtcblxuICAgIHRoaXMuZGVzZXJpYWxpemUoIGRhdGEgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIGNhY2hlIG9mIGxhc3QgY2FsY3VsYXRlZCB2YWx1ZS5cbiAgICovXG4gIHB1YmxpYyBnZXQgY3VycmVudFZhbHVlKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9fdmFsdWU7IH1cblxuICAvKipcbiAgICogVGhlIHRpbWUgdGhhdCB3YXMgdXNlZCBmb3IgdGhlIGNhbGN1bGF0aW9uIG9mIFtbX19sYXN0VmFsdWVdXS5cbiAgICovXG4gIHB1YmxpYyBnZXQgY3VycmVudFRpbWUoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX190aW1lOyB9XG5cbiAgLyoqXG4gICAqIExvYWQgYSBzZXJpYWxpemVkIGRhdGEgb2YgYSBjaGFubmVsLlxuICAgKiBAcGFyYW0gZGF0YSBEYXRhIG9mIGEgY2hhbm5lbFxuICAgKi9cbiAgcHVibGljIGRlc2VyaWFsaXplKCBkYXRhOiBTZXJpYWxpemVkQ2hhbm5lbCApOiB2b2lkIHtcbiAgICB0aGlzLl9faXRlbXMgPSBkYXRhLml0ZW1zPy5tYXAoICggaXRlbSApID0+IG5ldyBDaGFubmVsSXRlbSggdGhpcy5fX2F1dG9tYXRvbiwgaXRlbSApICkgPz8gW107XG4gIH1cblxuICAvKipcbiAgICogUmVzZXQgdGhlIGludGVybmFsIHN0YXRlcy5cbiAgICogQ2FsbCB0aGlzIG1ldGhvZCB3aGVuIHlvdSBzZWVrIHRoZSB0aW1lLlxuICAgKi9cbiAgcHVibGljIHJlc2V0KCk6IHZvaWQge1xuICAgIHRoaXMuX190aW1lID0gLUluZmluaXR5O1xuICAgIHRoaXMuX192YWx1ZSA9IDA7XG4gICAgdGhpcy5fX2hlYWQgPSAwO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIG5ldyBsaXN0ZW5lciB0aGF0IHJlY2VpdmVzIGEgW1tDaGFubmVsVXBkYXRlRXZlbnRdXSB3aGVuIGFuIHVwZGF0ZSBpcyBoYXBwZW5lZC5cbiAgICogQHBhcmFtIGxpc3RlbmVyIEEgc3Vic2NyaWJpbmcgbGlzdGVuZXJcbiAgICovXG4gIHB1YmxpYyBzdWJzY3JpYmUoIGxpc3RlbmVyOiAoIGV2ZW50OiBDaGFubmVsVXBkYXRlRXZlbnQgKSA9PiB2b2lkICk6IHZvaWQge1xuICAgIHRoaXMuX19saXN0ZW5lcnMucHVzaCggbGlzdGVuZXIgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIHZhbHVlIG9mIHNwZWNpZmllZCB0aW1lIHBvaW50LlxuICAgKiBAcGFyYW0gdGltZSBUaW1lIGF0IHRoZSBwb2ludCB5b3Ugd2FudCB0byBncmFiIHRoZSB2YWx1ZS5cbiAgICogQHJldHVybnMgUmVzdWx0IHZhbHVlXG4gICAqL1xuICBwdWJsaWMgZ2V0VmFsdWUoIHRpbWU6IG51bWJlciApOiBudW1iZXIge1xuICAgIGxldCBuZXh0ID0gdGhpcy5fX2l0ZW1zLmZpbmRJbmRleCggKCBpdGVtICkgPT4gKCB0aW1lIDwgaXRlbS50aW1lICkgKTtcblxuICAgIC8vIGl0J3MgdGhlIGZpcnN0IG9uZSFcbiAgICBpZiAoIG5leHQgPT09IDAgKSB7XG4gICAgICByZXR1cm4gMC4wO1xuICAgIH1cblxuICAgIC8vIGl0J3MgdGhlIGxhc3Qgb25lIVxuICAgIGlmICggbmV4dCA9PT0gLTEgKSB7XG4gICAgICBuZXh0ID0gdGhpcy5fX2l0ZW1zLmxlbmd0aDtcbiAgICB9XG5cbiAgICBjb25zdCBpdGVtID0gdGhpcy5fX2l0ZW1zWyBuZXh0IC0gMSBdO1xuICAgIGlmICggaXRlbS5lbmQgPCB0aW1lICkge1xuICAgICAgcmV0dXJuIGl0ZW0uZ2V0VmFsdWUoIGl0ZW0ubGVuZ3RoICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBpdGVtLmdldFZhbHVlKCB0aW1lIC0gaXRlbS50aW1lICk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgbWV0aG9kIGlzIGludGVuZGVkIHRvIGJlIHVzZWQgYnkgW1tBdXRvbWF0b24udXBkYXRlXV0uXG4gICAqIEBwYXJhbSB0aW1lIFRoZSBjdXJyZW50IHRpbWUgb2YgdGhlIHBhcmVudCBbW0F1dG9tYXRvbl1dXG4gICAqIEByZXR1cm5zIHdoZXRoZXIgdGhlIHZhbHVlIGhhcyBiZWVuIGNoYW5nZWQgb3Igbm90XG4gICAqL1xuICBwdWJsaWMgdXBkYXRlKCB0aW1lOiBudW1iZXIgKTogdm9pZCB7XG4gICAgbGV0IHZhbHVlID0gdGhpcy5fX3ZhbHVlO1xuICAgIGNvbnN0IHByZXZUaW1lID0gdGhpcy5fX3RpbWU7XG5cbiAgICBmb3IgKCBsZXQgaSA9IHRoaXMuX19oZWFkOyBpIDwgdGhpcy5fX2l0ZW1zLmxlbmd0aDsgaSArKyApIHtcbiAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLl9faXRlbXNbIGkgXTtcbiAgICAgIGNvbnN0IHsgdGltZTogYmVnaW4sIGVuZCwgbGVuZ3RoIH0gPSBpdGVtO1xuICAgICAgbGV0IGVsYXBzZWQgPSB0aW1lIC0gYmVnaW47XG5cbiAgICAgIGlmICggZWxhcHNlZCA8IDAuMCApIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgcHJvZ3Jlc3M6IG51bWJlcjtcbiAgICAgICAgbGV0IGluaXQ6IHRydWUgfCB1bmRlZmluZWQ7XG4gICAgICAgIGxldCB1bmluaXQ6IHRydWUgfCB1bmRlZmluZWQ7XG5cbiAgICAgICAgaWYgKCBsZW5ndGggPD0gZWxhcHNlZCApIHtcbiAgICAgICAgICBlbGFwc2VkID0gbGVuZ3RoO1xuICAgICAgICAgIHByb2dyZXNzID0gMS4wO1xuICAgICAgICAgIHVuaW5pdCA9IHRydWU7XG5cbiAgICAgICAgICBpZiAoIGkgPT09IHRoaXMuX19oZWFkICkge1xuICAgICAgICAgICAgdGhpcy5fX2hlYWQgKys7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHByb2dyZXNzID0gbGVuZ3RoICE9PSAwLjBcbiAgICAgICAgICAgID8gZWxhcHNlZCAvIGxlbmd0aFxuICAgICAgICAgICAgOiAxLjA7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHByZXZUaW1lIDwgYmVnaW4gKSB7XG4gICAgICAgICAgaW5pdCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICB2YWx1ZSA9IGl0ZW0uZ2V0VmFsdWUoIGVsYXBzZWQgKTtcblxuICAgICAgICB0aGlzLl9fbGlzdGVuZXJzLmZvckVhY2goICggbGlzdGVuZXIgKSA9PiBsaXN0ZW5lcigge1xuICAgICAgICAgIHRpbWUsXG4gICAgICAgICAgZWxhcHNlZCxcbiAgICAgICAgICBiZWdpbixcbiAgICAgICAgICBlbmQsXG4gICAgICAgICAgbGVuZ3RoLFxuICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgIHByb2dyZXNzLFxuICAgICAgICAgIGluaXQsXG4gICAgICAgICAgdW5pbml0LFxuICAgICAgICB9ICkgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl9fdGltZSA9IHRpbWU7XG4gICAgdGhpcy5fX3ZhbHVlID0gdmFsdWU7XG4gIH1cbn1cbiIsImltcG9ydCB0eXBlIHsgQmV6aWVyTm9kZSB9IGZyb20gJy4uL3R5cGVzL0Jlemllck5vZGUnO1xuXG5pbnRlcmZhY2UgQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzIHtcbiAgcDA6IG51bWJlcjtcbiAgcDE6IG51bWJlcjtcbiAgcDI6IG51bWJlcjtcbiAgcDM6IG51bWJlcjtcbn1cblxuY29uc3QgTkVXVE9OX0lURVIgPSA0O1xuY29uc3QgTkVXVE9OX0VQU0lMT04gPSAwLjAwMTtcbmNvbnN0IFNVQkRJVl9JVEVSID0gMTA7XG5jb25zdCBTVUJESVZfRVBTSUxPTiA9IDAuMDAwMDAxO1xuY29uc3QgVEFCTEVfU0laRSA9IDIxO1xuXG5jb25zdCBfX2NhY2hlOiBudW1iZXJbXSA9IFtdO1xuXG5mdW5jdGlvbiBjbGFtcCggeDogbnVtYmVyLCBtaW46IG51bWJlciwgbWF4OiBudW1iZXIgKTogbnVtYmVyIHtcbiAgcmV0dXJuIE1hdGgubWluKCBNYXRoLm1heCggeCwgbWluICksIG1heCApO1xufVxuXG4vKlxuICogKDEtdCkoMS10KSgxLXQpIGEwID0gKDEtMnQrdHQpKDEtdCkgYTBcbiAqICAgICAgICAgICAgICAgICAgICA9ICgxLXQtMnQrMnR0K3R0LXR0dCkgYTBcbiAqICAgICAgICAgICAgICAgICAgICA9ICgxLTN0KzN0dC10dHQpIGEwXG4gKlxuICogMygxLXQpKDEtdCl0IGExID0gMygxLTJ0K3R0KXQgYTFcbiAqICAgICAgICAgICAgICAgICA9ICgzdC02dHQrM3R0dCkgYTFcbiAqXG4gKiAzKDEtdCl0dCBhMiA9ICgzdHQtM3R0dCkgYTJcbiAqXG4gKiB0dHQgYTNcbiAqXG4gKiAoYTMtM2EyKzNhMS1hMCkgdHR0ICsgKDNhMi02YTErM2EwKSB0dCArICgzYTEtM2EwKSB0ICsgYTBcbiAqL1xuXG5mdW5jdGlvbiBBKCBjcHM6IEN1YmljQmV6aWVyQ29udHJvbFBvaW50cyApOiBudW1iZXIge1xuICByZXR1cm4gY3BzLnAzIC0gMy4wICogY3BzLnAyICsgMy4wICogY3BzLnAxIC0gY3BzLnAwO1xufVxuXG5mdW5jdGlvbiBCKCBjcHM6IEN1YmljQmV6aWVyQ29udHJvbFBvaW50cyApOiBudW1iZXIge1xuICByZXR1cm4gMy4wICogY3BzLnAyIC0gNi4wICogY3BzLnAxICsgMy4wICogY3BzLnAwO1xufVxuXG5mdW5jdGlvbiBDKCBjcHM6IEN1YmljQmV6aWVyQ29udHJvbFBvaW50cyApOiBudW1iZXIge1xuICByZXR1cm4gMy4wICogY3BzLnAxIC0gMy4wICogY3BzLnAwO1xufVxuXG5mdW5jdGlvbiBjdWJpY0JlemllciggdDogbnVtYmVyLCBjcHM6IEN1YmljQmV6aWVyQ29udHJvbFBvaW50cyApOiBudW1iZXIge1xuICByZXR1cm4gKCAoIEEoIGNwcyApICogdCArIEIoIGNwcyApICkgKiB0ICsgQyggY3BzICkgKSAqIHQgKyBjcHMucDA7XG59XG5cbmZ1bmN0aW9uIGRlbHRhQ3ViaWNCZXppZXIoIHQ6IG51bWJlciwgY3BzOiBDdWJpY0JlemllckNvbnRyb2xQb2ludHMgKTogbnVtYmVyIHtcbiAgcmV0dXJuICggMy4wICogQSggY3BzICkgKiB0ICsgMi4wICogQiggY3BzICkgKSAqIHQgKyBDKCBjcHMgKTtcbn1cblxuZnVuY3Rpb24gc3ViZGl2KCB4OiBudW1iZXIsIGE6IG51bWJlciwgYjogbnVtYmVyLCBjcHM6IEN1YmljQmV6aWVyQ29udHJvbFBvaW50cyApOiBudW1iZXIge1xuICBsZXQgY2FuZGlkYXRlWCA9IDA7XG4gIGxldCB0ID0gMDtcblxuICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBTVUJESVZfSVRFUjsgaSArKyApIHtcbiAgICB0ID0gYSArICggYiAtIGEgKSAvIDIuMDtcbiAgICBjYW5kaWRhdGVYID0gY3ViaWNCZXppZXIoIHQsIGNwcyApIC0geDtcbiAgICAoIDAuMCA8IGNhbmRpZGF0ZVggKSA/ICggYiA9IHQgKSA6ICggYSA9IHQgKTtcbiAgICBpZiAoIFNVQkRJVl9FUFNJTE9OIDwgTWF0aC5hYnMoIGNhbmRpZGF0ZVggKSApIHsgYnJlYWs7IH1cbiAgfVxuXG4gIHJldHVybiB0O1xufVxuXG5mdW5jdGlvbiBuZXd0b24oIHg6IG51bWJlciwgdDogbnVtYmVyLCBjcHM6IEN1YmljQmV6aWVyQ29udHJvbFBvaW50cyApOiBudW1iZXIge1xuICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBORVdUT05fSVRFUjsgaSArKyApIHtcbiAgICBjb25zdCBkID0gZGVsdGFDdWJpY0JlemllciggdCwgY3BzICk7XG4gICAgaWYgKCBkID09PSAwLjAgKSB7IHJldHVybiB0OyB9XG4gICAgY29uc3QgY3ggPSBjdWJpY0JlemllciggdCwgY3BzICkgLSB4O1xuICAgIHQgLT0gY3ggLyBkO1xuICB9XG5cbiAgcmV0dXJuIHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByYXdCZXppZXJFYXNpbmcoXG4gIGNwc3g6IEN1YmljQmV6aWVyQ29udHJvbFBvaW50cyxcbiAgY3BzeTogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzLFxuICB4OiBudW1iZXJcbik6IG51bWJlciB7XG4gIGlmICggeCA8PSBjcHN4LnAwICkgeyByZXR1cm4gY3BzeS5wMDsgfSAvLyBjbGFtcGVkXG4gIGlmICggY3BzeC5wMyA8PSB4ICkgeyByZXR1cm4gY3BzeS5wMzsgfSAvLyBjbGFtcGVkXG5cbiAgY3BzeC5wMSA9IGNsYW1wKCBjcHN4LnAxLCBjcHN4LnAwLCBjcHN4LnAzICk7XG4gIGNwc3gucDIgPSBjbGFtcCggY3BzeC5wMiwgY3BzeC5wMCwgY3BzeC5wMyApO1xuXG4gIGZvciAoIGxldCBpID0gMDsgaSA8IFRBQkxFX1NJWkU7IGkgKysgKSB7XG4gICAgX19jYWNoZVsgaSBdID0gY3ViaWNCZXppZXIoIGkgLyAoIFRBQkxFX1NJWkUgLSAxLjAgKSwgY3BzeCApO1xuICB9XG5cbiAgbGV0IHNhbXBsZSA9IDA7XG4gIGZvciAoIGxldCBpID0gMTsgaSA8IFRBQkxFX1NJWkU7IGkgKysgKSB7XG4gICAgc2FtcGxlID0gaSAtIDE7XG4gICAgaWYgKCB4IDwgX19jYWNoZVsgaSBdICkgeyBicmVhazsgfVxuICB9XG5cbiAgY29uc3QgZGlzdCA9ICggeCAtIF9fY2FjaGVbIHNhbXBsZSBdICkgLyAoIF9fY2FjaGVbIHNhbXBsZSArIDEgXSAtIF9fY2FjaGVbIHNhbXBsZSBdICk7XG4gIGxldCB0ID0gKCBzYW1wbGUgKyBkaXN0ICkgLyAoIFRBQkxFX1NJWkUgLSAxICk7XG4gIGNvbnN0IGQgPSBkZWx0YUN1YmljQmV6aWVyKCB0LCBjcHN4ICkgLyAoIGNwc3gucDMgLSBjcHN4LnAwICk7XG5cbiAgaWYgKCBORVdUT05fRVBTSUxPTiA8PSBkICkge1xuICAgIHQgPSBuZXd0b24oIHgsIHQsIGNwc3ggKTtcbiAgfSBlbHNlIGlmICggZCAhPT0gMC4wICkge1xuICAgIHQgPSBzdWJkaXYoIHgsICggc2FtcGxlICkgLyAoIFRBQkxFX1NJWkUgLSAxICksICggc2FtcGxlICsgMS4wICkgLyAoIFRBQkxFX1NJWkUgLSAxICksIGNwc3ggKTtcbiAgfVxuXG4gIHJldHVybiBjdWJpY0JlemllciggdCwgY3BzeSApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYmV6aWVyRWFzaW5nKCBub2RlMDogQmV6aWVyTm9kZSwgbm9kZTE6IEJlemllck5vZGUsIHRpbWU6IG51bWJlciApOiBudW1iZXIge1xuICByZXR1cm4gcmF3QmV6aWVyRWFzaW5nKFxuICAgIHtcbiAgICAgIHAwOiBub2RlMC50aW1lLFxuICAgICAgcDE6IG5vZGUwLnRpbWUgKyBub2RlMC5vdXRUaW1lLFxuICAgICAgcDI6IG5vZGUxLnRpbWUgKyBub2RlMS5pblRpbWUsXG4gICAgICBwMzogbm9kZTEudGltZVxuICAgIH0sXG4gICAge1xuICAgICAgcDA6IG5vZGUwLnZhbHVlLFxuICAgICAgcDE6IG5vZGUwLnZhbHVlICsgbm9kZTAub3V0VmFsdWUsXG4gICAgICBwMjogbm9kZTEudmFsdWUgKyBub2RlMS5pblZhbHVlLFxuICAgICAgcDM6IG5vZGUxLnZhbHVlXG4gICAgfSxcbiAgICB0aW1lXG4gICk7XG59XG4iLCJpbXBvcnQgeyBBdXRvbWF0b24gfSBmcm9tICcuL0F1dG9tYXRvbic7XG5pbXBvcnQgeyBiZXppZXJFYXNpbmcgfSBmcm9tICcuL3V0aWxzL2JlemllckVhc2luZyc7XG5pbXBvcnQgdHlwZSB7IEJlemllck5vZGUgfSBmcm9tICcuL3R5cGVzL0Jlemllck5vZGUnO1xuaW1wb3J0IHR5cGUgeyBGeENvbnRleHQgfSBmcm9tICcuL3R5cGVzL0Z4Q29udGV4dCc7XG5pbXBvcnQgdHlwZSB7IEZ4U2VjdGlvbiB9IGZyb20gJy4vdHlwZXMvRnhTZWN0aW9uJztcbmltcG9ydCB0eXBlIHsgU2VyaWFsaXplZEN1cnZlIH0gZnJvbSAnLi90eXBlcy9TZXJpYWxpemVkQ3VydmUnO1xuXG4vKipcbiAqIEl0IHJlcHJlc2VudHMgYSBjdXJ2ZSBvZiBBdXRvbWF0b24uXG4gKi9cbmV4cG9ydCBjbGFzcyBDdXJ2ZSB7XG4gIC8qKlxuICAgKiBUaGUgcGFyZW50IGF1dG9tYXRvbi5cbiAgICovXG4gIHByb3RlY3RlZCBfX2F1dG9tYXRvbjogQXV0b21hdG9uO1xuXG4gIC8qKlxuICAgKiBBbiBhcnJheSBvZiBwcmVjYWxjdWxhdGVkIHZhbHVlLlxuICAgKiBJdHMgbGVuZ3RoIGlzIHNhbWUgYXMgYGN1cnZlLl9fYXV0b21hdG9uLnJlc29sdXRpb24gKiBjdXJ2ZS5fX2F1dG9tYXRvbi5sZW5ndGggKyAxYC5cbiAgKi9cbiAgcHJvdGVjdGVkIF9fdmFsdWVzITogRmxvYXQzMkFycmF5O1xuXG4gIC8qKlxuICAgKiBMaXN0IG9mIGJlemllciBub2RlLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fbm9kZXM6IEJlemllck5vZGVbXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBMaXN0IG9mIGZ4IHNlY3Rpb25zLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fZnhzOiBGeFNlY3Rpb25bXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBUaGUgbGVuZ3RoIG9mIHRoaXMgY3VydmUuXG4gICAqL1xuICBwdWJsaWMgZ2V0IGxlbmd0aCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9fbm9kZXNbIHRoaXMuX19ub2Rlcy5sZW5ndGggLSAxIF0udGltZTtcbiAgfVxuXG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yIG9mIGEgW1tDdXJ2ZV1dLlxuICAgKiBAcGFyYW0gYXV0b21hdG9uIFBhcmVudCBhdXRvbWF0b25cbiAgICogQHBhcmFtIGRhdGEgRGF0YSBvZiB0aGUgY3VydmVcbiAgICovXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggYXV0b21hdG9uOiBBdXRvbWF0b24sIGRhdGE6IFNlcmlhbGl6ZWRDdXJ2ZSApIHtcbiAgICB0aGlzLl9fYXV0b21hdG9uID0gYXV0b21hdG9uO1xuXG4gICAgdGhpcy5kZXNlcmlhbGl6ZSggZGF0YSApO1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWQgYSBzZXJpYWxpemVkIGRhdGEgb2YgYSBjdXJ2ZS5cbiAgICogQHBhcmFtIGRhdGEgRGF0YSBvZiBhIGN1cnZlXG4gICAqL1xuICBwdWJsaWMgZGVzZXJpYWxpemUoIGRhdGE6IFNlcmlhbGl6ZWRDdXJ2ZSApOiB2b2lkIHtcbiAgICB0aGlzLl9fbm9kZXMgPSBkYXRhLm5vZGVzLm1hcCggKCBub2RlICkgPT4gKCB7XG4gICAgICB0aW1lOiBub2RlWyAwIF0gPz8gMC4wLFxuICAgICAgdmFsdWU6IG5vZGVbIDEgXSA/PyAwLjAsXG4gICAgICBpblRpbWU6IG5vZGVbIDIgXSA/PyAwLjAsXG4gICAgICBpblZhbHVlOiBub2RlWyAzIF0gPz8gMC4wLFxuICAgICAgb3V0VGltZTogbm9kZVsgNCBdID8/IDAuMCxcbiAgICAgIG91dFZhbHVlOiBub2RlWyA1IF0gPz8gMC4wLFxuICAgIH0gKSApO1xuXG4gICAgdGhpcy5fX2Z4cyA9IFtdO1xuICAgIGRhdGEuZnhzPy5mb3JFYWNoKCAoIGZ4ICkgPT4ge1xuICAgICAgaWYgKCBmeC5ieXBhc3MgKSB7IHJldHVybjsgfVxuICAgICAgdGhpcy5fX2Z4cy5wdXNoKCB7XG4gICAgICAgIHRpbWU6IGZ4LnRpbWUgPz8gMC4wLFxuICAgICAgICBsZW5ndGg6IGZ4Lmxlbmd0aCA/PyAwLjAsXG4gICAgICAgIHJvdzogZngucm93ID8/IDAsXG4gICAgICAgIGRlZjogZnguZGVmLFxuICAgICAgICBwYXJhbXM6IGZ4LnBhcmFtc1xuICAgICAgfSApO1xuICAgIH0gKTtcblxuICAgIHRoaXMucHJlY2FsYygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFByZWNhbGN1bGF0ZSB2YWx1ZSBvZiBzYW1wbGVzLlxuICAgKi9cbiAgcHVibGljIHByZWNhbGMoKTogdm9pZCB7XG4gICAgdGhpcy5fX3ZhbHVlcyA9IG5ldyBGbG9hdDMyQXJyYXkoXG4gICAgICBNYXRoLmNlaWwoIHRoaXMuX19hdXRvbWF0b24ucmVzb2x1dGlvbiAqIHRoaXMubGVuZ3RoICkgKyAxXG4gICAgKTtcblxuICAgIHRoaXMuX19nZW5lcmF0ZUN1cnZlKCk7XG4gICAgdGhpcy5fX2FwcGx5RnhzKCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIHRoZSB2YWx1ZSBvZiBzcGVjaWZpZWQgdGltZSBwb2ludC5cbiAgICogQHBhcmFtIHRpbWUgVGltZSBhdCB0aGUgcG9pbnQgeW91IHdhbnQgdG8gZ3JhYiB0aGUgdmFsdWUuXG4gICAqIEByZXR1cm5zIFJlc3VsdCB2YWx1ZVxuICAgKi9cbiAgcHVibGljIGdldFZhbHVlKCB0aW1lOiBudW1iZXIgKTogbnVtYmVyIHtcbiAgICBpZiAoIHRpbWUgPCAwLjAgKSB7XG4gICAgICAvLyBjbGFtcCBsZWZ0XG4gICAgICByZXR1cm4gdGhpcy5fX3ZhbHVlc1sgMCBdO1xuXG4gICAgfSBlbHNlIGlmICggdGhpcy5sZW5ndGggPD0gdGltZSApIHtcbiAgICAgIC8vIGNsYW1wIHJpZ2h0XG4gICAgICByZXR1cm4gdGhpcy5fX3ZhbHVlc1sgdGhpcy5fX3ZhbHVlcy5sZW5ndGggLSAxIF07XG5cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gZmV0Y2ggdHdvIHZhbHVlcyB0aGVuIGRvIHRoZSBsaW5lYXIgaW50ZXJwb2xhdGlvblxuICAgICAgY29uc3QgaW5kZXggPSB0aW1lICogdGhpcy5fX2F1dG9tYXRvbi5yZXNvbHV0aW9uO1xuICAgICAgY29uc3QgaW5kZXhpID0gTWF0aC5mbG9vciggaW5kZXggKTtcbiAgICAgIGNvbnN0IGluZGV4ZiA9IGluZGV4ICUgMS4wO1xuXG4gICAgICBjb25zdCB2MCA9IHRoaXMuX192YWx1ZXNbIGluZGV4aSBdO1xuICAgICAgY29uc3QgdjEgPSB0aGlzLl9fdmFsdWVzWyBpbmRleGkgKyAxIF07XG5cbiAgICAgIGNvbnN0IHYgPSB2MCArICggdjEgLSB2MCApICogaW5kZXhmO1xuXG4gICAgICByZXR1cm4gdjtcblxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgZmlyc3Qgc3RlcCBvZiB7QGxpbmsgcHJlY2FsY306IGdlbmVyYXRlIGEgY3VydmUgb3V0IG9mIG5vZGVzLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fZ2VuZXJhdGVDdXJ2ZSgpOiB2b2lkIHtcbiAgICBsZXQgbm9kZVRhaWwgPSB0aGlzLl9fbm9kZXNbIDAgXTtcbiAgICBsZXQgaVRhaWwgPSAwO1xuICAgIGZvciAoIGxldCBpTm9kZSA9IDA7IGlOb2RlIDwgdGhpcy5fX25vZGVzLmxlbmd0aCAtIDE7IGlOb2RlICsrICkge1xuICAgICAgY29uc3Qgbm9kZTAgPSBub2RlVGFpbDtcbiAgICAgIG5vZGVUYWlsID0gdGhpcy5fX25vZGVzWyBpTm9kZSArIDEgXTtcbiAgICAgIGNvbnN0IGkwID0gaVRhaWw7XG4gICAgICBpVGFpbCA9IE1hdGguZmxvb3IoIG5vZGVUYWlsLnRpbWUgKiB0aGlzLl9fYXV0b21hdG9uLnJlc29sdXRpb24gKTtcblxuICAgICAgdGhpcy5fX3ZhbHVlc1sgaTAgXSA9IG5vZGUwLnZhbHVlO1xuICAgICAgZm9yICggbGV0IGkgPSBpMCArIDE7IGkgPD0gaVRhaWw7IGkgKysgKSB7XG4gICAgICAgIGNvbnN0IHRpbWUgPSBpIC8gdGhpcy5fX2F1dG9tYXRvbi5yZXNvbHV0aW9uO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGJlemllckVhc2luZyggbm9kZTAsIG5vZGVUYWlsLCB0aW1lICk7XG4gICAgICAgIHRoaXMuX192YWx1ZXNbIGkgXSA9IHZhbHVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoIGxldCBpID0gaVRhaWwgKyAxOyBpIDwgdGhpcy5fX3ZhbHVlcy5sZW5ndGg7IGkgKysgKSB7XG4gICAgICB0aGlzLl9fdmFsdWVzWyBpIF0gPSBub2RlVGFpbC52YWx1ZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVGhlIHNlY29uZCBzdGVwIG9mIHtAbGluayBwcmVjYWxjfTogYXBwbHkgZnhzIHRvIHRoZSBnZW5lcmF0ZWQgY3VydmVzLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fYXBwbHlGeHMoKTogdm9pZCB7XG4gICAgZm9yICggbGV0IGlGeCA9IDA7IGlGeCA8IHRoaXMuX19meHMubGVuZ3RoOyBpRnggKysgKSB7XG4gICAgICBjb25zdCBmeCA9IHRoaXMuX19meHNbIGlGeCBdO1xuICAgICAgY29uc3QgZnhEZWYgPSB0aGlzLl9fYXV0b21hdG9uLmdldEZ4RGVmaW5pdGlvbiggZnguZGVmICk7XG4gICAgICBpZiAoICFmeERlZiApIHtcbiAgICAgICAgaWYgKCBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50JyApIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oIGBObyBzdWNoIGZ4IGRlZmluaXRpb246ICR7IGZ4LmRlZiB9YCApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGF2YWlsYWJsZUVuZCA9IE1hdGgubWluKCB0aGlzLmxlbmd0aCwgZngudGltZSArIGZ4Lmxlbmd0aCApO1xuICAgICAgY29uc3QgaTAgPSBNYXRoLmNlaWwoIHRoaXMuX19hdXRvbWF0b24ucmVzb2x1dGlvbiAqIGZ4LnRpbWUgKTtcbiAgICAgIGNvbnN0IGkxID0gTWF0aC5mbG9vciggdGhpcy5fX2F1dG9tYXRvbi5yZXNvbHV0aW9uICogYXZhaWxhYmxlRW5kICk7XG4gICAgICBpZiAoIGkxIDw9IGkwICkge1xuICAgICAgICBpZiAoIHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAnZGV2ZWxvcG1lbnQnICkge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoICdMZW5ndGggb2YgdGhlIGZ4IHNlY3Rpb24gaXMgYmVpbmcgbmVnYXRpdmUnICk7XG4gICAgICAgIH1cblxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdGVtcExlbmd0aCA9IGkxIC0gaTAgKyAxO1xuICAgICAgY29uc3QgdGVtcFZhbHVlcyA9IG5ldyBGbG9hdDMyQXJyYXkoIHRlbXBMZW5ndGggKTtcblxuICAgICAgY29uc3QgY29udGV4dDogRnhDb250ZXh0ID0ge1xuICAgICAgICBpbmRleDogaTAsXG4gICAgICAgIGkwLFxuICAgICAgICBpMSxcbiAgICAgICAgdGltZTogZngudGltZSxcbiAgICAgICAgdDA6IGZ4LnRpbWUsXG4gICAgICAgIHQxOiBmeC50aW1lICsgZngubGVuZ3RoLFxuICAgICAgICBkZWx0YVRpbWU6IDEuMCAvIHRoaXMuX19hdXRvbWF0b24ucmVzb2x1dGlvbixcbiAgICAgICAgdmFsdWU6IDAuMCxcbiAgICAgICAgcHJvZ3Jlc3M6IDAuMCxcbiAgICAgICAgZWxhcHNlZDogMC4wLFxuICAgICAgICByZXNvbHV0aW9uOiB0aGlzLl9fYXV0b21hdG9uLnJlc29sdXRpb24sXG4gICAgICAgIGxlbmd0aDogZngubGVuZ3RoLFxuICAgICAgICBwYXJhbXM6IGZ4LnBhcmFtcyxcbiAgICAgICAgYXJyYXk6IHRoaXMuX192YWx1ZXMsXG4gICAgICAgIGdldFZhbHVlOiB0aGlzLmdldFZhbHVlLmJpbmQoIHRoaXMgKSxcbiAgICAgICAgaW5pdDogdHJ1ZSxcbiAgICAgICAgc3RhdGU6IHt9XG4gICAgICB9O1xuXG4gICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0ZW1wTGVuZ3RoOyBpICsrICkge1xuICAgICAgICBjb250ZXh0LmluZGV4ID0gaSArIGkwO1xuICAgICAgICBjb250ZXh0LnRpbWUgPSBjb250ZXh0LmluZGV4IC8gdGhpcy5fX2F1dG9tYXRvbi5yZXNvbHV0aW9uO1xuICAgICAgICBjb250ZXh0LnZhbHVlID0gdGhpcy5fX3ZhbHVlc1sgaSArIGkwIF07XG4gICAgICAgIGNvbnRleHQuZWxhcHNlZCA9IGNvbnRleHQudGltZSAtIGZ4LnRpbWU7XG4gICAgICAgIGNvbnRleHQucHJvZ3Jlc3MgPSBjb250ZXh0LmVsYXBzZWQgLyBmeC5sZW5ndGg7XG4gICAgICAgIHRlbXBWYWx1ZXNbIGkgXSA9IGZ4RGVmLmZ1bmMoIGNvbnRleHQgKTtcblxuICAgICAgICBjb250ZXh0LmluaXQgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fX3ZhbHVlcy5zZXQoIHRlbXBWYWx1ZXMsIGkwICk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBDaGFubmVsIH0gZnJvbSAnLi9DaGFubmVsJztcbmltcG9ydCB7IEN1cnZlIH0gZnJvbSAnLi9DdXJ2ZSc7XG5pbXBvcnQgdHlwZSB7IEF1dG9tYXRvbk9wdGlvbnMgfSBmcm9tICcuL3R5cGVzL0F1dG9tYXRvbk9wdGlvbnMnO1xuaW1wb3J0IHR5cGUgeyBDaGFubmVsVXBkYXRlRXZlbnQgfSBmcm9tICcuL3R5cGVzL0NoYW5uZWxVcGRhdGVFdmVudCc7XG5pbXBvcnQgdHlwZSB7IEZ4RGVmaW5pdGlvbiB9IGZyb20gJy4vdHlwZXMvRnhEZWZpbml0aW9uJztcbmltcG9ydCB0eXBlIHsgU2VyaWFsaXplZEF1dG9tYXRvbiB9IGZyb20gJy4vdHlwZXMvU2VyaWFsaXplZEF1dG9tYXRvbic7XG5cbi8qKlxuICogSVQnUyBBVVRPTUFUT04hXG4gKiBAcGFyYW0gZGF0YSBTZXJpYWxpemVkIGRhdGEgb2YgdGhlIGF1dG9tYXRvblxuICogQHBhcmFtIG9wdGlvbnMgT3B0aW9ucyBmb3IgdGhpcyBBdXRvbWF0b24gaW5zdGFuY2VcbiAqL1xuZXhwb3J0IGNsYXNzIEF1dG9tYXRvbiB7XG4gIC8qKlxuICAgKiBJdCByZXR1cm5zIHRoZSBjdXJyZW50IHZhbHVlIG9mIHRoZSBbW0NoYW5uZWxdXSBjYWxsZWQgYG5hbWVgLlxuICAgKiBJZiB0aGUgYG5hbWVgIGlzIGFuIGFycmF5LCBpdCByZXR1cm5zIGEgc2V0IG9mIG5hbWUgOiBjaGFubmVsIGFzIGFuIG9iamVjdCBpbnN0ZWFkLlxuICAgKiBZb3UgY2FuIGFsc28gZ2l2ZSBhIGxpc3RlbmVyIHdoaWNoIHdpbGwgYmUgZXhlY3V0ZWQgd2hlbiB0aGUgY2hhbm5lbCBjaGFuZ2VzIGl0cyB2YWx1ZSAob3B0aW9uYWwpLlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbmFtZSBvZiB0aGUgY2hhbm5lbFxuICAgKiBAcGFyYW0gbGlzdGVuZXIgQSBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgZXhlY3V0ZWQgd2hlbiB0aGUgY2hhbm5lbCBjaGFuZ2VzIGl0cyB2YWx1ZVxuICAgKiBAcmV0dXJucyBDdXJyZW50IHZhbHVlIG9mIHRoZSBjaGFubmVsXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgYXV0byA9IHRoaXMuX19hdXRvLmJpbmQoIHRoaXMgKTtcblxuICAvKipcbiAgICogQ3VydmVzIG9mIHRoZSBhdXRvbWF0b24uXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgY3VydmVzOiBDdXJ2ZVtdID0gW107XG5cbiAgLyoqXG4gICAqIENoYW5uZWxzIG9mIHRoZSB0aW1lbGluZS5cbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBjaGFubmVsczogQ2hhbm5lbFtdID0gW107XG5cbiAgLyoqXG4gICAqIE1hcCBvZiBjaGFubmVscywgbmFtZSB2cy4gY2hhbm5lbCBpdHNlbGYuXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgbWFwTmFtZVRvQ2hhbm5lbCA9IG5ldyBNYXA8c3RyaW5nLCBDaGFubmVsPigpO1xuXG4gIC8qKlxuICAgKiBDdXJyZW50IHRpbWUgb2YgdGhlIGF1dG9tYXRvbi5cbiAgICogQ2FuIGJlIHNldCBieSBbW3VwZGF0ZV1dLCBiZSByZXRyaWV2ZWQgYnkgW1tnZXQgdGltZV1dLCBiZSB1c2VkIGJ5IFtbYXV0b11dXG4gICAqL1xuICBwcm90ZWN0ZWQgX190aW1lOiBudW1iZXIgPSAwLjA7XG5cbiAgLyoqXG4gICAqIFZlcnNpb24gb2YgdGhlIGF1dG9tYXRvbi5cbiAgICovXG4gIHByb3RlY3RlZCBfX3ZlcnNpb246IHN0cmluZyA9IHByb2Nlc3MuZW52LlZFUlNJT04hO1xuXG4gIC8qKlxuICAgKiBSZXNvbHV0aW9uIG9mIHRoZSB0aW1lbGluZS5cbiAgICovXG4gIHByb3RlY3RlZCBfX3Jlc29sdXRpb246IG51bWJlciA9IDEwMDA7XG5cbiAgLyoqXG4gICAqIEEgbWFwIG9mIGZ4IGRlZmluaXRpb25zLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fZnhEZWZpbml0aW9uczogeyBbIG5hbWU6IHN0cmluZyBdOiBGeERlZmluaXRpb24gfSA9IHt9O1xuXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihcbiAgICBkYXRhOiBTZXJpYWxpemVkQXV0b21hdG9uLFxuICAgIG9wdGlvbnM6IEF1dG9tYXRvbk9wdGlvbnMgPSB7fVxuICApIHtcbiAgICBvcHRpb25zLmZ4RGVmaW5pdGlvbnMgJiYgdGhpcy5hZGRGeERlZmluaXRpb25zKCBvcHRpb25zLmZ4RGVmaW5pdGlvbnMgKTtcbiAgICB0aGlzLmRlc2VyaWFsaXplKCBkYXRhICk7XG4gIH1cblxuICAvKipcbiAgICogQ3VycmVudCB0aW1lIG9mIHRoZSBhdXRvbWF0b24sIHRoYXQgaXMgc2V0IHZpYSBbW3VwZGF0ZV1dLlxuICAgKi9cbiAgcHVibGljIGdldCB0aW1lKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9fdGltZTsgfVxuXG4gIC8qKlxuICAgKiBWZXJzaW9uIG9mIHRoZSBhdXRvbWF0b24uXG4gICAqL1xuICBwdWJsaWMgZ2V0IHZlcnNpb24oKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMuX192ZXJzaW9uOyB9XG5cbiAgLyoqXG4gICAqIFJlc29sdXRpb24gPSBTYW1wbGluZyBwb2ludCBwZXIgc2Vjb25kLlxuICAgKi9cbiAgcHVibGljIGdldCByZXNvbHV0aW9uKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9fcmVzb2x1dGlvbjsgfVxuXG4gIC8qKlxuICAgKiBMb2FkIHNlcmlhbGl6ZWQgYXV0b21hdG9uIGRhdGEuXG4gICAqIEBwYXJhbSBkYXRhIFNlcmlhbGl6ZWQgb2JqZWN0IGNvbnRhaW5zIGF1dG9tYXRvbiBkYXRhLlxuICAgKi9cbiAgcHVibGljIGRlc2VyaWFsaXplKCBkYXRhOiBTZXJpYWxpemVkQXV0b21hdG9uICk6IHZvaWQge1xuICAgIHRoaXMuX19yZXNvbHV0aW9uID0gZGF0YS5yZXNvbHV0aW9uO1xuXG4gICAgdGhpcy5jdXJ2ZXMuc3BsaWNlKCAwICk7XG4gICAgdGhpcy5jdXJ2ZXMucHVzaChcbiAgICAgIC4uLmRhdGEuY3VydmVzLm1hcCggKCBkYXRhICkgPT4gbmV3IEN1cnZlKCB0aGlzLCBkYXRhICkgKVxuICAgICk7XG5cbiAgICB0aGlzLm1hcE5hbWVUb0NoYW5uZWwuY2xlYXIoKTtcblxuICAgIHRoaXMuY2hhbm5lbHMuc3BsaWNlKCAwICk7XG4gICAgdGhpcy5jaGFubmVscy5wdXNoKFxuICAgICAgLi4uZGF0YS5jaGFubmVscy5tYXAoICggWyBuYW1lLCBkYXRhIF0gKSA9PiB7XG4gICAgICAgIGNvbnN0IGNoYW5uZWwgPSBuZXcgQ2hhbm5lbCggdGhpcywgZGF0YSApO1xuXG4gICAgICAgIGlmICggcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdkZXZlbG9wbWVudCcgKSB7XG4gICAgICAgICAgaWYgKCB0aGlzLm1hcE5hbWVUb0NoYW5uZWwuaGFzKCBuYW1lICkgKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oIGBEdXBsaWNhdGVkIGNoYW5uZWw6ICR7IG5hbWUgfWAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm1hcE5hbWVUb0NoYW5uZWwuc2V0KCBuYW1lLCBjaGFubmVsICk7XG4gICAgICAgIHJldHVybiBjaGFubmVsO1xuICAgICAgfSApXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgZnggZGVmaW5pdGlvbnMuXG4gICAqIEBwYXJhbSBmeERlZmluaXRpb25zIEEgbWFwIG9mIGlkIC0gZnggZGVmaW5pdGlvblxuICAgKi9cbiAgcHVibGljIGFkZEZ4RGVmaW5pdGlvbnMoIGZ4RGVmaW5pdGlvbnM6IHsgWyBpZDogc3RyaW5nIF06IEZ4RGVmaW5pdGlvbiB9ICk6IHZvaWQge1xuICAgIE9iamVjdC5lbnRyaWVzKCBmeERlZmluaXRpb25zICkuZm9yRWFjaCggKCBbIGlkLCBmeERlZiBdICkgPT4ge1xuICAgICAgaWYgKCB0eXBlb2YgZnhEZWYuZnVuYyA9PT0gJ2Z1bmN0aW9uJyApIHsgLy8gaWdub3JlIHVucmVsYXRlZCBlbnRyaWVzXG4gICAgICAgIGlmICggcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdkZXZlbG9wbWVudCcgKSB7XG4gICAgICAgICAgaWYgKCB0aGlzLl9fZnhEZWZpbml0aW9uc1sgaWQgXSAhPSBudWxsICkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCBgT3ZlcndyaXRpbmcgdGhlIGV4aXN0aW5nIGZ4IGRlZmluaXRpb246ICR7IGlkIH1gICk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fX2Z4RGVmaW5pdGlvbnNbIGlkIF0gPSBmeERlZjtcbiAgICAgIH1cbiAgICB9ICk7XG5cbiAgICB0aGlzLnByZWNhbGNBbGwoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBmeCBkZWZpbml0aW9uLlxuICAgKiBJZiBpdCBjYW4ndCBmaW5kIHRoZSBkZWZpbml0aW9uLCBpdCByZXR1cm5zIGBudWxsYCBpbnN0ZWFkLlxuICAgKiBAcGFyYW0gaWQgVW5pcXVlIGlkIGZvciB0aGUgRnggZGVmaW5pdGlvblxuICAgKi9cbiAgcHVibGljIGdldEZ4RGVmaW5pdGlvbiggaWQ6IHN0cmluZyApOiBGeERlZmluaXRpb24gfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fX2Z4RGVmaW5pdGlvbnNbIGlkIF0gfHwgbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBjdXJ2ZS5cbiAgICogQHBhcmFtIGluZGV4IEFuIGluZGV4IG9mIHRoZSBjdXJ2ZVxuICAgKi9cbiAgcHVibGljIGdldEN1cnZlKCBpbmRleDogbnVtYmVyICk6IEN1cnZlIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuY3VydmVzWyBpbmRleCBdIHx8IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogUHJlY2FsY3VsYXRlIGFsbCBjdXJ2ZXMuXG4gICAqL1xuICBwdWJsaWMgcHJlY2FsY0FsbCgpOiB2b2lkIHtcbiAgICBPYmplY3QudmFsdWVzKCB0aGlzLmN1cnZlcyApLmZvckVhY2goICggY3VydmUgKSA9PiBjdXJ2ZS5wcmVjYWxjKCkgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgaW50ZXJuYWwgc3RhdGVzIG9mIGNoYW5uZWxzLlxuICAgKiAqKkNhbGwgdGhpcyBtZXRob2Qgd2hlbiB5b3Ugc2VlayB0aGUgdGltZS4qKlxuICAgKi9cbiAgcHVibGljIHJlc2V0KCk6IHZvaWQge1xuICAgIE9iamVjdC52YWx1ZXMoIHRoaXMuY2hhbm5lbHMgKS5mb3JFYWNoKCAoIGNoYW5uZWwgKSA9PiBjaGFubmVsLnJlc2V0KCkgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIGVudGlyZSBhdXRvbWF0b24uXG4gICAqICoqWW91IG1heSB3YW50IHRvIGNhbGwgdGhpcyBpbiB5b3VyIHVwZGF0ZSBsb29wLioqXG4gICAqIEBwYXJhbSB0aW1lIEN1cnJlbnQgdGltZVxuICAgKi9cbiAgcHVibGljIHVwZGF0ZSggdGltZTogbnVtYmVyICk6IHZvaWQge1xuICAgIGNvbnN0IHQgPSBNYXRoLm1heCggdGltZSwgMC4wICk7XG5cbiAgICAvLyBjYWNoZSB0aGUgdGltZVxuICAgIHRoaXMuX190aW1lID0gdDtcblxuICAgIC8vIGdyYWIgdGhlIGN1cnJlbnQgdmFsdWUgZm9yIGVhY2ggY2hhbm5lbHNcbiAgICB0aGlzLmNoYW5uZWxzLmZvckVhY2goICggY2hhbm5lbCApID0+IHtcbiAgICAgIGNoYW5uZWwudXBkYXRlKCB0aGlzLl9fdGltZSApO1xuICAgIH0gKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NpZ25lZCB0byB7QGxpbmsgQXV0b21hdG9uI2F1dG99IG9uIGl0cyBpbml0aWFsaXplIHBoYXNlLlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbmFtZSBvZiB0aGUgY2hhbm5lbFxuICAgKiBAcGFyYW0gbGlzdGVuZXIgQSBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgZXhlY3V0ZWQgd2hlbiB0aGUgY2hhbm5lbCBjaGFuZ2VzIGl0cyB2YWx1ZVxuICAgKiBAcmV0dXJucyBDdXJyZW50IHZhbHVlIG9mIHRoZSBjaGFubmVsXG4gICAqL1xuICBwcm90ZWN0ZWQgX19hdXRvKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBsaXN0ZW5lcj86ICggZXZlbnQ6IENoYW5uZWxVcGRhdGVFdmVudCApID0+IHZvaWRcbiAgKTogbnVtYmVyIHtcbiAgICBjb25zdCBjaGFubmVsID0gdGhpcy5tYXBOYW1lVG9DaGFubmVsLmdldCggbmFtZSApO1xuXG4gICAgaWYgKCBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50JyApIHtcbiAgICAgIGlmICggIWNoYW5uZWwgKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvciggYE5vIHN1Y2ggY2hhbm5lbDogJHsgbmFtZSB9YCApO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICggbGlzdGVuZXIgKSB7XG4gICAgICBjaGFubmVsIS5zdWJzY3JpYmUoIGxpc3RlbmVyICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNoYW5uZWwhLmN1cnJlbnRWYWx1ZTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBR0E7OztNQUdhLFdBQVc7Ozs7OztJQTZEdEIsWUFBb0IsU0FBb0IsRUFBRSxJQUEyQjtRQUNuRSxJQUFJLENBQUMsV0FBVyxHQUFHLFNBQVMsQ0FBQztRQUU3QixJQUFJLENBQUMsV0FBVyxDQUFFLElBQUksQ0FBRSxDQUFDO0tBQzFCOzs7O0lBYkQsSUFBVyxHQUFHO1FBQ1osT0FBTyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7S0FDaEM7SUFhTSxRQUFRLENBQUUsSUFBWTtRQUMzQixJQUFLLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLEVBQUc7WUFDdkMsT0FBTyxHQUFHLENBQUM7U0FDWjtRQUVELElBQUssSUFBSSxDQUFDLEtBQUssRUFBRztZ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
