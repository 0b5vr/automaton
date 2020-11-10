/*!
* @fms-cat/automaton v3.1.0
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
        this.__version = '3.1.0';
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

export default Automaton;
export { Automaton, Channel, ChannelItem, Curve };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b21hdG9uLm1vZHVsZS5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL0NoYW5uZWxJdGVtLnRzIiwiLi4vc3JjL0NoYW5uZWwudHMiLCIuLi9zcmMvdXRpbHMvYmV6aWVyRWFzaW5nLnRzIiwiLi4vc3JjL0N1cnZlLnRzIiwiLi4vc3JjL0F1dG9tYXRvbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBdXRvbWF0b24sIEN1cnZlIH0gZnJvbSAnLic7XG5pbXBvcnQgdHlwZSB7IFNlcmlhbGl6ZWRDaGFubmVsSXRlbSB9IGZyb20gJy4vdHlwZXMvU2VyaWFsaXplZENoYW5uZWxJdGVtJztcblxuLyoqXG4gKiBSZXByZXNlbnRzIGFuIGl0ZW0gb2YgYSBbW0NoYW5uZWxdXS5cbiAqL1xuZXhwb3J0IGNsYXNzIENoYW5uZWxJdGVtIHtcbiAgLyoqXG4gICAqIFRoZSBwYXJlbnQgYXV0b21hdG9uLlxuICAgKi9cbiAgcHJvdGVjdGVkIHJlYWRvbmx5IF9fYXV0b21hdG9uOiBBdXRvbWF0b247XG5cbiAgLyoqXG4gICAqIEJlZ2lubmluZyB0aW1lcG9pbnQgb2YgdGhlIGl0ZW0uXG4gICAqL1xuICBwdWJsaWMgdGltZSE6IG51bWJlcjtcblxuICAvKipcbiAgICogTGVuZ3RoIG9mIHRoZSBpdGVtLlxuICAgKi9cbiAgcHVibGljIGxlbmd0aCE6IG51bWJlcjtcblxuICAvKipcbiAgICogVmFsdWUgb2YgdGhlIGl0ZW0uXG4gICAqL1xuICBwdWJsaWMgdmFsdWUhOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgcmVzZXQgY2hhbm5lbHMgdmFsdWUgdG8gemVybyBhdCB0aGUgZW5kIG9mIHRoaXMgaXRlbSBvciBub3QuXG4gICAqL1xuICBwdWJsaWMgcmVzZXQ/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBUaGlzIHdpbGwgb25seSBtYWtlIHNlbnNlIHdoZW4ge0BsaW5rIGN1cnZlfSBpcyBzcGVjaWZpZWQuXG4gICAqIFRoZSB0aW1lIG9mZnNldCBvZiB0aGUgaXRlbS5cbiAgICovXG4gIHB1YmxpYyBvZmZzZXQhOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoaXMgd2lsbCBvbmx5IG1ha2Ugc2Vuc2Ugd2hlbiB7QGxpbmsgY3VydmV9IGlzIHNwZWNpZmllZC5cbiAgICogVGhlIHNwZWVkIHJhdGUgb2YgdGhlIGl0ZW0uXG4gICAqL1xuICBwdWJsaWMgc3BlZWQhOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoaXMgd2lsbCBvbmx5IG1ha2Ugc2Vuc2Ugd2hlbiB7QGxpbmsgY3VydmV9IGlzIHNwZWNpZmllZC5cbiAgICogVGhlIHNjYWxlIG9mIHRoZSBpdGVtIGluIHRoZSB2YWx1ZSBheGlzLlxuICAgKi9cbiAgcHVibGljIGFtcCE6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIGN1cnZlIG9mIHRoZSBpdGVtLlxuICAgKi9cbiAgcHVibGljIGN1cnZlPzogQ3VydmU7XG5cbiAgLyoqXG4gICAqIEVuZGluZyB0aW1lcG9pbnQgb2YgdGhlIGl0ZW0uXG4gICAqL1xuICBwdWJsaWMgZ2V0IGVuZCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLnRpbWUgKyB0aGlzLmxlbmd0aDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RvciBvZiB0aGUgW1tDaGFubmVsSXRlbV1dLlxuICAgKiBAcGFyYW0gYXV0b21hdG9uIFBhcmVudCBhdXRvbWF0b25cbiAgICogQHBhcmFtIGRhdGEgRGF0YSBvZiB0aGUgaXRlbVxuICAgKi9cbiAgcHVibGljIGNvbnN0cnVjdG9yKCBhdXRvbWF0b246IEF1dG9tYXRvbiwgZGF0YTogU2VyaWFsaXplZENoYW5uZWxJdGVtICkge1xuICAgIHRoaXMuX19hdXRvbWF0b24gPSBhdXRvbWF0b247XG5cbiAgICB0aGlzLmRlc2VyaWFsaXplKCBkYXRhICk7XG4gIH1cblxuICBwdWJsaWMgZ2V0VmFsdWUoIHRpbWU6IG51bWJlciApOiBudW1iZXIge1xuICAgIGlmICggdGhpcy5yZXNldCAmJiB0aGlzLmxlbmd0aCA8PSB0aW1lICkge1xuICAgICAgcmV0dXJuIDAuMDtcbiAgICB9XG5cbiAgICBpZiAoIHRoaXMuY3VydmUgKSB7XG4gICAgICBjb25zdCB0ID0gdGhpcy5vZmZzZXQhICsgdGltZSAqIHRoaXMuc3BlZWQhO1xuICAgICAgcmV0dXJuIHRoaXMudmFsdWUgKyB0aGlzLmFtcCAqIHRoaXMuY3VydmUuZ2V0VmFsdWUoIHQgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMudmFsdWU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERlc2VyaWFsaXplIGEgc2VyaWFsaXplZCBkYXRhIG9mIGl0ZW0gZnJvbSBbW1NlcmlhbGl6ZWRDaGFubmVsSXRlbV1dLlxuICAgKiBAcGFyYW0gZGF0YSBBIHNlcmlhbGl6ZWQgaXRlbS5cbiAgICovXG4gIHB1YmxpYyBkZXNlcmlhbGl6ZSggZGF0YTogU2VyaWFsaXplZENoYW5uZWxJdGVtICk6IHZvaWQge1xuICAgIHRoaXMudGltZSA9IGRhdGEudGltZSA/PyAwLjA7XG4gICAgdGhpcy5sZW5ndGggPSBkYXRhLmxlbmd0aCA/PyAwLjA7XG4gICAgdGhpcy52YWx1ZSA9IGRhdGEudmFsdWUgPz8gMC4wO1xuICAgIHRoaXMub2Zmc2V0ID0gZGF0YS5vZmZzZXQgPz8gMC4wO1xuICAgIHRoaXMuc3BlZWQgPSBkYXRhLnNwZWVkID8/IDEuMDtcbiAgICB0aGlzLmFtcCA9IGRhdGEuYW1wID8/IDEuMDtcbiAgICB0aGlzLnJlc2V0ID0gZGF0YS5yZXNldDtcbiAgICBpZiAoIGRhdGEuY3VydmUgIT0gbnVsbCApIHtcbiAgICAgIHRoaXMuY3VydmUgPSB0aGlzLl9fYXV0b21hdG9uLmdldEN1cnZlKCBkYXRhLmN1cnZlICkhO1xuICAgICAgdGhpcy5sZW5ndGggPSBkYXRhLmxlbmd0aCA/PyB0aGlzLmN1cnZlLmxlbmd0aCA/PyAwLjA7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBBdXRvbWF0b24gfSBmcm9tICcuL0F1dG9tYXRvbic7XG5pbXBvcnQgeyBDaGFubmVsSXRlbSB9IGZyb20gJy4vQ2hhbm5lbEl0ZW0nO1xuaW1wb3J0IHR5cGUgeyBDaGFubmVsVXBkYXRlRXZlbnQgfSBmcm9tICcuL3R5cGVzL0NoYW5uZWxVcGRhdGVFdmVudCc7XG5pbXBvcnQgdHlwZSB7IFNlcmlhbGl6ZWRDaGFubmVsIH0gZnJvbSAnLi90eXBlcy9TZXJpYWxpemVkQ2hhbm5lbCc7XG5cbi8qKlxuICogSXQgcmVwcmVzZW50cyBhIGNoYW5uZWwgb2YgQXV0b21hdG9uLlxuICovXG5leHBvcnQgY2xhc3MgQ2hhbm5lbCB7XG4gIC8qKlxuICAgKiBUaGUgcGFyZW50IGF1dG9tYXRvbi5cbiAgICovXG4gIHByb3RlY3RlZCBfX2F1dG9tYXRvbjogQXV0b21hdG9uO1xuXG4gIC8qKlxuICAgKiBMaXN0IG9mIGNoYW5uZWwgaXRlbXMuXG4gICAqL1xuICBwcm90ZWN0ZWQgX19pdGVtczogQ2hhbm5lbEl0ZW1bXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBBIGNhY2hlIG9mIGxhc3QgY2FsY3VsYXRlZCB2YWx1ZS5cbiAgICovXG4gIHByb3RlY3RlZCBfX3ZhbHVlOiBudW1iZXIgPSAwLjA7XG5cbiAgLyoqXG4gICAqIFRoZSB0aW1lIHRoYXQgd2FzIHVzZWQgZm9yIHRoZSBjYWxjdWxhdGlvbiBvZiBbW19fbGFzdFZhbHVlXV0uXG4gICAqL1xuICBwcm90ZWN0ZWQgX190aW1lOiBudW1iZXIgPSAtSW5maW5pdHk7XG5cbiAgLyoqXG4gICAqIFRoZSBpbmRleCBvZiBbW19faXRlbXNdXSBpdCBzaG91bGQgZXZhbHVhdGUgbmV4dC5cbiAgICovXG4gIHByb3RlY3RlZCBfX2hlYWQ6IG51bWJlciA9IDA7XG5cbiAgLyoqXG4gICAqIEFuIGFycmF5IG9mIGxpc3RlbmVycy5cbiAgICovXG4gIHByb3RlY3RlZCBfX2xpc3RlbmVyczogQXJyYXk8KCBldmVudDogQ2hhbm5lbFVwZGF0ZUV2ZW50ICkgPT4gdm9pZD4gPSBbXTtcblxuICAvKipcbiAgICogQ29uc3RydWN0b3Igb2YgdGhlIFtbQ2hhbm5lbF1dLlxuICAgKiBAcGFyYW0gYXV0b21hdG9uIFBhcmVudCBhdXRvbWF0b25cbiAgICogQHBhcmFtIGRhdGEgRGF0YSBvZiB0aGUgY2hhbm5lbFxuICAgKi9cbiAgcHVibGljIGNvbnN0cnVjdG9yKCBhdXRvbWF0b246IEF1dG9tYXRvbiwgZGF0YTogU2VyaWFsaXplZENoYW5uZWwgKSB7XG4gICAgdGhpcy5fX2F1dG9tYXRvbiA9IGF1dG9tYXRvbjtcblxuICAgIHRoaXMuZGVzZXJpYWxpemUoIGRhdGEgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIGNhY2hlIG9mIGxhc3QgY2FsY3VsYXRlZCB2YWx1ZS5cbiAgICovXG4gIHB1YmxpYyBnZXQgY3VycmVudFZhbHVlKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9fdmFsdWU7IH1cblxuICAvKipcbiAgICogVGhlIHRpbWUgdGhhdCB3YXMgdXNlZCBmb3IgdGhlIGNhbGN1bGF0aW9uIG9mIFtbX19sYXN0VmFsdWVdXS5cbiAgICovXG4gIHB1YmxpYyBnZXQgY3VycmVudFRpbWUoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX190aW1lOyB9XG5cbiAgLyoqXG4gICAqIExvYWQgYSBzZXJpYWxpemVkIGRhdGEgb2YgYSBjaGFubmVsLlxuICAgKiBAcGFyYW0gZGF0YSBEYXRhIG9mIGEgY2hhbm5lbFxuICAgKi9cbiAgcHVibGljIGRlc2VyaWFsaXplKCBkYXRhOiBTZXJpYWxpemVkQ2hhbm5lbCApOiB2b2lkIHtcbiAgICB0aGlzLl9faXRlbXMgPSBkYXRhLml0ZW1zLm1hcCggKCBpdGVtICkgPT4gbmV3IENoYW5uZWxJdGVtKCB0aGlzLl9fYXV0b21hdG9uLCBpdGVtICkgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgaW50ZXJuYWwgc3RhdGVzLlxuICAgKiBDYWxsIHRoaXMgbWV0aG9kIHdoZW4geW91IHNlZWsgdGhlIHRpbWUuXG4gICAqL1xuICBwdWJsaWMgcmVzZXQoKTogdm9pZCB7XG4gICAgdGhpcy5fX3RpbWUgPSAtSW5maW5pdHk7XG4gICAgdGhpcy5fX3ZhbHVlID0gMDtcbiAgICB0aGlzLl9faGVhZCA9IDA7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGEgbmV3IGxpc3RlbmVyIHRoYXQgcmVjZWl2ZXMgYSBbW0NoYW5uZWxVcGRhdGVFdmVudF1dIHdoZW4gYW4gdXBkYXRlIGlzIGhhcHBlbmVkLlxuICAgKiBAcGFyYW0gbGlzdGVuZXIgQSBzdWJzY3JpYmluZyBsaXN0ZW5lclxuICAgKi9cbiAgcHVibGljIHN1YnNjcmliZSggbGlzdGVuZXI6ICggZXZlbnQ6IENoYW5uZWxVcGRhdGVFdmVudCApID0+IHZvaWQgKTogdm9pZCB7XG4gICAgdGhpcy5fX2xpc3RlbmVycy5wdXNoKCBsaXN0ZW5lciApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiB0aGUgdmFsdWUgb2Ygc3BlY2lmaWVkIHRpbWUgcG9pbnQuXG4gICAqIEBwYXJhbSB0aW1lIFRpbWUgYXQgdGhlIHBvaW50IHlvdSB3YW50IHRvIGdyYWIgdGhlIHZhbHVlLlxuICAgKiBAcmV0dXJucyBSZXN1bHQgdmFsdWVcbiAgICovXG4gIHB1YmxpYyBnZXRWYWx1ZSggdGltZTogbnVtYmVyICk6IG51bWJlciB7XG4gICAgbGV0IG5leHQgPSB0aGlzLl9faXRlbXMuZmluZEluZGV4KCAoIGl0ZW0gKSA9PiAoIHRpbWUgPCBpdGVtLnRpbWUgKSApO1xuXG4gICAgLy8gaXQncyB0aGUgZmlyc3Qgb25lIVxuICAgIGlmICggbmV4dCA9PT0gMCApIHtcbiAgICAgIHJldHVybiAwLjA7XG4gICAgfVxuXG4gICAgLy8gaXQncyB0aGUgbGFzdCBvbmUhXG4gICAgaWYgKCBuZXh0ID09PSAtMSApIHtcbiAgICAgIG5leHQgPSB0aGlzLl9faXRlbXMubGVuZ3RoO1xuICAgIH1cblxuICAgIGNvbnN0IGl0ZW0gPSB0aGlzLl9faXRlbXNbIG5leHQgLSAxIF07XG4gICAgaWYgKCBpdGVtLmVuZCA8IHRpbWUgKSB7XG4gICAgICByZXR1cm4gaXRlbS5nZXRWYWx1ZSggaXRlbS5sZW5ndGggKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGl0ZW0uZ2V0VmFsdWUoIHRpbWUgLSBpdGVtLnRpbWUgKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVGhpcyBtZXRob2QgaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBieSBbW0F1dG9tYXRvbi51cGRhdGVdXS5cbiAgICogQHBhcmFtIHRpbWUgVGhlIGN1cnJlbnQgdGltZSBvZiB0aGUgcGFyZW50IFtbQXV0b21hdG9uXV1cbiAgICogQHJldHVybnMgd2hldGhlciB0aGUgdmFsdWUgaGFzIGJlZW4gY2hhbmdlZCBvciBub3RcbiAgICovXG4gIHB1YmxpYyB1cGRhdGUoIHRpbWU6IG51bWJlciApOiB2b2lkIHtcbiAgICBsZXQgdmFsdWUgPSB0aGlzLl9fdmFsdWU7XG4gICAgY29uc3QgcHJldlRpbWUgPSB0aGlzLl9fdGltZTtcblxuICAgIGZvciAoIGxldCBpID0gdGhpcy5fX2hlYWQ7IGkgPCB0aGlzLl9faXRlbXMubGVuZ3RoOyBpICsrICkge1xuICAgICAgY29uc3QgaXRlbSA9IHRoaXMuX19pdGVtc1sgaSBdO1xuICAgICAgY29uc3QgeyB0aW1lOiBiZWdpbiwgZW5kLCBsZW5ndGggfSA9IGl0ZW07XG4gICAgICBsZXQgZWxhcHNlZCA9IHRpbWUgLSBiZWdpbjtcblxuICAgICAgaWYgKCBlbGFwc2VkIDwgMC4wICkge1xuICAgICAgICBicmVhaztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBwcm9ncmVzczogbnVtYmVyO1xuICAgICAgICBsZXQgaW5pdDogdHJ1ZSB8IHVuZGVmaW5lZDtcbiAgICAgICAgbGV0IHVuaW5pdDogdHJ1ZSB8IHVuZGVmaW5lZDtcblxuICAgICAgICBpZiAoIGxlbmd0aCA8PSBlbGFwc2VkICkge1xuICAgICAgICAgIGVsYXBzZWQgPSBsZW5ndGg7XG4gICAgICAgICAgcHJvZ3Jlc3MgPSAxLjA7XG4gICAgICAgICAgdW5pbml0ID0gdHJ1ZTtcblxuICAgICAgICAgIGlmICggaSA9PT0gdGhpcy5fX2hlYWQgKSB7XG4gICAgICAgICAgICB0aGlzLl9faGVhZCArKztcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcHJvZ3Jlc3MgPSBsZW5ndGggIT09IDAuMFxuICAgICAgICAgICAgPyBlbGFwc2VkIC8gbGVuZ3RoXG4gICAgICAgICAgICA6IDEuMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggcHJldlRpbWUgPCBiZWdpbiApIHtcbiAgICAgICAgICBpbml0ID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhbHVlID0gaXRlbS5nZXRWYWx1ZSggZWxhcHNlZCApO1xuXG4gICAgICAgIHRoaXMuX19saXN0ZW5lcnMuZm9yRWFjaCggKCBsaXN0ZW5lciApID0+IGxpc3RlbmVyKCB7XG4gICAgICAgICAgdGltZSxcbiAgICAgICAgICBlbGFwc2VkLFxuICAgICAgICAgIGJlZ2luLFxuICAgICAgICAgIGVuZCxcbiAgICAgICAgICBsZW5ndGgsXG4gICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgcHJvZ3Jlc3MsXG4gICAgICAgICAgaW5pdCxcbiAgICAgICAgICB1bmluaXQsXG4gICAgICAgIH0gKSApO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX190aW1lID0gdGltZTtcbiAgICB0aGlzLl9fdmFsdWUgPSB2YWx1ZTtcbiAgfVxufVxuIiwiaW1wb3J0IHR5cGUgeyBCZXppZXJOb2RlIH0gZnJvbSAnLi4vdHlwZXMvQmV6aWVyTm9kZSc7XG5cbmludGVyZmFjZSBDdWJpY0JlemllckNvbnRyb2xQb2ludHMge1xuICBwMDogbnVtYmVyO1xuICBwMTogbnVtYmVyO1xuICBwMjogbnVtYmVyO1xuICBwMzogbnVtYmVyO1xufVxuXG5jb25zdCBORVdUT05fSVRFUiA9IDQ7XG5jb25zdCBORVdUT05fRVBTSUxPTiA9IDAuMDAxO1xuY29uc3QgU1VCRElWX0lURVIgPSAxMDtcbmNvbnN0IFNVQkRJVl9FUFNJTE9OID0gMC4wMDAwMDE7XG5jb25zdCBUQUJMRV9TSVpFID0gMjE7XG5cbmNvbnN0IF9fY2FjaGU6IG51bWJlcltdID0gW107XG5cbmZ1bmN0aW9uIGNsYW1wKCB4OiBudW1iZXIsIG1pbjogbnVtYmVyLCBtYXg6IG51bWJlciApOiBudW1iZXIge1xuICByZXR1cm4gTWF0aC5taW4oIE1hdGgubWF4KCB4LCBtaW4gKSwgbWF4ICk7XG59XG5cbi8qXG4gKiAoMS10KSgxLXQpKDEtdCkgYTAgPSAoMS0ydCt0dCkoMS10KSBhMFxuICogICAgICAgICAgICAgICAgICAgID0gKDEtdC0ydCsydHQrdHQtdHR0KSBhMFxuICogICAgICAgICAgICAgICAgICAgID0gKDEtM3QrM3R0LXR0dCkgYTBcbiAqXG4gKiAzKDEtdCkoMS10KXQgYTEgPSAzKDEtMnQrdHQpdCBhMVxuICogICAgICAgICAgICAgICAgID0gKDN0LTZ0dCszdHR0KSBhMVxuICpcbiAqIDMoMS10KXR0IGEyID0gKDN0dC0zdHR0KSBhMlxuICpcbiAqIHR0dCBhM1xuICpcbiAqIChhMy0zYTIrM2ExLWEwKSB0dHQgKyAoM2EyLTZhMSszYTApIHR0ICsgKDNhMS0zYTApIHQgKyBhMFxuICovXG5cbmZ1bmN0aW9uIEEoIGNwczogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzICk6IG51bWJlciB7XG4gIHJldHVybiBjcHMucDMgLSAzLjAgKiBjcHMucDIgKyAzLjAgKiBjcHMucDEgLSBjcHMucDA7XG59XG5cbmZ1bmN0aW9uIEIoIGNwczogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzICk6IG51bWJlciB7XG4gIHJldHVybiAzLjAgKiBjcHMucDIgLSA2LjAgKiBjcHMucDEgKyAzLjAgKiBjcHMucDA7XG59XG5cbmZ1bmN0aW9uIEMoIGNwczogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzICk6IG51bWJlciB7XG4gIHJldHVybiAzLjAgKiBjcHMucDEgLSAzLjAgKiBjcHMucDA7XG59XG5cbmZ1bmN0aW9uIGN1YmljQmV6aWVyKCB0OiBudW1iZXIsIGNwczogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzICk6IG51bWJlciB7XG4gIHJldHVybiAoICggQSggY3BzICkgKiB0ICsgQiggY3BzICkgKSAqIHQgKyBDKCBjcHMgKSApICogdCArIGNwcy5wMDtcbn1cblxuZnVuY3Rpb24gZGVsdGFDdWJpY0JlemllciggdDogbnVtYmVyLCBjcHM6IEN1YmljQmV6aWVyQ29udHJvbFBvaW50cyApOiBudW1iZXIge1xuICByZXR1cm4gKCAzLjAgKiBBKCBjcHMgKSAqIHQgKyAyLjAgKiBCKCBjcHMgKSApICogdCArIEMoIGNwcyApO1xufVxuXG5mdW5jdGlvbiBzdWJkaXYoIHg6IG51bWJlciwgYTogbnVtYmVyLCBiOiBudW1iZXIsIGNwczogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzICk6IG51bWJlciB7XG4gIGxldCBjYW5kaWRhdGVYID0gMDtcbiAgbGV0IHQgPSAwO1xuXG4gIGZvciAoIGxldCBpID0gMDsgaSA8IFNVQkRJVl9JVEVSOyBpICsrICkge1xuICAgIHQgPSBhICsgKCBiIC0gYSApIC8gMi4wO1xuICAgIGNhbmRpZGF0ZVggPSBjdWJpY0JlemllciggdCwgY3BzICkgLSB4O1xuICAgICggMC4wIDwgY2FuZGlkYXRlWCApID8gKCBiID0gdCApIDogKCBhID0gdCApO1xuICAgIGlmICggU1VCRElWX0VQU0lMT04gPCBNYXRoLmFicyggY2FuZGlkYXRlWCApICkgeyBicmVhazsgfVxuICB9XG5cbiAgcmV0dXJuIHQ7XG59XG5cbmZ1bmN0aW9uIG5ld3RvbiggeDogbnVtYmVyLCB0OiBudW1iZXIsIGNwczogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzICk6IG51bWJlciB7XG4gIGZvciAoIGxldCBpID0gMDsgaSA8IE5FV1RPTl9JVEVSOyBpICsrICkge1xuICAgIGNvbnN0IGQgPSBkZWx0YUN1YmljQmV6aWVyKCB0LCBjcHMgKTtcbiAgICBpZiAoIGQgPT09IDAuMCApIHsgcmV0dXJuIHQ7IH1cbiAgICBjb25zdCBjeCA9IGN1YmljQmV6aWVyKCB0LCBjcHMgKSAtIHg7XG4gICAgdCAtPSBjeCAvIGQ7XG4gIH1cblxuICByZXR1cm4gdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJhd0JlemllckVhc2luZyhcbiAgY3BzeDogQ3ViaWNCZXppZXJDb250cm9sUG9pbnRzLFxuICBjcHN5OiBDdWJpY0JlemllckNvbnRyb2xQb2ludHMsXG4gIHg6IG51bWJlclxuKTogbnVtYmVyIHtcbiAgaWYgKCB4IDw9IGNwc3gucDAgKSB7IHJldHVybiBjcHN5LnAwOyB9IC8vIGNsYW1wZWRcbiAgaWYgKCBjcHN4LnAzIDw9IHggKSB7IHJldHVybiBjcHN5LnAzOyB9IC8vIGNsYW1wZWRcblxuICBjcHN4LnAxID0gY2xhbXAoIGNwc3gucDEsIGNwc3gucDAsIGNwc3gucDMgKTtcbiAgY3BzeC5wMiA9IGNsYW1wKCBjcHN4LnAyLCBjcHN4LnAwLCBjcHN4LnAzICk7XG5cbiAgZm9yICggbGV0IGkgPSAwOyBpIDwgVEFCTEVfU0laRTsgaSArKyApIHtcbiAgICBfX2NhY2hlWyBpIF0gPSBjdWJpY0JlemllciggaSAvICggVEFCTEVfU0laRSAtIDEuMCApLCBjcHN4ICk7XG4gIH1cblxuICBsZXQgc2FtcGxlID0gMDtcbiAgZm9yICggbGV0IGkgPSAxOyBpIDwgVEFCTEVfU0laRTsgaSArKyApIHtcbiAgICBzYW1wbGUgPSBpIC0gMTtcbiAgICBpZiAoIHggPCBfX2NhY2hlWyBpIF0gKSB7IGJyZWFrOyB9XG4gIH1cblxuICBjb25zdCBkaXN0ID0gKCB4IC0gX19jYWNoZVsgc2FtcGxlIF0gKSAvICggX19jYWNoZVsgc2FtcGxlICsgMSBdIC0gX19jYWNoZVsgc2FtcGxlIF0gKTtcbiAgbGV0IHQgPSAoIHNhbXBsZSArIGRpc3QgKSAvICggVEFCTEVfU0laRSAtIDEgKTtcbiAgY29uc3QgZCA9IGRlbHRhQ3ViaWNCZXppZXIoIHQsIGNwc3ggKSAvICggY3BzeC5wMyAtIGNwc3gucDAgKTtcblxuICBpZiAoIE5FV1RPTl9FUFNJTE9OIDw9IGQgKSB7XG4gICAgdCA9IG5ld3RvbiggeCwgdCwgY3BzeCApO1xuICB9IGVsc2UgaWYgKCBkICE9PSAwLjAgKSB7XG4gICAgdCA9IHN1YmRpdiggeCwgKCBzYW1wbGUgKSAvICggVEFCTEVfU0laRSAtIDEgKSwgKCBzYW1wbGUgKyAxLjAgKSAvICggVEFCTEVfU0laRSAtIDEgKSwgY3BzeCApO1xuICB9XG5cbiAgcmV0dXJuIGN1YmljQmV6aWVyKCB0LCBjcHN5ICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBiZXppZXJFYXNpbmcoIG5vZGUwOiBCZXppZXJOb2RlLCBub2RlMTogQmV6aWVyTm9kZSwgdGltZTogbnVtYmVyICk6IG51bWJlciB7XG4gIHJldHVybiByYXdCZXppZXJFYXNpbmcoXG4gICAge1xuICAgICAgcDA6IG5vZGUwLnRpbWUsXG4gICAgICBwMTogbm9kZTAudGltZSArICggbm9kZTAub3V0LnRpbWUgKSxcbiAgICAgIHAyOiBub2RlMS50aW1lICsgKCBub2RlMS5pbi50aW1lICksXG4gICAgICBwMzogbm9kZTEudGltZVxuICAgIH0sXG4gICAge1xuICAgICAgcDA6IG5vZGUwLnZhbHVlLFxuICAgICAgcDE6IG5vZGUwLnZhbHVlICsgKCBub2RlMC5vdXQudmFsdWUgKSxcbiAgICAgIHAyOiBub2RlMS52YWx1ZSArICggbm9kZTEuaW4udmFsdWUgKSxcbiAgICAgIHAzOiBub2RlMS52YWx1ZVxuICAgIH0sXG4gICAgdGltZVxuICApO1xufVxuIiwiaW1wb3J0IHsgQXV0b21hdG9uIH0gZnJvbSAnLi9BdXRvbWF0b24nO1xuaW1wb3J0IHsgYmV6aWVyRWFzaW5nIH0gZnJvbSAnLi91dGlscy9iZXppZXJFYXNpbmcnO1xuaW1wb3J0IHR5cGUgeyBCZXppZXJOb2RlIH0gZnJvbSAnLi90eXBlcy9CZXppZXJOb2RlJztcbmltcG9ydCB0eXBlIHsgRnhDb250ZXh0IH0gZnJvbSAnLi90eXBlcy9GeERlZmluaXRpb24nO1xuaW1wb3J0IHR5cGUgeyBGeFNlY3Rpb24gfSBmcm9tICcuL3R5cGVzL0Z4U2VjdGlvbic7XG5pbXBvcnQgdHlwZSB7IFNlcmlhbGl6ZWRDdXJ2ZSB9IGZyb20gJy4vdHlwZXMvU2VyaWFsaXplZEN1cnZlJztcblxuLyoqXG4gKiBJdCByZXByZXNlbnRzIGEgY3VydmUgb2YgQXV0b21hdG9uLlxuICovXG5leHBvcnQgY2xhc3MgQ3VydmUge1xuICAvKipcbiAgICogVGhlIHBhcmVudCBhdXRvbWF0b24uXG4gICAqL1xuICBwcm90ZWN0ZWQgX19hdXRvbWF0b246IEF1dG9tYXRvbjtcblxuICAvKipcbiAgICogQW4gYXJyYXkgb2YgcHJlY2FsY3VsYXRlZCB2YWx1ZS5cbiAgICogSXRzIGxlbmd0aCBpcyBzYW1lIGFzIGBjdXJ2ZS5fX2F1dG9tYXRvbi5yZXNvbHV0aW9uICogY3VydmUuX19hdXRvbWF0b24ubGVuZ3RoICsgMWAuXG4gICovXG4gIHByb3RlY3RlZCBfX3ZhbHVlcyE6IEZsb2F0MzJBcnJheTtcblxuICAvKipcbiAgICogTGlzdCBvZiBiZXppZXIgbm9kZS5cbiAgICovXG4gIHByb3RlY3RlZCBfX25vZGVzOiBCZXppZXJOb2RlW10gPSBbXTtcblxuICAvKipcbiAgICogTGlzdCBvZiBmeCBzZWN0aW9ucy5cbiAgICovXG4gIHByb3RlY3RlZCBfX2Z4czogRnhTZWN0aW9uW10gPSBbXTtcblxuICAvKipcbiAgICogVGhlIGxlbmd0aCBvZiB0aGlzIGN1cnZlLlxuICAgKi9cbiAgcHVibGljIGdldCBsZW5ndGgoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fX25vZGVzWyB0aGlzLl9fbm9kZXMubGVuZ3RoIC0gMSBdLnRpbWU7XG4gIH1cblxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RvciBvZiBhIFtbQ3VydmVdXS5cbiAgICogQHBhcmFtIGF1dG9tYXRvbiBQYXJlbnQgYXV0b21hdG9uXG4gICAqIEBwYXJhbSBkYXRhIERhdGEgb2YgdGhlIGN1cnZlXG4gICAqL1xuICBwdWJsaWMgY29uc3RydWN0b3IoIGF1dG9tYXRvbjogQXV0b21hdG9uLCBkYXRhOiBTZXJpYWxpemVkQ3VydmUgKSB7XG4gICAgdGhpcy5fX2F1dG9tYXRvbiA9IGF1dG9tYXRvbjtcblxuICAgIHRoaXMuZGVzZXJpYWxpemUoIGRhdGEgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkIGEgc2VyaWFsaXplZCBkYXRhIG9mIGEgY3VydmUuXG4gICAqIEBwYXJhbSBkYXRhIERhdGEgb2YgYSBjdXJ2ZVxuICAgKi9cbiAgcHVibGljIGRlc2VyaWFsaXplKCBkYXRhOiBTZXJpYWxpemVkQ3VydmUgKTogdm9pZCB7XG4gICAgdGhpcy5fX25vZGVzID0gZGF0YS5ub2Rlcy5tYXAoICggbm9kZSApID0+ICgge1xuICAgICAgdGltZTogbm9kZS50aW1lID8/IDAuMCxcbiAgICAgIHZhbHVlOiBub2RlLnZhbHVlID8/IDAuMCxcbiAgICAgIGluOiBub2RlLmluID8/IHsgdGltZTogMC4wLCB2YWx1ZTogMC4wIH0sXG4gICAgICBvdXQ6IG5vZGUub3V0ID8/IHsgdGltZTogMC4wLCB2YWx1ZTogMC4wIH1cbiAgICB9ICkgKTtcblxuICAgIHRoaXMuX19meHMgPSBbXTtcbiAgICBkYXRhLmZ4cz8uZm9yRWFjaCggKCBmeCApID0+IHtcbiAgICAgIGlmICggZnguYnlwYXNzICkgeyByZXR1cm47IH1cbiAgICAgIHRoaXMuX19meHMucHVzaCgge1xuICAgICAgICB0aW1lOiBmeC50aW1lID8/IDAuMCxcbiAgICAgICAgbGVuZ3RoOiBmeC5sZW5ndGggPz8gMC4wLFxuICAgICAgICByb3c6IGZ4LnJvdyA/PyAwLFxuICAgICAgICBkZWY6IGZ4LmRlZixcbiAgICAgICAgcGFyYW1zOiBmeC5wYXJhbXNcbiAgICAgIH0gKTtcbiAgICB9ICk7XG5cbiAgICB0aGlzLnByZWNhbGMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmVjYWxjdWxhdGUgdmFsdWUgb2Ygc2FtcGxlcy5cbiAgICovXG4gIHB1YmxpYyBwcmVjYWxjKCk6IHZvaWQge1xuICAgIHRoaXMuX192YWx1ZXMgPSBuZXcgRmxvYXQzMkFycmF5KFxuICAgICAgTWF0aC5jZWlsKCB0aGlzLl9fYXV0b21hdG9uLnJlc29sdXRpb24gKiB0aGlzLmxlbmd0aCApICsgMVxuICAgICk7XG5cbiAgICB0aGlzLl9fZ2VuZXJhdGVDdXJ2ZSgpO1xuICAgIHRoaXMuX19hcHBseUZ4cygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiB0aGUgdmFsdWUgb2Ygc3BlY2lmaWVkIHRpbWUgcG9pbnQuXG4gICAqIEBwYXJhbSB0aW1lIFRpbWUgYXQgdGhlIHBvaW50IHlvdSB3YW50IHRvIGdyYWIgdGhlIHZhbHVlLlxuICAgKiBAcmV0dXJucyBSZXN1bHQgdmFsdWVcbiAgICovXG4gIHB1YmxpYyBnZXRWYWx1ZSggdGltZTogbnVtYmVyICk6IG51bWJlciB7XG4gICAgaWYgKCB0aW1lIDwgMC4wICkge1xuICAgICAgLy8gY2xhbXAgbGVmdFxuICAgICAgcmV0dXJuIHRoaXMuX192YWx1ZXNbIDAgXTtcblxuICAgIH0gZWxzZSBpZiAoIHRoaXMubGVuZ3RoIDw9IHRpbWUgKSB7XG4gICAgICAvLyBjbGFtcCByaWdodFxuICAgICAgcmV0dXJuIHRoaXMuX192YWx1ZXNbIHRoaXMuX192YWx1ZXMubGVuZ3RoIC0gMSBdO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGZldGNoIHR3byB2YWx1ZXMgdGhlbiBkbyB0aGUgbGluZWFyIGludGVycG9sYXRpb25cbiAgICAgIGNvbnN0IGluZGV4ID0gdGltZSAqIHRoaXMuX19hdXRvbWF0b24ucmVzb2x1dGlvbjtcbiAgICAgIGNvbnN0IGluZGV4aSA9IE1hdGguZmxvb3IoIGluZGV4ICk7XG4gICAgICBjb25zdCBpbmRleGYgPSBpbmRleCAlIDEuMDtcblxuICAgICAgY29uc3QgdjAgPSB0aGlzLl9fdmFsdWVzWyBpbmRleGkgXTtcbiAgICAgIGNvbnN0IHYxID0gdGhpcy5fX3ZhbHVlc1sgaW5kZXhpICsgMSBdO1xuXG4gICAgICBjb25zdCB2ID0gdjAgKyAoIHYxIC0gdjAgKSAqIGluZGV4ZjtcblxuICAgICAgcmV0dXJuIHY7XG5cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVGhlIGZpcnN0IHN0ZXAgb2Yge0BsaW5rIHByZWNhbGN9OiBnZW5lcmF0ZSBhIGN1cnZlIG91dCBvZiBub2Rlcy5cbiAgICovXG4gIHByb3RlY3RlZCBfX2dlbmVyYXRlQ3VydmUoKTogdm9pZCB7XG4gICAgbGV0IG5vZGVUYWlsID0gdGhpcy5fX25vZGVzWyAwIF07XG4gICAgbGV0IGlUYWlsID0gMDtcbiAgICBmb3IgKCBsZXQgaU5vZGUgPSAwOyBpTm9kZSA8IHRoaXMuX19ub2Rlcy5sZW5ndGggLSAxOyBpTm9kZSArKyApIHtcbiAgICAgIGNvbnN0IG5vZGUwID0gbm9kZVRhaWw7XG4gICAgICBub2RlVGFpbCA9IHRoaXMuX19ub2Rlc1sgaU5vZGUgKyAxIF07XG4gICAgICBjb25zdCBpMCA9IGlUYWlsO1xuICAgICAgaVRhaWwgPSBNYXRoLmZsb29yKCBub2RlVGFpbC50aW1lICogdGhpcy5fX2F1dG9tYXRvbi5yZXNvbHV0aW9uICk7XG5cbiAgICAgIHRoaXMuX192YWx1ZXNbIGkwIF0gPSBub2RlMC52YWx1ZTtcbiAgICAgIGZvciAoIGxldCBpID0gaTAgKyAxOyBpIDw9IGlUYWlsOyBpICsrICkge1xuICAgICAgICBjb25zdCB0aW1lID0gaSAvIHRoaXMuX19hdXRvbWF0b24ucmVzb2x1dGlvbjtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBiZXppZXJFYXNpbmcoIG5vZGUwLCBub2RlVGFpbCwgdGltZSApO1xuICAgICAgICB0aGlzLl9fdmFsdWVzWyBpIF0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKCBsZXQgaSA9IGlUYWlsICsgMTsgaSA8IHRoaXMuX192YWx1ZXMubGVuZ3RoOyBpICsrICkge1xuICAgICAgdGhpcy5fX3ZhbHVlc1sgaSBdID0gbm9kZVRhaWwudmFsdWU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBzZWNvbmQgc3RlcCBvZiB7QGxpbmsgcHJlY2FsY306IGFwcGx5IGZ4cyB0byB0aGUgZ2VuZXJhdGVkIGN1cnZlcy5cbiAgICovXG4gIHByb3RlY3RlZCBfX2FwcGx5RnhzKCk6IHZvaWQge1xuICAgIGZvciAoIGxldCBpRnggPSAwOyBpRnggPCB0aGlzLl9fZnhzLmxlbmd0aDsgaUZ4ICsrICkge1xuICAgICAgY29uc3QgZnggPSB0aGlzLl9fZnhzWyBpRnggXTtcbiAgICAgIGNvbnN0IGZ4RGVmID0gdGhpcy5fX2F1dG9tYXRvbi5nZXRGeERlZmluaXRpb24oIGZ4LmRlZiApO1xuICAgICAgaWYgKCAhZnhEZWYgKSB7XG4gICAgICAgIGlmICggcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdkZXZlbG9wbWVudCcgKSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKCBgTm8gc3VjaCBmeCBkZWZpbml0aW9uOiAkeyBmeC5kZWYgfWAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBhdmFpbGFibGVFbmQgPSBNYXRoLm1pbiggdGhpcy5sZW5ndGgsIGZ4LnRpbWUgKyBmeC5sZW5ndGggKTtcbiAgICAgIGNvbnN0IGkwID0gTWF0aC5jZWlsKCB0aGlzLl9fYXV0b21hdG9uLnJlc29sdXRpb24gKiBmeC50aW1lICk7XG4gICAgICBjb25zdCBpMSA9IE1hdGguZmxvb3IoIHRoaXMuX19hdXRvbWF0b24ucmVzb2x1dGlvbiAqIGF2YWlsYWJsZUVuZCApO1xuICAgICAgaWYgKCBpMSA8PSBpMCApIHtcbiAgICAgICAgaWYgKCBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50JyApIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCAnTGVuZ3RoIG9mIHRoZSBmeCBzZWN0aW9uIGlzIGJlaW5nIG5lZ2F0aXZlJyApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHRlbXBMZW5ndGggPSBpMSAtIGkwICsgMTtcbiAgICAgIGNvbnN0IHRlbXBWYWx1ZXMgPSBuZXcgRmxvYXQzMkFycmF5KCB0ZW1wTGVuZ3RoICk7XG5cbiAgICAgIGNvbnN0IGNvbnRleHQ6IEZ4Q29udGV4dCA9IHtcbiAgICAgICAgaW5kZXg6IGkwLFxuICAgICAgICBpMCxcbiAgICAgICAgaTEsXG4gICAgICAgIHRpbWU6IGZ4LnRpbWUsXG4gICAgICAgIHQwOiBmeC50aW1lLFxuICAgICAgICB0MTogZngudGltZSArIGZ4Lmxlbmd0aCxcbiAgICAgICAgZGVsdGFUaW1lOiAxLjAgLyB0aGlzLl9fYXV0b21hdG9uLnJlc29sdXRpb24sXG4gICAgICAgIHZhbHVlOiAwLjAsXG4gICAgICAgIHByb2dyZXNzOiAwLjAsXG4gICAgICAgIGVsYXBzZWQ6IDAuMCxcbiAgICAgICAgcmVzb2x1dGlvbjogdGhpcy5fX2F1dG9tYXRvbi5yZXNvbHV0aW9uLFxuICAgICAgICBsZW5ndGg6IGZ4Lmxlbmd0aCxcbiAgICAgICAgcGFyYW1zOiBmeC5wYXJhbXMsXG4gICAgICAgIGFycmF5OiB0aGlzLl9fdmFsdWVzLFxuICAgICAgICBnZXRWYWx1ZTogdGhpcy5nZXRWYWx1ZS5iaW5kKCB0aGlzICksXG4gICAgICAgIGluaXQ6IHRydWUsXG4gICAgICAgIHN0YXRlOiB7fVxuICAgICAgfTtcblxuICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGVtcExlbmd0aDsgaSArKyApIHtcbiAgICAgICAgY29udGV4dC5pbmRleCA9IGkgKyBpMDtcbiAgICAgICAgY29udGV4dC50aW1lID0gY29udGV4dC5pbmRleCAvIHRoaXMuX19hdXRvbWF0b24ucmVzb2x1dGlvbjtcbiAgICAgICAgY29udGV4dC52YWx1ZSA9IHRoaXMuX192YWx1ZXNbIGkgKyBpMCBdO1xuICAgICAgICBjb250ZXh0LmVsYXBzZWQgPSBjb250ZXh0LnRpbWUgLSBmeC50aW1lO1xuICAgICAgICBjb250ZXh0LnByb2dyZXNzID0gY29udGV4dC5lbGFwc2VkIC8gZngubGVuZ3RoO1xuICAgICAgICB0ZW1wVmFsdWVzWyBpIF0gPSBmeERlZi5mdW5jKCBjb250ZXh0ICk7XG5cbiAgICAgICAgY29udGV4dC5pbml0ID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX192YWx1ZXMuc2V0KCB0ZW1wVmFsdWVzLCBpMCApO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgQ2hhbm5lbCB9IGZyb20gJy4vQ2hhbm5lbCc7XG5pbXBvcnQgeyBDdXJ2ZSB9IGZyb20gJy4vQ3VydmUnO1xuaW1wb3J0IHR5cGUgeyBBdXRvbWF0b25PcHRpb25zIH0gZnJvbSAnLi90eXBlcy9BdXRvbWF0b25PcHRpb25zJztcbmltcG9ydCB0eXBlIHsgQ2hhbm5lbFVwZGF0ZUV2ZW50IH0gZnJvbSAnLi90eXBlcy9DaGFubmVsVXBkYXRlRXZlbnQnO1xuaW1wb3J0IHR5cGUgeyBGeERlZmluaXRpb24gfSBmcm9tICcuL3R5cGVzL0Z4RGVmaW5pdGlvbic7XG5pbXBvcnQgdHlwZSB7IFNlcmlhbGl6ZWRBdXRvbWF0b24gfSBmcm9tICcuL3R5cGVzL1NlcmlhbGl6ZWRBdXRvbWF0b24nO1xuXG4vKipcbiAqIElUJ1MgQVVUT01BVE9OIVxuICogQHBhcmFtIGRhdGEgU2VyaWFsaXplZCBkYXRhIG9mIHRoZSBhdXRvbWF0b25cbiAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgZm9yIHRoaXMgQXV0b21hdG9uIGluc3RhbmNlXG4gKi9cbmV4cG9ydCBjbGFzcyBBdXRvbWF0b24ge1xuICAvKipcbiAgICogSXQgcmV0dXJucyB0aGUgY3VycmVudCB2YWx1ZSBvZiB0aGUgW1tDaGFubmVsXV0gY2FsbGVkIGBuYW1lYC5cbiAgICogSWYgdGhlIGBuYW1lYCBpcyBhbiBhcnJheSwgaXQgcmV0dXJucyBhIHNldCBvZiBuYW1lIDogY2hhbm5lbCBhcyBhbiBvYmplY3QgaW5zdGVhZC5cbiAgICogWW91IGNhbiBhbHNvIGdpdmUgYSBsaXN0ZW5lciB3aGljaCB3aWxsIGJlIGV4ZWN1dGVkIHdoZW4gdGhlIGNoYW5uZWwgY2hhbmdlcyBpdHMgdmFsdWUgKG9wdGlvbmFsKS5cbiAgICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgb2YgdGhlIGNoYW5uZWxcbiAgICogQHBhcmFtIGxpc3RlbmVyIEEgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIGV4ZWN1dGVkIHdoZW4gdGhlIGNoYW5uZWwgY2hhbmdlcyBpdHMgdmFsdWVcbiAgICogQHJldHVybnMgQ3VycmVudCB2YWx1ZSBvZiB0aGUgY2hhbm5lbFxuICAgKi9cbiAgcHVibGljIGF1dG8gPSB0aGlzLl9fYXV0by5iaW5kKCB0aGlzICk7XG5cbiAgLyoqXG4gICAqIEN1cnJlbnQgdGltZSBvZiB0aGUgYXV0b21hdG9uLlxuICAgKiBDYW4gYmUgc2V0IGJ5IFtbdXBkYXRlXV0sIGJlIHJldHJpZXZlZCBieSBbW2dldCB0aW1lXV0sIGJlIHVzZWQgYnkgW1thdXRvXV1cbiAgICovXG4gIHByb3RlY3RlZCBfX3RpbWU6IG51bWJlciA9IDAuMDtcblxuICAvKipcbiAgICogVmVyc2lvbiBvZiB0aGUgYXV0b21hdG9uLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fdmVyc2lvbjogc3RyaW5nID0gcHJvY2Vzcy5lbnYuVkVSU0lPTiE7XG5cbiAgLyoqXG4gICAqIFJlc29sdXRpb24gb2YgdGhlIHRpbWVsaW5lLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fcmVzb2x1dGlvbjogbnVtYmVyID0gMTAwMDtcblxuICAvKipcbiAgICogQ3VydmVzIG9mIHRoZSBhdXRvbWF0b24uXG4gICAqL1xuICBwcm90ZWN0ZWQgX19jdXJ2ZXM6IEN1cnZlW10gPSBbXTtcblxuICAvKipcbiAgICogQ2hhbm5lbHMgb2YgdGhlIHRpbWVsaW5lLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fY2hhbm5lbHM6IHsgWyBuYW1lOiBzdHJpbmcgXTogQ2hhbm5lbCB9ID0ge307XG5cbiAgLyoqXG4gICAqIEEgbWFwIG9mIGZ4IGRlZmluaXRpb25zLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9fZnhEZWZpbml0aW9uczogeyBbIG5hbWU6IHN0cmluZyBdOiBGeERlZmluaXRpb24gfSA9IHt9O1xuXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihcbiAgICBkYXRhOiBTZXJpYWxpemVkQXV0b21hdG9uLFxuICAgIG9wdGlvbnM6IEF1dG9tYXRvbk9wdGlvbnMgPSB7fVxuICApIHtcbiAgICBvcHRpb25zLmZ4RGVmaW5pdGlvbnMgJiYgdGhpcy5hZGRGeERlZmluaXRpb25zKCBvcHRpb25zLmZ4RGVmaW5pdGlvbnMgKTtcbiAgICB0aGlzLmRlc2VyaWFsaXplKCBkYXRhICk7XG4gIH1cblxuICAvKipcbiAgICogQ3VycmVudCB0aW1lIG9mIHRoZSBhdXRvbWF0b24sIHRoYXQgaXMgc2V0IHZpYSBbW3VwZGF0ZV1dLlxuICAgKi9cbiAgcHVibGljIGdldCB0aW1lKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9fdGltZTsgfVxuXG4gIC8qKlxuICAgKiBWZXJzaW9uIG9mIHRoZSBhdXRvbWF0b24uXG4gICAqL1xuICBwdWJsaWMgZ2V0IHZlcnNpb24oKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMuX192ZXJzaW9uOyB9XG5cbiAgLyoqXG4gICAqIFJlc29sdXRpb24gPSBTYW1wbGluZyBwb2ludCBwZXIgc2Vjb25kLlxuICAgKi9cbiAgcHVibGljIGdldCByZXNvbHV0aW9uKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9fcmVzb2x1dGlvbjsgfVxuXG4gIC8qKlxuICAgKiBMb2FkIHNlcmlhbGl6ZWQgYXV0b21hdG9uIGRhdGEuXG4gICAqIEBwYXJhbSBkYXRhIFNlcmlhbGl6ZWQgb2JqZWN0IGNvbnRhaW5zIGF1dG9tYXRvbiBkYXRhLlxuICAgKi9cbiAgcHVibGljIGRlc2VyaWFsaXplKCBkYXRhOiBTZXJpYWxpemVkQXV0b21hdG9uICk6IHZvaWQge1xuICAgIHRoaXMuX19yZXNvbHV0aW9uID0gZGF0YS5yZXNvbHV0aW9uO1xuXG4gICAgdGhpcy5fX2N1cnZlcyA9IGRhdGEuY3VydmVzLm1hcCggKCBkYXRhICkgPT4gbmV3IEN1cnZlKCB0aGlzLCBkYXRhICkgKTtcblxuICAgIGZvciAoIGNvbnN0IG5hbWUgaW4gZGF0YS5jaGFubmVscyApIHtcbiAgICAgIHRoaXMuX19jaGFubmVsc1sgbmFtZSBdID0gbmV3IENoYW5uZWwoIHRoaXMsIGRhdGEuY2hhbm5lbHNbIG5hbWUgXSApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgZnggZGVmaW5pdGlvbnMuXG4gICAqIEBwYXJhbSBmeERlZmluaXRpb25zIEEgbWFwIG9mIGlkIC0gZnggZGVmaW5pdGlvblxuICAgKi9cbiAgcHVibGljIGFkZEZ4RGVmaW5pdGlvbnMoIGZ4RGVmaW5pdGlvbnM6IHsgWyBpZDogc3RyaW5nIF06IEZ4RGVmaW5pdGlvbiB9ICk6IHZvaWQge1xuICAgIE9iamVjdC5lbnRyaWVzKCBmeERlZmluaXRpb25zICkuZm9yRWFjaCggKCBbIGlkLCBmeERlZiBdICkgPT4ge1xuICAgICAgaWYgKCB0eXBlb2YgZnhEZWYuZnVuYyA9PT0gJ2Z1bmN0aW9uJyApIHsgLy8gaWdub3JlIHVucmVsYXRlZCBlbnRyaWVzXG4gICAgICAgIGlmICggcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdkZXZlbG9wbWVudCcgKSB7XG4gICAgICAgICAgaWYgKCB0aGlzLl9fZnhEZWZpbml0aW9uc1sgaWQgXSAhPSBudWxsICkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCBgT3ZlcndyaXRpbmcgdGhlIGV4aXN0aW5nIGZ4IGRlZmluaXRpb246ICR7IGlkIH1gICk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fX2Z4RGVmaW5pdGlvbnNbIGlkIF0gPSBmeERlZjtcbiAgICAgIH1cbiAgICB9ICk7XG5cbiAgICB0aGlzLnByZWNhbGNBbGwoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBmeCBkZWZpbml0aW9uLlxuICAgKiBJZiBpdCBjYW4ndCBmaW5kIHRoZSBkZWZpbml0aW9uLCBpdCByZXR1cm5zIGBudWxsYCBpbnN0ZWFkLlxuICAgKiBAcGFyYW0gaWQgVW5pcXVlIGlkIGZvciB0aGUgRnggZGVmaW5pdGlvblxuICAgKi9cbiAgcHVibGljIGdldEZ4RGVmaW5pdGlvbiggaWQ6IHN0cmluZyApOiBGeERlZmluaXRpb24gfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fX2Z4RGVmaW5pdGlvbnNbIGlkIF0gfHwgbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBjdXJ2ZS5cbiAgICogQHBhcmFtIGluZGV4IEFuIGluZGV4IG9mIHRoZSBjdXJ2ZVxuICAgKi9cbiAgcHVibGljIGdldEN1cnZlKCBpbmRleDogbnVtYmVyICk6IEN1cnZlIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuX19jdXJ2ZXNbIGluZGV4IF0gfHwgbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmVjYWxjdWxhdGUgYWxsIGN1cnZlcy5cbiAgICovXG4gIHB1YmxpYyBwcmVjYWxjQWxsKCk6IHZvaWQge1xuICAgIE9iamVjdC52YWx1ZXMoIHRoaXMuX19jdXJ2ZXMgKS5mb3JFYWNoKCAoIGN1cnZlICkgPT4gY3VydmUucHJlY2FsYygpICk7XG4gIH1cblxuICAvKipcbiAgICogUmVzZXQgdGhlIGludGVybmFsIHN0YXRlcyBvZiBjaGFubmVscy5cbiAgICogKipDYWxsIHRoaXMgbWV0aG9kIHdoZW4geW91IHNlZWsgdGhlIHRpbWUuKipcbiAgICovXG4gIHB1YmxpYyByZXNldCgpOiB2b2lkIHtcbiAgICBPYmplY3QudmFsdWVzKCB0aGlzLl9fY2hhbm5lbHMgKS5mb3JFYWNoKCAoIGNoYW5uZWwgKSA9PiBjaGFubmVsLnJlc2V0KCkgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIGVudGlyZSBhdXRvbWF0b24uXG4gICAqICoqWW91IG1heSB3YW50IHRvIGNhbGwgdGhpcyBpbiB5b3VyIHVwZGF0ZSBsb29wLioqXG4gICAqIEBwYXJhbSB0aW1lIEN1cnJlbnQgdGltZVxuICAgKi9cbiAgcHVibGljIHVwZGF0ZSggdGltZTogbnVtYmVyICk6IHZvaWQge1xuICAgIGNvbnN0IHQgPSBNYXRoLm1heCggdGltZSwgMC4wICk7XG5cbiAgICAvLyBjYWNoZSB0aGUgdGltZVxuICAgIHRoaXMuX190aW1lID0gdDtcblxuICAgIC8vIGdyYWIgdGhlIGN1cnJlbnQgdmFsdWUgZm9yIGVhY2ggY2hhbm5lbHNcbiAgICBmb3IgKCBjb25zdCBjaGFubmVsIG9mIE9iamVjdC52YWx1ZXMoIHRoaXMuX19jaGFubmVscyApICkge1xuICAgICAgY2hhbm5lbC51cGRhdGUoIHRoaXMuX190aW1lICk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFzc2lnbmVkIHRvIHtAbGluayBBdXRvbWF0b24jYXV0b30gb24gaXRzIGluaXRpYWxpemUgcGhhc2UuXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBjaGFubmVsXG4gICAqIEBwYXJhbSBsaXN0ZW5lciBBIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBleGVjdXRlZCB3aGVuIHRoZSBjaGFubmVsIGNoYW5nZXMgaXRzIHZhbHVlXG4gICAqIEByZXR1cm5zIEN1cnJlbnQgdmFsdWUgb2YgdGhlIGNoYW5uZWxcbiAgICovXG4gIHByb3RlY3RlZCBfX2F1dG8oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGxpc3RlbmVyPzogKCBldmVudDogQ2hhbm5lbFVwZGF0ZUV2ZW50ICkgPT4gdm9pZFxuICApOiBudW1iZXIge1xuICAgIGlmICggbGlzdGVuZXIgKSB7XG4gICAgICB0aGlzLl9fY2hhbm5lbHNbIG5hbWUgXS5zdWJzY3JpYmUoIGxpc3RlbmVyICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX19jaGFubmVsc1sgbmFtZSBdLmN1cnJlbnRWYWx1ZTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBR0E7OztNQUdhLFdBQVc7Ozs7OztJQTZEdEIsWUFBb0IsU0FBb0IsRUFBRSxJQUEyQjtRQUNuRSxJQUFJLENBQUMsV0FBVyxHQUFHLFNBQVMsQ0FBQztRQUU3QixJQUFJLENBQUMsV0FBVyxDQUFFLElBQUksQ0FBRSxDQUFDO0tBQzFCOzs7O0lBYkQsSUFBVyxHQUFHO1FBQ1osT0FBTyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7S0FDaEM7SUFhTSxRQUFRLENBQUUsSUFBWTtRQUMzQixJQUFLLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLEVBQUc7WUFDdkMsT0FBTyxHQUFHLENBQUM7U0FDWjtRQUVELElBQUssSUFBSSxDQUFDLEtBQUssRUFBRztZQUNoQixNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTyxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsS0FBTSxDQUFDO1lBQzVDLE9BQU8sSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFFLENBQUMsQ0FBRSxDQUFDO1NBQ3pEO2FBQU07WUFDTCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7U0FDbkI7S0FDRjs7Ozs7SUFNTSxXQUFXLENBQUUsSUFBMkI7O1FBQzdDLElBQUksQ0FBQyxJQUFJLFNBQUcsSUFBSSxDQUFDLElBQUksbUNBQUksR0FBRyxDQUFDO1FBQzdCLElBQUksQ0FBQyxNQUFNLFNBQUcsSUFBSSxDQUFDLE1BQU0sbUNBQUksR0FBRyxDQUFDO1FBQ2pDLElBQUksQ0FBQyxLQUFLLFNBQUcsSUFBSSxDQUFDLEtBQUssbUNBQUksR0FBRyxDQUFDO1FBQy9CLElBQUksQ0FBQyxNQUFNLFNBQUcsSUFBSSxDQUFDLE1BQU0sbUNBQUksR0FBRyxDQUFDO1FBQ2pDLElBQUksQ0FBQyxLQUFLLFNBQUcsSUFBSSxDQUFDLEtBQUssbUNBQUksR0FBRyxDQUFDO1FBQy9CLElBQUksQ0FBQyxHQUFHLFNBQUcsSUFBSSxDQUFDLEdBQUcsbUNBQUksR0FBRyxDQUFDO1FBQzNCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUN4QixJQUFLLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxFQUFHO1lBQ3hCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBRyxDQUFDO1lBQ3RELElBQUksQ0FBQyxNQUFNLGVBQUcsSUFBSSxDQUFDLE1BQU0sbUNBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLG1DQUFJLEdBQUcsQ0FBQztTQUN2RDtLQUNGOzs7QUNqR0g7OztNQUdhLE9BQU87Ozs7OztJQW9DbEIsWUFBb0IsU0FBb0IsRUFBRSxJQUF1Qjs7OztRQTNCdkQsWUFBTyxHQUFrQixFQUFFLENBQUM7Ozs7UUFLNUIsWUFBTyxHQUFXLEdBQUcsQ0FBQzs7OztRQUt0QixXQUFNLEdBQVcsQ0FBQyxRQUFRLENBQUM7Ozs7UUFLM0IsV0FBTSxHQUFXLENBQUMsQ0FBQzs7OztRQUtuQixnQkFBVyxHQUFpRCxFQUFFLENBQUM7UUFRdkUsSUFBSSxDQUFDLFdBQVcsR0FBRyxTQUFTLENBQUM7UUFFN0IsSUFBSSxDQUFDLFdBQVcsQ0FBRSxJQUFJLENBQUUsQ0FBQztLQUMxQjs7OztJQUtELElBQVcsWUFBWSxLQUFhLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFOzs7O0lBSzFELElBQVcsV0FBVyxLQUFhLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFOzs7OztJQU1qRCxXQUFXLENBQUUsSUFBdUI7UUFDekMsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBRSxDQUFFLElBQUksS0FBTSxJQUFJLFdBQVcsQ0FBRSxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBRSxDQUFFLENBQUM7S0FDeEY7Ozs7O0lBTU0sS0FBSztRQUNWLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxRQUFRLENBQUM7UUFDeEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUM7UUFDakIsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7S0FDakI7Ozs7O0lBTU0sU0FBUyxDQUFFLFFBQStDO1FBQy9ELElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFFLFFBQVEsQ0FBRSxDQUFDO0tBQ25DOzs7Ozs7SUFPTSxRQUFRLENBQUUsSUFBWTtRQUMzQixJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBRSxDQUFFLElBQUksTUFBUSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBRSxDQUFFLENBQUM7O1FBR3RFLElBQUssSUFBSSxLQUFLLENBQUMsRUFBRztZQUNoQixPQUFPLEdBQUcsQ0FBQztTQUNaOztRQUdELElBQUssSUFBSSxLQUFLLENBQUMsQ0FBQyxFQUFHO1lBQ2pCLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztTQUM1QjtRQUVELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUUsSUFBSSxHQUFHLENBQUMsQ0FBRSxDQUFDO1FBQ3RDLElBQUssSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLEVBQUc7WUFDckIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFFLElBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQztTQUNyQzthQUFNO1lBQ0wsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFFLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFFLENBQUM7U0FDMUM7S0FDRjs7Ozs7O0lBT00sTUFBTSxDQUFFLElBQVk7UUFDekIsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUN6QixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBRTdCLEtBQU0sSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFHLEVBQUc7WUFDekQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBQztZQUMvQixNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDO1lBQzFDLElBQUksT0FBTyxHQUFHLElBQUksR0FBRyxLQUFLLENBQUM7WUFFM0IsSUFBSyxPQUFPLEdBQUcsR0FBRyxFQUFHO2dCQUNuQixNQUFNO2FBQ1A7aUJBQU07Z0JBQ0wsSUFBSSxRQUFnQixDQUFDO2dCQUNyQixJQUFJLElBQXNCLENBQUM7Z0JBQzNCLElBQUksTUFBd0IsQ0FBQztnQkFFN0IsSUFBSyxNQUFNLElBQUksT0FBTyxFQUFHO29CQUN2QixPQUFPLEdBQUcsTUFBTSxDQUFDO29CQUNqQixRQUFRLEdBQUcsR0FBRyxDQUFDO29CQUNmLE1BQU0sR0FBRyxJQUFJLENBQUM7b0JBRWQsSUFBSyxDQUFDLEtBQUssSUFBSSxDQUFDLE1BQU0sRUFBRzt3QkFDdkIsSUFBSSxDQUFDLE1BQU0sRUFBRyxDQUFDO3FCQUNoQjtpQkFDRjtxQkFBTTtvQkFDTCxRQUFRLEdBQUcsTUFBTSxLQUFLLEdBQUc7MEJBQ3JCLE9BQU8sR0FBRyxNQUFNOzBCQUNoQixHQUFHLENBQUM7aUJBQ1Q7Z0JBRUQsSUFBSyxRQUFRLEdBQUcsS0FBSyxFQUFHO29CQUN0QixJQUFJLEdBQUcsSUFBSSxDQUFDO2lCQUNiO2dCQUVELEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFFLE9BQU8sQ0FBRSxDQUFDO2dCQUVqQyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBRSxDQUFFLFFBQVEsS0FBTSxRQUFRLENBQUU7b0JBQ2xELElBQUk7b0JBQ0osT0FBTztvQkFDUCxLQUFLO29CQUNMLEdBQUc7b0JBQ0gsTUFBTTtvQkFDTixLQUFLO29CQUNMLFFBQVE7b0JBQ1IsSUFBSTtvQkFDSixNQUFNO2lCQUNQLENBQUUsQ0FBRSxDQUFDO2FBQ1A7U0FDRjtRQUVELElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO1FBQ25CLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO0tBQ3RCOzs7QUNoS0gsTUFBTSxXQUFXLEdBQUcsQ0FBQyxDQUFDO0FBQ3RCLE1BQU0sY0FBYyxHQUFHLEtBQUssQ0FBQztBQUM3QixNQUFNLFdBQVcsR0FBRyxFQUFFLENBQUM7QUFDdkIsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDO0FBQ2hDLE1BQU0sVUFBVSxHQUFHLEVBQUUsQ0FBQztBQUV0QixNQUFNLE9BQU8sR0FBYSxFQUFFLENBQUM7QUFFN0IsU0FBUyxLQUFLLENBQUUsQ0FBUyxFQUFFLEdBQVcsRUFBRSxHQUFXO0lBQ2pELE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBRSxJQUFJLENBQUMsR0FBRyxDQUFFLENBQUMsRUFBRSxHQUFHLENBQUUsRUFBRSxHQUFHLENBQUUsQ0FBQztBQUM3QyxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7O0FBZUEsU0FBUyxDQUFDLENBQUUsR0FBNkI7SUFDdkMsT0FBTyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUM7QUFDdkQsQ0FBQztBQUVELFNBQVMsQ0FBQyxDQUFFLEdBQTZCO0lBQ3ZDLE9BQU8sR0FBRyxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUM7QUFDcEQsQ0FBQztBQUVELFNBQVMsQ0FBQyxDQUFFLEdBQTZCO0lBQ3ZDLE9BQU8sR0FBRyxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUM7QUFDckMsQ0FBQztBQUVELFNBQVMsV0FBVyxDQUFFLENBQVMsRUFBRSxHQUE2QjtJQUM1RCxPQUFPLENBQUUsQ0FBRSxDQUFDLENBQUUsR0FBRyxDQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBRSxHQUFHLENBQUUsSUFBSyxDQUFDLEdBQUcsQ0FBQyxDQUFFLEdBQUcsQ0FBRSxJQUFLLENBQUMsR0FBRyxHQUFHLENBQUMsRUFBRSxDQUFDO0FBQ3JFLENBQUM7QUFFRCxTQUFTLGdCQUFnQixDQUFFLENBQVMsRUFBRSxHQUE2QjtJQUNqRSxPQUFPLENBQUUsR0FBRyxHQUFHLENBQUMsQ0FBRSxHQUFHLENBQUUsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBRSxHQUFHLENBQUUsSUFBSyxDQUFDLEdBQUcsQ0FBQyxDQUFFLEdBQUcsQ0FBRSxDQUFDO0FBQ2hFLENBQUM7QUFFRCxTQUFTLE1BQU0sQ0FBRSxDQUFTLEVBQUUsQ0FBUyxFQUFFLENBQVMsRUFBRSxHQUE2QjtJQUM3RSxJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUM7SUFDbkIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBRVYsS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFdBQVcsRUFBRSxDQUFDLEVBQUcsRUFBRztRQUN2QyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSyxHQUFHLENBQUM7UUFDeEIsVUFBVSxHQUFHLFdBQVcsQ0FBRSxDQUFDLEVBQUUsR0FBRyxDQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZDLENBQUUsR0FBRyxHQUFHLFVBQVUsS0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFPLENBQUMsR0FBRyxDQUFDLENBQUUsQ0FBQztRQUM3QyxJQUFLLGNBQWMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFFLFVBQVUsQ0FBRSxFQUFHO1lBQUUsTUFBTTtTQUFFO0tBQzFEO0lBRUQsT0FBTyxDQUFDLENBQUM7QUFDWCxDQUFDO0FBRUQsU0FBUyxNQUFNLENBQUUsQ0FBUyxFQUFFLENBQVMsRUFBRSxHQUE2QjtJQUNsRSxLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsV0FBVyxFQUFFLENBQUMsRUFBRyxFQUFHO1FBQ3ZDLE1BQU0sQ0FBQyxHQUFHLGdCQUFnQixDQUFFLENBQUMsRUFBRSxHQUFHLENBQUUsQ0FBQztRQUNyQyxJQUFLLENBQUMsS0FBSyxHQUFHLEVBQUc7WUFBRSxPQUFPLENBQUMsQ0FBQztTQUFFO1FBQzlCLE1BQU0sRUFBRSxHQUFHLFdBQVcsQ0FBRSxDQUFDLEVBQUUsR0FBRyxDQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3JDLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0tBQ2I7SUFFRCxPQUFPLENBQUMsQ0FBQztBQUNYLENBQUM7U0FFZSxlQUFlLENBQzdCLElBQThCLEVBQzlCLElBQThCLEVBQzlCLENBQVM7SUFFVCxJQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFHO1FBQUUsT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFDO0tBQUU7SUFDdkMsSUFBSyxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBRztRQUFFLE9BQU8sSUFBSSxDQUFDLEVBQUUsQ0FBQztLQUFFO0lBRXZDLElBQUksQ0FBQyxFQUFFLEdBQUcsS0FBSyxDQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFFLENBQUM7SUFDN0MsSUFBSSxDQUFDLEVBQUUsR0FBRyxLQUFLLENBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUUsQ0FBQztJQUU3QyxLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxFQUFFLENBQUMsRUFBRyxFQUFHO1FBQ3RDLE9BQU8sQ0FBRSxDQUFDLENBQUUsR0FBRyxXQUFXLENBQUUsQ0FBQyxJQUFLLFVBQVUsR0FBRyxHQUFHLENBQUUsRUFBRSxJQUFJLENBQUUsQ0FBQztLQUM5RDtJQUVELElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQztJQUNmLEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLEVBQUUsQ0FBQyxFQUFHLEVBQUc7UUFDdEMsTUFBTSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDZixJQUFLLENBQUMsR0FBRyxPQUFPLENBQUUsQ0FBQyxDQUFFLEVBQUc7WUFBRSxNQUFNO1NBQUU7S0FDbkM7SUFFRCxNQUFNLElBQUksR0FBRyxDQUFFLENBQUMsR0FBRyxPQUFPLENBQUUsTUFBTSxDQUFFLEtBQU8sT0FBTyxDQUFFLE1BQU0sR0FBRyxDQUFDLENBQUUsR0FBRyxPQUFPLENBQUUsTUFBTSxDQUFFLENBQUUsQ0FBQztJQUN2RixJQUFJLENBQUMsR0FBRyxDQUFFLE1BQU0sR0FBRyxJQUFJLEtBQU8sVUFBVSxHQUFHLENBQUMsQ0FBRSxDQUFDO0lBQy9DLE1BQU0sQ0FBQyxHQUFHLGdCQUFnQixDQUFFLENBQUMsRUFBRSxJQUFJLENBQUUsSUFBSyxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUUsQ0FBQztJQUU5RCxJQUFLLGNBQWMsSUFBSSxDQUFDLEVBQUc7UUFDekIsQ0FBQyxHQUFHLE1BQU0sQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBRSxDQUFDO0tBQzFCO1NBQU0sSUFBSyxDQUFDLEtBQUssR0FBRyxFQUFHO1FBQ3RCLENBQUMsR0FBRyxNQUFNLENBQUUsQ0FBQyxFQUFFLENBQUUsTUFBTSxLQUFPLFVBQVUsR0FBRyxDQUFDLENBQUUsRUFBRSxDQUFFLE1BQU0sR0FBRyxHQUFHLEtBQU8sVUFBVSxHQUFHLENBQUMsQ0FBRSxFQUFFLElBQUksQ0FBRSxDQUFDO0tBQy9GO0lBRUQsT0FBTyxXQUFXLENBQUUsQ0FBQyxFQUFFLElBQUksQ0FBRSxDQUFDO0FBQ2hDLENBQUM7U0FFZSxZQUFZLENBQUUsS0FBaUIsRUFBRSxLQUFpQixFQUFFLElBQVk7SUFDOUUsT0FBTyxlQUFlLENBQ3BCO1FBQ0UsRUFBRSxFQUFFLEtBQUssQ0FBQyxJQUFJO1FBQ2QsRUFBRSxFQUFFLEtBQUssQ0FBQyxJQUFJLElBQUssS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUU7UUFDbkMsRUFBRSxFQUFFLEtBQUssQ0FBQyxJQUFJLElBQUssS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUU7UUFDbEMsRUFBRSxFQUFFLEtBQUssQ0FBQyxJQUFJO0tBQ2YsRUFDRDtRQUNFLEVBQUUsRUFBRSxLQUFLLENBQUMsS0FBSztRQUNmLEVBQUUsRUFBRSxLQUFLLENBQUMsS0FBSyxJQUFLLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFFO1FBQ3JDLEVBQUUsRUFBRSxLQUFLLENBQUMsS0FBSyxJQUFLLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFFO1FBQ3BDLEVBQUUsRUFBRSxLQUFLLENBQUMsS0FBSztLQUNoQixFQUNELElBQUksQ0FDTCxDQUFDO0FBQ0o7O0FDNUhBOzs7TUFHYSxLQUFLOzs7Ozs7SUFtQ2hCLFlBQW9CLFNBQW9CLEVBQUUsSUFBcUI7Ozs7UUFwQnJELFlBQU8sR0FBaUIsRUFBRSxDQUFDOzs7O1FBSzNCLFVBQUssR0FBZ0IsRUFBRSxDQUFDO1FBZ0JoQyxJQUFJLENBQUMsV0FBVyxHQUFHLFNBQVMsQ0FBQztRQUU3QixJQUFJLENBQUMsV0FBVyxDQUFFLElBQUksQ0FBRSxDQUFDO0tBQzFCOzs7O0lBZEQsSUFBVyxNQUFNO1FBQ2YsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBRSxDQUFDLElBQUksQ0FBQztLQUNyRDs7Ozs7SUFrQk0sV0FBVyxDQUFFLElBQXFCOztRQUN2QyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFFLENBQUUsSUFBSTs7WUFBTSxRQUFFO2dCQUMzQyxJQUFJLFFBQUUsSUFBSSxDQUFDLElBQUksbUNBQUksR0FBRztnQkFDdEIsS0FBSyxRQUFFLElBQUksQ0FBQyxLQUFLLG1DQUFJLEdBQUc7Z0JBQ3hCLEVBQUUsUUFBRSxJQUFJLENBQUMsRUFBRSxtQ0FBSSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRTtnQkFDeEMsR0FBRyxRQUFFLElBQUksQ0FBQyxHQUFHLG1DQUFJLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFO2FBQzNDLEVBQUU7U0FBQSxDQUFFLENBQUM7UUFFTixJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztRQUNoQixNQUFBLElBQUksQ0FBQyxHQUFHLDBDQUFFLE9BQU8sQ0FBRSxDQUFFLEVBQUU7O1lBQ3JCLElBQUssRUFBRSxDQUFDLE1BQU0sRUFBRztnQkFBRSxPQUFPO2FBQUU7WUFDNUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUU7Z0JBQ2YsSUFBSSxRQUFFLEVBQUUsQ0FBQyxJQUFJLG1DQUFJLEdBQUc7Z0JBQ3BCLE1BQU0sUUFBRSxFQUFFLENBQUMsTUFBTSxtQ0FBSSxHQUFHO2dCQUN4QixHQUFHLFFBQUUsRUFBRSxDQUFDLEdBQUcsbUNBQUksQ0FBQztnQkFDaEIsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHO2dCQUNYLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTTthQUNsQixDQUFFLENBQUM7U0FDTCxFQUFHO1FBRUosSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO0tBQ2hCOzs7O0lBS00sT0FBTztRQUNaLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxZQUFZLENBQzlCLElBQUksQ0FBQyxJQUFJLENBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBRSxHQUFHLENBQUMsQ0FDM0QsQ0FBQztRQUVGLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUN2QixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7S0FDbkI7Ozs7OztJQU9NLFFBQVEsQ0FBRSxJQUFZO1FBQzNCLElBQUssSUFBSSxHQUFHLEdBQUcsRUFBRzs7WUFFaEIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFFLENBQUMsQ0FBRSxDQUFDO1NBRTNCO2FBQU0sSUFBSyxJQUFJLENBQUMsTUFBTSxJQUFJLElBQUksRUFBRzs7WUFFaEMsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBRSxDQUFDO1NBRWxEO2FBQU07O1lBRUwsTUFBTSxLQUFLLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDO1lBQ2pELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUUsS0FBSyxDQUFFLENBQUM7WUFDbkMsTUFBTSxNQUFNLEdBQUcsS0FBSyxHQUFHLEdBQUcsQ0FBQztZQUUzQixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFFLE1BQU0sQ0FBRSxDQUFDO1lBQ25DLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUUsTUFBTSxHQUFHLENBQUMsQ0FBRSxDQUFDO1lBRXZDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFFLEVBQUUsR0FBRyxFQUFFLElBQUssTUFBTSxDQUFDO1lBRXBDLE9BQU8sQ0FBQyxDQUFDO1NBRVY7S0FDRjs7OztJQUtTLGVBQWU7UUFDdkIsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBQztRQUNqQyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7UUFDZCxLQUFNLElBQUksS0FBSyxHQUFHLENBQUMsRUFBRSxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRyxFQUFHO1lBQy9ELE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQztZQUN2QixRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBRSxLQUFLLEdBQUcsQ0FBQyxDQUFFLENBQUM7WUFDckMsTUFBTSxFQUFFLEdBQUcsS0FBSyxDQUFDO1lBQ2pCLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFFLFFBQVEsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUUsQ0FBQztZQUVsRSxJQUFJLENBQUMsUUFBUSxDQUFFLEVBQUUsQ0FBRSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7WUFDbEMsS0FBTSxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxFQUFHLEVBQUc7Z0JBQ3ZDLE1BQU0sSUFBSSxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQztnQkFDN0MsTUFBTSxLQUFLLEdBQUcsWUFBWSxDQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFFLENBQUM7Z0JBQ3BELElBQUksQ0FBQyxRQUFRLENBQUUsQ0FBQyxDQUFFLEdBQUcsS0FBSyxDQUFDO2FBQzVCO1NBQ0Y7UUFFRCxLQUFNLElBQUksQ0FBQyxHQUFHLEtBQUssR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRyxFQUFHO1lBQ3hELElBQUksQ0FBQyxRQUFRLENBQUUsQ0FBQyxDQUFFLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQztTQUNyQztLQUNGOzs7O0lBS1MsVUFBVTtRQUNsQixLQUFNLElBQUksR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFHLEVBQUc7WUFDbkQsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBRSxHQUFHLENBQUUsQ0FBQztZQUM3QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBRSxFQUFFLENBQUMsR0FBRyxDQUFFLENBQUM7WUFDekQsSUFBSyxDQUFDLEtBQUssRUFBRztnQkFDa0M7b0JBQzVDLE9BQU8sQ0FBQyxJQUFJLENBQUUsMEJBQTJCLEVBQUUsQ0FBQyxHQUFJLEVBQUUsQ0FBRSxDQUFDO2lCQUN0RDtnQkFFRCxTQUFTO2FBQ1Y7WUFFRCxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFFLENBQUM7WUFDbEUsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBRSxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFFLENBQUM7WUFDOUQsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBRSxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsR0FBRyxZQUFZLENBQUUsQ0FBQztZQUNwRSxJQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUc7Z0JBQ2dDO29CQUM1QyxPQUFPLENBQUMsS0FBSyxDQUFFLDRDQUE0QyxDQUFFLENBQUM7aUJBQy9EO2dCQUVELFNBQVM7YUFDVjtZQUVELE1BQU0sVUFBVSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQy9CLE1BQU0sVUFBVSxHQUFHLElBQUksWUFBWSxDQUFFLFVBQVUsQ0FBRSxDQUFDO1lBRWxELE1BQU0sT0FBTyxHQUFjO2dCQUN6QixLQUFLLEVBQUUsRUFBRTtnQkFDVCxFQUFFO2dCQUNGLEVBQUU7Z0JBQ0YsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJO2dCQUNiLEVBQUUsRUFBRSxFQUFFLENBQUMsSUFBSTtnQkFDWCxFQUFFLEVBQUUsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUMsTUFBTTtnQkFDdkIsU0FBUyxFQUFFLEdBQUcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVU7Z0JBQzVDLEtBQUssRUFBRSxHQUFHO2dCQUNWLFFBQVEsRUFBRSxHQUFHO2dCQUNiLE9BQU8sRUFBRSxHQUFHO2dCQUNaLFVBQVUsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVU7Z0JBQ3ZDLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTTtnQkFDakIsTUFBTSxFQUFFLEVBQUUsQ0FBQyxNQUFNO2dCQUNqQixLQUFLLEVBQUUsSUFBSSxDQUFDLFFBQVE7Z0JBQ3BCLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBRSxJQUFJLENBQUU7Z0JBQ3BDLElBQUksRUFBRSxJQUFJO2dCQUNWLEtBQUssRUFBRSxFQUFFO2FBQ1YsQ0FBQztZQUVGLEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLEVBQUUsQ0FBQyxFQUFHLEVBQUc7Z0JBQ3RDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDdkIsT0FBTyxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDO2dCQUMzRCxPQUFPLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBRSxDQUFDO2dCQUN4QyxPQUFPLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQztnQkFDekMsT0FBTyxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUM7Z0JBQy9DLFVBQVUsQ0FBRSxDQUFDLENBQUUsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFFLE9BQU8sQ0FBRSxDQUFDO2dCQUV4QyxPQUFPLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQzthQUN0QjtZQUVELElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFFLFVBQVUsRUFBRSxFQUFFLENBQUUsQ0FBQztTQUNyQztLQUNGOzs7QUN4TUg7Ozs7O01BS2EsU0FBUztJQTBDcEIsWUFDRSxJQUF5QixFQUN6QixVQUE0QixFQUFFOzs7Ozs7Ozs7UUFuQ3pCLFNBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBRSxJQUFJLENBQUUsQ0FBQzs7Ozs7UUFNN0IsV0FBTSxHQUFXLEdBQUcsQ0FBQzs7OztRQUtyQixjQUFTLEdBQVcsT0FBb0IsQ0FBQzs7OztRQUt6QyxpQkFBWSxHQUFXLElBQUksQ0FBQzs7OztRQUs1QixhQUFRLEdBQVksRUFBRSxDQUFDOzs7O1FBS3ZCLGVBQVUsR0FBa0MsRUFBRSxDQUFDOzs7O1FBSy9DLG9CQUFlLEdBQXVDLEVBQUUsQ0FBQztRQU1qRSxPQUFPLENBQUMsYUFBYSxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBRSxPQUFPLENBQUMsYUFBYSxDQUFFLENBQUM7UUFDeEUsSUFBSSxDQUFDLFdBQVcsQ0FBRSxJQUFJLENBQUUsQ0FBQztLQUMxQjs7OztJQUtELElBQVcsSUFBSSxLQUFhLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFOzs7O0lBS2pELElBQVcsT0FBTyxLQUFhLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFOzs7O0lBS3ZELElBQVcsVUFBVSxLQUFhLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFOzs7OztJQU10RCxXQUFXLENBQUUsSUFBeUI7UUFDM0MsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBRXBDLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUUsQ0FBRSxJQUFJLEtBQU0sSUFBSSxLQUFLLENBQUUsSUFBSSxFQUFFLElBQUksQ0FBRSxDQUFFLENBQUM7UUFFdkUsS0FBTSxNQUFNLElBQUksSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFHO1lBQ2xDLElBQUksQ0FBQyxVQUFVLENBQUUsSUFBSSxDQUFFLEdBQUcsSUFBSSxPQUFPLENBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUUsSUFBSSxDQUFFLENBQUUsQ0FBQztTQUN0RTtLQUNGOzs7OztJQU1NLGdCQUFnQixDQUFFLGFBQStDO1FBQ3RFLE1BQU0sQ0FBQyxPQUFPLENBQUUsYUFBYSxDQUFFLENBQUMsT0FBTyxDQUFFLENBQUUsQ0FBRSxFQUFFLEVBQUUsS0FBSyxDQUFFO1lBQ3RELElBQUssT0FBTyxLQUFLLENBQUMsSUFBSSxLQUFLLFVBQVUsRUFBRztnQkFDUTtvQkFDNUMsSUFBSyxJQUFJLENBQUMsZUFBZSxDQUFFLEVBQUUsQ0FBRSxJQUFJLElBQUksRUFBRzt3QkFDeEMsT0FBTyxDQUFDLElBQUksQ0FBRSwyQ0FBNEMsRUFBRyxFQUFFLENBQUUsQ0FBQztxQkFDbkU7aUJBQ0Y7Z0JBRUQsSUFBSSxDQUFDLGVBQWUsQ0FBRSxFQUFFLENBQUUsR0FBRyxLQUFLLENBQUM7YUFDcEM7U0FDRixDQUFFLENBQUM7UUFFSixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7S0FDbkI7Ozs7OztJQU9NLGVBQWUsQ0FBRSxFQUFVO1FBQ2hDLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBRSxFQUFFLENBQUUsSUFBSSxJQUFJLENBQUM7S0FDM0M7Ozs7O0lBTU0sUUFBUSxDQUFFLEtBQWE7UUFDNUIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFFLEtBQUssQ0FBRSxJQUFJLElBQUksQ0FBQztLQUN2Qzs7OztJQUtNLFVBQVU7UUFDZixNQUFNLENBQUMsTUFBTSxDQUFFLElBQUksQ0FBQyxRQUFRLENBQUUsQ0FBQyxPQUFPLENBQUUsQ0FBRSxLQUFLLEtBQU0sS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFFLENBQUM7S0FDeEU7Ozs7O0lBTU0sS0FBSztRQUNWLE1BQU0sQ0FBQyxNQUFNLENBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxDQUFFLE9BQU8sS0FBTSxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUUsQ0FBQztLQUM1RTs7Ozs7O0lBT00sTUFBTSxDQUFFLElBQVk7UUFDekIsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBRSxJQUFJLEVBQUUsR0FBRyxDQUFFLENBQUM7O1FBR2hDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDOztRQUdoQixLQUFNLE1BQU0sT0FBTyxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBRSxFQUFHO1lBQ3hELE9BQU8sQ0FBQyxNQUFNLENBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDO1NBQy9CO0tBQ0Y7Ozs7Ozs7SUFRUyxNQUFNLENBQ2QsSUFBWSxFQUNaLFFBQWdEO1FBRWhELElBQUssUUFBUSxFQUFHO1lBQ2QsSUFBSSxDQUFDLFVBQVUsQ0FBRSxJQUFJLENBQUUsQ0FBQyxTQUFTLENBQUUsUUFBUSxDQUFFLENBQUM7U0FDL0M7UUFFRCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUUsSUFBSSxDQUFFLENBQUMsWUFBWSxDQUFDO0tBQzdDOzs7Ozs7In0=
