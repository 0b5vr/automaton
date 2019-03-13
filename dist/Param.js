"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var cubic_bezier_1 = require("./cubic-bezier");
/**
 * It represents a param of Automaton.
 * It's `automaton.nogui.js` version and also base class for {@link ParamWithGUI}
 * @param automaton Parent automaton
 * @param data Data of the param
 */
var Param = /** @class */ (function () {
    function Param(automaton, data) {
        /**
         * List of bezier node.
         */
        this.__nodes = [];
        /**
         * List of fx sections.
         */
        this.__fxs = [];
        /**
         * A cache of last calculated value.
         */
        this.__lastValue = 0.0;
        /**
         * Will be used for calculation of {@link Param#__lastValue}.
         */
        this.__lastTime = 0.0;
        this.__automaton = automaton;
        this.__values = new Float32Array(this.__automaton.resolution * this.__automaton.length + 1);
        data && this.load(data);
    }
    /**
     * Load a param data.
     * @param data Data of param
     */
    Param.prototype.load = function (data) {
        this.__nodes = data.nodes;
        this.__fxs = data.fxs;
        this.precalc();
    };
    /**
     * Precalculate value of samples.
     */
    Param.prototype.precalc = function () {
        for (var iNode = 0; iNode < this.__nodes.length - 1; iNode++) {
            var node0 = this.__nodes[iNode];
            var node1 = this.__nodes[iNode + 1];
            var i0 = Math.floor(node0.time * this.__automaton.resolution);
            var i1 = Math.floor(node1.time * this.__automaton.resolution);
            this.__values[i0] = node0.value;
            for (var i = i0 + 1; i <= i1; i++) {
                var time = i / this.__automaton.resolution;
                var value = cubic_bezier_1.cubicBezier(node0, node1, time);
                this.__values[i] = value;
            }
        }
        for (var iFx = 0; iFx < this.__fxs.length; iFx++) {
            var fx = this.__fxs[iFx];
            if (fx.bypass) {
                continue;
            }
            var fxDef = this.__automaton.getFxDefinition(fx.def);
            if (!fxDef) {
                continue;
            }
            var i0 = Math.ceil(this.__automaton.resolution * fx.time);
            var i1 = Math.floor(this.__automaton.resolution * (fx.time + fx.length));
            var tempValues = new Float32Array(i1 - i0);
            var tempLength = tempValues.length;
            var context = {
                i: i0,
                index: i0,
                i0: i0,
                i1: i1,
                t: fx.time,
                time: fx.time,
                t0: fx.time,
                t1: fx.time + fx.length,
                dt: 1.0 / this.__automaton.resolution,
                deltaTime: 1.0 / this.__automaton.resolution,
                v: 0.0,
                value: 0.0,
                p: 0.0,
                progress: 0.0,
                resolution: this.__automaton.resolution,
                length: fx.length,
                params: fx.params,
                array: this.__values,
                getValue: this.getValue.bind(this),
                init: true,
                state: {}
            };
            for (var i = 0; i < tempLength; i++) {
                context.i = context.index = i + i0;
                context.t = context.time = context.i / this.__automaton.resolution;
                context.v = context.value = this.__values[i + i0];
                context.p = context.progress = (context.t - fx.time) / fx.length;
                tempValues[i] = fxDef.func(context);
                context.init = false;
            }
            this.__values.set(tempValues, i0);
        }
    };
    /**
     * Return the value of specified time point.
     * @param time Time at the point you want to grab the value.
     * If it is not given, use current time of parent automaton instead
     * @returns Result value
     */
    Param.prototype.getValue = function (time) {
        if (time === void 0) { time = this.__automaton.time; }
        if (time === this.__lastTime) { // use the buffer!
            return this.__lastValue;
        }
        var newTime = time;
        if (this.__automaton.isLoop) {
            newTime = newTime - Math.floor(newTime / this.__automaton.length) * this.__automaton.length;
        }
        if (newTime <= 0.0) { // left clamp
            return this.__values[0];
        }
        else if (this.__automaton.length <= newTime) { // right clamp
            return this.__values[this.__values.length - 1];
        }
        else { // fetch two value then do linear interpolation
            var index = newTime * this.__automaton.resolution;
            var indexi = Math.floor(index);
            var indexf = index % 1.0;
            var v0 = this.__values[indexi];
            var v1 = this.__values[indexi + 1];
            var v = v0 + (v1 - v0) * indexf;
            // store lastValue
            this.__lastTime = newTime;
            this.__lastValue = v;
            return v;
        }
    };
    return Param;
}());
exports.Param = Param;
