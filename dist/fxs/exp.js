"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ['exp', {
        name: 'Exponential Smoothing',
        description: 'Smooth the curve. Simple but good.',
        params: {
            factor: { name: 'Factor', type: 'float', default: 10.0, min: 0.0 }
        },
        func: function (context) {
            var v = context.v;
            if (context.init) {
                context.state.pos = v;
            }
            var k = Math.exp(-context.dt * context.params.factor);
            context.state.pos = context.state.pos * k + v * (1.0 - k);
            return context.state.pos;
        }
    }];
