"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ['cds', {
        name: 'Critically Damped Spring',
        description: 'Basically the best smoothing method. Shoutouts to Keijiro Takahashi',
        params: {
            factor: { name: 'Factor', type: 'float', default: 100.0, min: 0.0 },
            ratio: { name: 'Damp Ratio', type: 'float', default: 1.0 },
            preserve: { name: 'Preserve Velocity', type: 'boolean', default: false }
        },
        func: function (context) {
            var dt = context.dt;
            var v = context.v;
            var k = context.params.factor;
            if (context.init) {
                context.state.pos = context.v;
                if (context.params.preserve) {
                    var dv = v - context.getValue(context.t - dt);
                    context.state.vel = dv / dt;
                }
                else {
                    context.state.vel = 0.0;
                }
            }
            context.state.vel += (-k * (context.state.pos - v)
                - 2.0 * context.state.vel * Math.sqrt(k) * context.params.ratio) * dt;
            context.state.pos += context.state.vel * dt;
            return context.state.pos;
        }
    }];
