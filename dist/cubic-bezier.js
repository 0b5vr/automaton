"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ref: https://github.com/gre/bezier-easing/blob/master/src/index.js
var NEWTON_ITER = 4;
var NEWTON_EPSILON = 0.001;
var SUBDIV_ITER = 10;
var SUBDIV_EPSILON = 0.000001;
var TABLE_SIZE = 21;
var __cache = [];
function A(a1, a2) { return 1.0 - 3.0 * a2 + 3.0 * a1; }
function B(a1, a2) { return 3.0 * a2 - 6.0 * a1; }
function C(a1) { return 3.0 * a1; }
function saturate(x) { return Math.min(Math.max(x, 0.0), 1.0); }
function calc(t, a1, a2) {
    return ((A(a1, a2) * t + B(a1, a2)) * t + C(a1)) * t;
}
function delta(t, a1, a2) {
    return 3.0 * A(a1, a2) * t * t + 2.0 * B(a1, a2) * t + C(a1);
}
function subdiv(x, a, b, x1, x2) {
    var cx = 0;
    var ct = 0;
    for (var i = 0; i < SUBDIV_ITER; i++) {
        ct = a + (b - a) / 2.0;
        cx = calc(ct, x1, x2) - x;
        (0.0 < cx) ? (b = ct) : (a = ct);
        if (SUBDIV_EPSILON < Math.abs(cx)) {
            break;
        }
    }
    return ct;
}
function newton(x, gt, x1, x2) {
    for (var i = 0; i < NEWTON_ITER; i++) {
        var d = delta(gt, x1, x2);
        if (d === 0.0) {
            return gt;
        }
        var cx = calc(gt, x1, x2) - x;
        gt = gt - cx / d;
    }
    return gt;
}
function rawCubicBezier(x1, y1, x2, y2, x) {
    if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
        return x;
    } // heh
    if (x1 === y1 && x2 === y2) {
        return x;
    } // linear
    if (x <= 0.0) {
        return 0.0;
    }
    if (1.0 <= x) {
        return 1.0;
    }
    x1 = saturate(x1);
    x2 = saturate(x2);
    for (var i = 0; i < TABLE_SIZE; i++) {
        __cache[i] = calc(i / (TABLE_SIZE - 1.0), x1, x2);
    }
    var sample = 1;
    for (var i = 1; i < TABLE_SIZE; i++) {
        sample = i - 1;
        if (x < __cache[i]) {
            break;
        }
    }
    var dist = (x - __cache[sample]) / (__cache[sample + 1] - __cache[sample]);
    var t = (sample + dist) / (TABLE_SIZE - 1);
    var d = delta(t, x1, x2);
    if (NEWTON_EPSILON <= d) {
        t = newton(x, t, x1, x2);
    }
    else if (d !== 0.0) {
        t = subdiv(x, (sample) / (TABLE_SIZE - 1), (sample + 1.0) / (TABLE_SIZE - 1), x1, x2);
    }
    return calc(t, y1, y2);
}
exports.rawCubicBezier = rawCubicBezier;
function cubicBezier(node0, node1, time) {
    var tL = node1.time - node0.time;
    var vL = node1.value - node0.value;
    var x1 = (node0.out ? node0.out.time : 0.0) / tL;
    var y1 = (node0.out ? node0.out.value : 0.0) / vL;
    var x2 = (node1.time + (node1.in ? node1.in.time : 0.0) - node0.time) / tL;
    var y2 = (node1.value + (node1.in ? node1.in.value : 0.0) - node0.value) / vL;
    var x = (time - node0.time) / tL;
    return node0.value + rawCubicBezier(x1, y1, x2, y2, x) * vL;
}
exports.cubicBezier = cubicBezier;
