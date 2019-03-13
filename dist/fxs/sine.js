"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TAU = Math.PI * 2.0;
exports.default = ['sine', {
        name: 'Sinewave',
        description: 'Overlay a sinewave to the curve.',
        params: {
            amp: { name: 'Amp', type: 'float', default: 0.1 },
            freq: { name: 'Frequency', type: 'float', default: 5.0 },
            phase: { name: 'Phase', type: 'float', default: 0.0, min: 0.0, max: 1.0 }
        },
        func: function (context) {
            var v = context.v;
            var p = context.progress * context.params.freq + context.params.phase;
            return v + context.params.amp * Math.sin(p * TAU);
        }
    }];
