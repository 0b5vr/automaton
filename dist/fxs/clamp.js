"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function clamp(x, a, b) {
    return Math.min(Math.max(x, a), b);
}
function smin(a, b, k) {
    var h = Math.max(k - Math.abs(a - b), 0.0);
    return Math.min(a, b) - h * h * h / (6.0 * k * k);
}
exports.default = ['clamp', {
        name: 'Clamp',
        description: 'Constrain the curve between two values, featuring smooth minimum.',
        params: {
            min: { name: 'Min', type: 'float', default: 0.0 },
            max: { name: 'Max', type: 'float', default: 1.0 },
            smooth: { name: 'Smooth', type: 'float', default: 0.0, min: 0.0 }
        },
        func: function (context) {
            if (context.params.smooth === 0.0) {
                return clamp(context.v, context.params.min, context.params.max);
            }
            var v = -smin(-context.params.min, -context.v, context.params.smooth);
            return smin(context.params.max, v, context.params.smooth);
        }
    }];
