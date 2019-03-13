"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Class that deals with time.
 * In this base class, you need to set time manually from `Automaton.update()`.
 * Best for sync with external clock stuff.
 */
var Clock = /** @class */ (function () {
    function Clock() {
        /**
         * Its current time.
         */
        this.__time = 0.0;
        /**
         * Its deltaTime of last update.
         */
        this.__deltaTime = 0.0;
        /**
         * Whether its currently playing or not.
         */
        this.__isPlaying = true;
    }
    Object.defineProperty(Clock.prototype, "time", {
        /**
         * Its current time.
         */
        get: function () { return this.__time; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Clock.prototype, "deltaTime", {
        /**
         * Its deltaTime of last update.
         */
        get: function () { return this.__deltaTime; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Clock.prototype, "isPlaying", {
        /**
         * Whether its currently playing or not.
         */
        get: function () { return this.__isPlaying; },
        enumerable: true,
        configurable: true
    });
    /**
     * Update the clock.
     * @param time Time. You need to set manually
     */
    Clock.prototype.update = function (time) {
        var prevTime = this.__time;
        this.__time = time;
        this.__deltaTime = this.__time - prevTime;
    };
    /**
     * Start the clock.
     */
    Clock.prototype.play = function () {
        this.__isPlaying = true;
    };
    /**
     * Stop the clock.
     */
    Clock.prototype.pause = function () {
        this.__isPlaying = false;
    };
    /**
     * Set the time manually.
     * @param time Time
     */
    Clock.prototype.setTime = function (time) {
        this.__time = time;
    };
    return Clock;
}());
exports.Clock = Clock;
