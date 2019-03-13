"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Clock_1 = require("./Clock");
var ClockFrame_1 = require("./ClockFrame");
var ClockRealtime_1 = require("./ClockRealtime");
var eventemitter3_1 = require("eventemitter3");
var Param_1 = require("./Param");
/**
 * IT'S AUTOMATON!
 * It's `automaton.nogui.js` version and also base class for {@link AutomatonWithGUI}.
 * @param options Options for this Automaton instance
 */
var Automaton = /** @class */ (function (_super) {
    __extends(Automaton, _super);
    function Automaton(options) {
        var _this = _super.call(this) || this;
        /**
         * **THE MIGHTY `auto()` FUNCTION!! GRAB IT**
         * It creates a new param automatically if there are no param called `_name` (GUI mode only).
         * Otherwise it returns current value of the param called `_name`.
         * @param name name of the param
         * @returns Current value of the param
         */
        _this.auto = _this.__auto.bind(_this);
        /**
         * Version of the automaton.
         */
        _this.__version = process.env.VERSION;
        /**
         * Length of the timeline.
         */
        _this.__length = 1.0;
        /**
         * Resolution of the timeline.
         */
        _this.__resolution = 1000;
        /**
         * Params of the timeline.
         */
        _this.__params = {};
        /**
         * A list of fx definitions.
         */
        _this.__fxDefs = {};
        _this.__isLoop = options.loop || false;
        _this.__clock = (options.fps ? new ClockFrame_1.ClockFrame(options.fps) :
            options.realtime ? new ClockRealtime_1.ClockRealtime() :
                new Clock_1.Clock());
        options.data && _this.load(options.data);
        return _this;
    }
    Object.defineProperty(Automaton.prototype, "version", {
        /**
         * Version of the automaton.
         */
        get: function () { return this.__version; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Automaton.prototype, "length", {
        /**
         * Total length of animation in seconds.
         */
        get: function () { return this.__length; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Automaton.prototype, "resolution", {
        /**
         * Resolution = Sampling point per second.
         */
        get: function () { return this.__resolution; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Automaton.prototype, "time", {
        /**
         * Current time. Same as `automaton.__clock.time`.
         */
        get: function () { return this.__clock.time; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Automaton.prototype, "deltaTime", {
        /**
         * Delta of time between now and previous update call.
         */
        get: function () { return this.__clock.deltaTime; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Automaton.prototype, "progress", {
        /**
         * Current progress by whole length. Might NOT be [0-1] unless {@link AutomatonOptions#loop} is true.
         */
        get: function () { return this.__clock.time / this.__length; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Automaton.prototype, "isPlaying", {
        /**
         * Whether it's playing or not.
         */
        get: function () { return this.__clock.isPlaying; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Automaton.prototype, "frame", {
        /**
         * Current frame.
         * If the clock type is not frame mode, it will return `null` instead.
         */
        get: function () {
            var frame = this.__clock.frame;
            return frame || null;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Automaton.prototype, "fps", {
        /**
         * Frame per second.
         * If the clock type is not frame mode, it will return `null` instead.
         */
        get: function () {
            var fps = this.__clock.fps;
            return fps || null;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Automaton.prototype, "isRealtime", {
        /**
         * Boolean that represents whether the clock is based on realtime or not.
         */
        get: function () {
            var isRealtime = this.__clock.isRealtime;
            return isRealtime || false;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Automaton.prototype, "isLoop", {
        /**
         * Whether the animation will be looped or not.
         */
        get: function () { return this.__isLoop; },
        enumerable: true,
        configurable: true
    });
    /**
     * Create a new param.
     * @param name Name of the param
     * @param data Data for the param
     */
    Automaton.prototype.createParam = function (name, data) {
        this.__params[name] = new Param_1.Param(this, data);
    };
    /**
     * Load serialized automaton data.
     * @param data Serialized object contains automaton data.
     */
    Automaton.prototype.load = function (data) {
        this.__length = data.length;
        this.__resolution = data.resolution;
        for (var name_1 in data.params) {
            this.createParam(name_1, data.params[name_1]);
        }
    };
    /**
     * Seek the timeline.
     * Can be performed via GUI.
     * @param time Time
     */
    Automaton.prototype.seek = function (time) {
        this.__clock.setTime(time);
        this.emit('seek');
    };
    /**
     * Play the timeline.
     * @todo SHOULD be performed via GUI.
     */
    Automaton.prototype.play = function () {
        this.__clock.play();
        this.emit('play');
    };
    /**
     * Pause the timeline.
     * @todo SHOULD be performed via GUI.
     */
    Automaton.prototype.pause = function () {
        this.__clock.pause();
        this.emit('pause');
    };
    /**
     * Add a fx definition.
     * @param id Unique id for the Fx definition
     * @param fxDef Fx definition object
     */
    Automaton.prototype.addFxDefinition = function (id, fxDef) {
        this.__fxDefs[id] = fxDef;
        this.precalcAll();
    };
    /**
     * Get a fx definition.
     * If it can't find the definition, it returns `null` instead.
     * @param id Unique id for the Fx definition
     */
    Automaton.prototype.getFxDefinition = function (id) {
        return this.__fxDefs[id] || null;
    };
    /**
     * Precalculate all params.
     */
    Automaton.prototype.precalcAll = function () {
        Object.values(this.__params).forEach(function (param) { return param.precalc(); });
    };
    /**
     * Update the entire automaton.
     * **You may want to call this in your update loop.**
     * @param time Current time, **Required if the clock mode is manual**
     */
    Automaton.prototype.update = function (time) {
        // update the clock
        this.__clock.update(time);
        // if loop is enabled, loop the time
        if (this.__isLoop && (this.time < 0 || this.length < this.time)) {
            this.__clock.setTime(this.time - Math.floor(this.time / this.length) * this.length);
        }
        // grab current value for each param
        Object.values(this.__params).forEach(function (param) { return param.getValue(); });
    };
    /**
     * Assigned to {@link Automaton#auto} on its initialize phase.
     * @param name name of the param
     * @returns Current value of the param
     */
    Automaton.prototype.__auto = function (name) {
        return this.__params[name].getValue();
    };
    return Automaton;
}(eventemitter3_1.EventEmitter));
exports.Automaton = Automaton;
