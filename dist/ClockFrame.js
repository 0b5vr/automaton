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
 * This is "frame" type clock, the frame increases every {@link ClockFrame#update} call.
 * @param fps Frames per second
 */
var ClockFrame = /** @class */ (function (_super) {
    __extends(ClockFrame, _super);
    function ClockFrame(fps) {
        var _this = _super.call(this) || this;
        /**
         * Its current frame.
         */
        _this.__frame = 0;
        _this.__fps = fps;
        return _this;
    }
    Object.defineProperty(ClockFrame.prototype, "frame", {
        /**
         * Its current frame.
         */
        get: function () { return this.__frame; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ClockFrame.prototype, "fps", {
        /**
         * Its fps.
         */
        get: function () { return this.__fps; },
        enumerable: true,
        configurable: true
    });
    /**
     * Update the clock. It will increase the frame by 1.
     */
    ClockFrame.prototype.update = function () {
        if (this.__isPlaying) {
            this.__time = this.__frame / this.__fps;
            this.__deltaTime = 1.0 / this.__fps;
            this.__frame++;
        }
        else {
            this.__deltaTime = 0.0;
        }
    };
    /**
     * Set the time manually.
     * The set time will be converted into internal frame count, so the time will not be exactly same as set one.
     * @param time Time
     */
    ClockFrame.prototype.setTime = function (time) {
        this.__frame = Math.floor(this.__fps * time);
        this.__time = this.__frame / this.__fps;
    };
    return ClockFrame;
}(Clock_1.Clock));
exports.ClockFrame = ClockFrame;
