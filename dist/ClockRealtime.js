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
/**
 * Class that deals with time.
 * This is "realtime" type clock, the time goes on as real world.
 */
var ClockRealtime = /** @class */ (function (_super) {
    __extends(ClockRealtime, _super);
    function ClockRealtime() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        /**
         * "You set the time manually to `__rtTime` when it's `__rtDate`."
         */
        _this.__rtTime = 0.0;
        /**
         * "You set the time manually to `__rtTime` when it's `__rtDate`."
         */
        _this.__rtDate = performance.now();
        return _this;
    }
    Object.defineProperty(ClockRealtime.prototype, "isRealtime", {
        /**
         * The clock is realtime. yeah.
         */
        get: function () { return true; },
        enumerable: true,
        configurable: true
    });
    /**
     * Update the clock. Time is calculated based on time in real world.
     */
    ClockRealtime.prototype.update = function () {
        var now = performance.now();
        if (this.__isPlaying) {
            var prevTime = this.__time;
            var deltaDate = (now - this.__rtDate);
            this.__time = this.__rtTime + deltaDate / 1000.0;
            this.__deltaTime = this.time - prevTime;
        }
        else {
            this.__rtTime = this.time;
            this.__rtDate = now;
            this.__deltaTime = 0.0;
        }
    };
    /**
     * Set the time manually.
     * @param time Time
     */
    ClockRealtime.prototype.setTime = function (time) {
        this.__time = time;
        this.__rtTime = this.time;
        this.__rtDate = performance.now();
    };
    return ClockRealtime;
}(Clock_1.Clock));
exports.ClockRealtime = ClockRealtime;
