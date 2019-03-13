"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var xorshift_1 = __importDefault(require("./modules/xorshift"));
var xorshift = new xorshift_1.default();
function smoothstep(a, b, k) {
    var smooth = k * k * (3.0 - 2.0 * k);
    return a + (b - a) * smooth;
}
exports.default = ['noise', {
        name: 'Fractal Noise',
        description: 'wiggle()',
        params: {
            recursion: { name: 'Recursion', type: 'int', default: 4, min: 1, max: 99 },
            freq: { name: 'Frequency', type: 'float', default: 1.0, min: 0.0 },
            reso: { name: 'Resolution', type: 'float', default: 8.0, min: 1.0 },
            seed: { name: 'Seed', type: 'int', default: 1, min: 0 },
            amp: { name: 'Amp', type: 'float', default: 0.2 }
        },
        func: function (context) {
            if (context.init) {
                xorshift.gen(context.params.seed);
                context.state.table = new Float32Array(Math.floor(context.params.reso) + 2);
                for (var i = 1; i < context.params.reso; i++) {
                    context.state.table[i] = xorshift.gen() * 2.0 - 1.0;
                }
            }
            var v = context.v;
            var p = context.progress;
            for (var i = 0; i < context.params.recursion; i++) {
                var index = (p * context.params.freq * context.params.reso * Math.pow(2.0, i)) % context.params.reso;
                var indexi = Math.floor(index);
                var indexf = index - indexi;
                var factor = Math.pow(0.5, i + 1.0);
                v += context.params.amp * factor * smoothstep(context.state.table[indexi], context.state.table[indexi + 1], indexf);
            }
            return v;
        }
    }];
