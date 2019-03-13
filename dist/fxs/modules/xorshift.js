"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Xorshift = /** @class */ (function () {
    function Xorshift(seed) {
        this.__seed = 1;
        this.set(seed);
    }
    Xorshift.prototype.gen = function (seed) {
        if (seed) {
            this.set(seed);
        }
        this.__seed = this.__seed ^ (this.__seed << 13);
        this.__seed = this.__seed ^ (this.__seed >>> 17);
        this.__seed = this.__seed ^ (this.__seed << 5);
        return this.__seed / Math.pow(2, 32) + 0.5;
    };
    Xorshift.prototype.set = function (seed) {
        if (seed === void 0) { seed = 1; }
        this.__seed = seed;
    };
    return Xorshift;
}());
exports.Xorshift = Xorshift;
exports.default = Xorshift;
