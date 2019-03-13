"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ['pow', {
        name: 'Power',
        description: 'You got boost power!',
        params: {
            pow: { name: 'Power', type: 'float', default: 2.0 },
            bias: { name: 'Bias', type: 'float', default: 0.0 },
            positive: { name: 'Force Positive', type: 'boolean', default: false }
        },
        func: function (context) {
            var v = context.v - context.params.bias;
            var sign = context.params.positive ? 1.0 : Math.sign(v);
            return Math.pow(Math.abs(v), context.params.pow) * sign + context.params.bias;
        }
    }];
