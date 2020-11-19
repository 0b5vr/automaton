/*!
* @fms-cat/automaton-fxs v4.0.0
* Bunch of automaton fxs
*
* Copyright (c) 2020 FMS_Cat
* @fms-cat/automaton-fxs is distributed under MIT License
* https://github.com/FMS-Cat/automaton/blob/master/LICENSE
*/
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.AUTOMATON_FXS = {}));
}(this, (function (exports) { 'use strict';

    const add = {
        name: 'Add',
        description: 'The simplest fx ever. Just add a constant value to the curve.',
        params: {
            value: { name: 'Value', type: 'float', default: 1.0 }
        },
        func(context) {
            return context.value + context.params.value;
        }
    };

    const cds = {
        name: 'Critically Damped Spring',
        description: 'Basically the best smoothing method. Shoutouts to Keijiro Takahashi',
        params: {
            factor: { name: 'Factor', type: 'float', default: 100.0, min: 0.0 },
            ratio: { name: 'Damp Ratio', type: 'float', default: 1.0 },
            preserve: { name: 'Preserve Velocity', type: 'boolean', default: false }
        },
        func(context) {
            const dt = context.deltaTime;
            const v = context.value;
            const k = context.params.factor;
            if (context.init) {
                context.state.pos = context.value;
                if (context.params.preserve) {
                    const dv = v - context.getValue(context.time - dt);
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
    };

    function clamp(x, a, b) {
        return Math.min(Math.max(x, a), b);
    }

    function smin(a, b, k) {
        const h = Math.max(k - Math.abs(a - b), 0.0);
        return Math.min(a, b) - h * h * h / (6.0 * k * k);
    }

    const clamp$1 = {
        name: 'Clamp',
        description: 'Constrain the curve between two values, featuring smooth minimum.',
        params: {
            min: { name: 'Min', type: 'float', default: 0.0 },
            max: { name: 'Max', type: 'float', default: 1.0 },
            smooth: { name: 'Smooth', type: 'float', default: 0.0, min: 0.0 }
        },
        func(context) {
            if (context.params.smooth === 0.0) {
                return clamp(context.value, context.params.min, context.params.max);
            }
            const v = -smin(-context.params.min, -context.value, context.params.smooth);
            return smin(context.params.max, v, context.params.smooth);
        }
    };

    const exp = {
        name: 'Exponential Smoothing',
        description: 'Smooth the curve. Simple but good.',
        params: {
            factor: { name: 'Factor', type: 'float', default: 10.0, min: 0.0 }
        },
        func(context) {
            const v = context.value;
            if (context.init) {
                context.state.pos = v;
            }
            const k = Math.exp(-context.deltaTime * context.params.factor);
            context.state.pos = context.state.pos * k + v * (1.0 - k);
            return context.state.pos;
        }
    };

    const gravity = {
        name: 'Gravity',
        description: 'Accelerate and bounce the curve.',
        params: {
            a: { name: 'Acceleration', type: 'float', default: 9.8 },
            e: { name: 'Restitution', type: 'float', default: 0.5, min: 0.0 },
            preserve: { name: 'Preserve Velocity', type: 'boolean', default: false }
        },
        func(context) {
            const dt = context.deltaTime;
            const v = context.value;
            if (context.init) {
                context.state.pos = v;
                if (context.params.preserve) {
                    const dv = v - context.getValue(context.time - dt);
                    context.state.vel = dv / dt;
                }
                else {
                    context.state.vel = 0.0;
                }
            }
            const a = Math.sign(v - context.state.pos) * context.params.a;
            context.state.vel += a * dt;
            context.state.pos += context.state.vel * dt;
            if (Math.sign(a) !== Math.sign(v - context.state.pos)) {
                context.state.vel *= -context.params.e;
                context.state.pos = v + context.params.e * (v - context.state.pos);
            }
            return context.state.pos;
        }
    };

    const lofi = {
        name: 'Lo-Fi',
        description: 'Make curve more crunchy.',
        params: {
            rate: { name: 'Frame Rate', type: 'float', default: 10.0, min: 0.0, max: 1000.0 },
            relative: { name: 'Relative', type: 'boolean', default: false },
            reso: { name: 'Reso Per Unit', type: 'float', default: 10.0, min: 0.0, max: 1000.0 },
            round: { name: 'Round', type: 'boolean', default: false }
        },
        func(context) {
            let t;
            if (context.params.rate === 0.0) {
                t = context.time;
            }
            else if (context.params.relative) {
                t = context.t0 + Math.floor((context.time - context.t0) * context.params.rate) / context.params.rate;
            }
            else {
                t = Math.floor((context.time) * context.params.rate) / context.params.rate;
            }
            let v = context.getValue(t);
            if (context.params.reso !== 0.0) {
                v = Math.floor(v * context.params.reso + (context.params.round ? 0.5 : 0.0)) / context.params.reso;
            }
            return v;
        }
    };

    function smoothstep(a, b, k) {
        const smooth = k * k * (3.0 - 2.0 * k);
        return a + (b - a) * smooth;
    }

    class Xorshift {
        constructor(seed) {
            this.__seed = 1;
            this.set(seed);
        }
        gen(seed) {
            if (seed) {
                this.set(seed);
            }
            this.__seed = this.__seed ^ (this.__seed << 13);
            this.__seed = this.__seed ^ (this.__seed >>> 17);
            this.__seed = this.__seed ^ (this.__seed << 5);
            return this.__seed / Math.pow(2, 32) + 0.5;
        }
        set(seed = 1) {
            this.__seed = seed;
        }
    }

    const xorshift = new Xorshift();
    const noise = {
        name: 'Fractal Noise',
        description: 'wiggle()',
        params: {
            recursion: { name: 'Recursion', type: 'int', default: 4, min: 1, max: 99 },
            freq: { name: 'Frequency', type: 'float', default: 1.0, min: 0.0 },
            reso: { name: 'Resolution', type: 'float', default: 8.0, min: 1.0 },
            seed: { name: 'Seed', type: 'int', default: 1, min: 0 },
            amp: { name: 'Amp', type: 'float', default: 0.2 }
        },
        func(context) {
            if (context.init) {
                xorshift.gen(context.params.seed);
                context.state.table = new Float32Array(Math.floor(context.params.reso) + 2);
                for (let i = 1; i < context.params.reso; i++) {
                    context.state.table[i] = xorshift.gen() * 2.0 - 1.0;
                }
            }
            let v = context.value;
            const p = context.progress;
            for (let i = 0; i < context.params.recursion; i++) {
                const index = (p * context.params.freq * context.params.reso * Math.pow(2.0, i)) % context.params.reso;
                const indexi = Math.floor(index);
                const indexf = index - indexi;
                const factor = Math.pow(0.5, i + 1.0);
                v += context.params.amp * factor * smoothstep(context.state.table[indexi], context.state.table[indexi + 1], indexf);
            }
            return v;
        }
    };

    const pow = {
        name: 'Power',
        description: 'You got boost power!',
        params: {
            pow: { name: 'Power', type: 'float', default: 2.0 },
            bias: { name: 'Bias', type: 'float', default: 0.0 },
            positive: { name: 'Force Positive', type: 'boolean', default: false }
        },
        func(context) {
            const v = context.value - context.params.bias;
            const sign = context.params.positive ? 1.0 : Math.sign(v);
            return Math.pow(Math.abs(v), context.params.pow) * sign + context.params.bias;
        }
    };

    const TAU = Math.PI * 2.0;
    const sine = {
        name: 'Sinewave',
        description: 'Overlay a sinewave to the curve.',
        params: {
            amp: { name: 'Amp', type: 'float', default: 0.1 },
            freq: { name: 'Frequency', type: 'float', default: 5.0 },
            phase: { name: 'Phase', type: 'float', default: 0.0, min: 0.0, max: 1.0 }
        },
        func(context) {
            const v = context.value;
            const p = context.progress * context.params.freq + context.params.phase;
            return v + context.params.amp * Math.sin(p * TAU);
        }
    };

    var index = /*#__PURE__*/Object.freeze({
        __proto__: null,
        add: add,
        cds: cds,
        clamp: clamp$1,
        exp: exp,
        gravity: gravity,
        lofi: lofi,
        noise: noise,
        pow: pow,
        sine: sine
    });

    const add$1 = {
        name: 'Add',
        description: 'The simplest fx ever. Just add a constant value to the curve.',
        params: {
            value: { name: 'Value', type: 'float', default: 1.0 }
        },
        func(context) {
            return context.value + context.params.value;
        }
    };

    const cds$1 = {
        name: 'Critically Damped Spring',
        description: 'Basically the best smoothing method. Shoutouts to Keijiro Takahashi',
        params: {
            factor: { name: 'Factor', type: 'float', default: 100.0, min: 0.0 },
            ratio: { name: 'Damp Ratio', type: 'float', default: 1.0 },
            preserve: { name: 'Preserve Velocity', type: 'boolean', default: false }
        },
        func(context) {
            const dt = context.deltaTime;
            const v = context.value;
            const k = context.params.factor;
            if (context.init) {
                context.state.pos = context.value;
                if (context.params.preserve) {
                    const dv = v - context.getValue(context.time - dt);
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
    };

    const clamp$2 = {
        name: 'Clamp',
        description: 'Constrain the curve between two values, featuring smooth minimum.',
        params: {
            min: { name: 'Min', type: 'float', default: 0.0 },
            max: { name: 'Max', type: 'float', default: 1.0 },
            smooth: { name: 'Smooth', type: 'float', default: 0.0, min: 0.0 }
        },
        func(context) {
            if (context.params.smooth === 0.0) {
                return clamp(context.value, context.params.min, context.params.max);
            }
            const v = -smin(-context.params.min, -context.value, context.params.smooth);
            return smin(context.params.max, v, context.params.smooth);
        }
    };

    const exp$1 = {
        name: 'Exponential Smoothing',
        description: 'Smooth the curve. Simple but good.',
        params: {
            factor: { name: 'Factor', type: 'float', default: 10.0, min: 0.0 }
        },
        func(context) {
            const v = context.value;
            if (context.init) {
                context.state.pos = v;
            }
            const k = Math.exp(-context.deltaTime * context.params.factor);
            context.state.pos = context.state.pos * k + v * (1.0 - k);
            return context.state.pos;
        }
    };

    const gravity$1 = {
        name: 'Gravity',
        description: 'Accelerate and bounce the curve.',
        params: {
            a: { name: 'Acceleration', type: 'float', default: 9.8 },
            e: { name: 'Restitution', type: 'float', default: 0.5, min: 0.0 },
            preserve: { name: 'Preserve Velocity', type: 'boolean', default: false }
        },
        func(context) {
            const dt = context.deltaTime;
            const v = context.value;
            if (context.init) {
                context.state.pos = v;
                if (context.params.preserve) {
                    const dv = v - context.getValue(context.time - dt);
                    context.state.vel = dv / dt;
                }
                else {
                    context.state.vel = 0.0;
                }
            }
            const a = Math.sign(v - context.state.pos) * context.params.a;
            context.state.vel += a * dt;
            context.state.pos += context.state.vel * dt;
            if (Math.sign(a) !== Math.sign(v - context.state.pos)) {
                context.state.vel *= -context.params.e;
                context.state.pos = v + context.params.e * (v - context.state.pos);
            }
            return context.state.pos;
        }
    };

    const hermitePatch = {
        name: 'Hermite Patch',
        description: 'Patch a curve using hermite spline.',
        params: {},
        func(context) {
            if (context.init) {
                const dt = context.deltaTime;
                const v0 = context.getValue(context.t0);
                const dv0 = v0 - context.getValue(context.t0 - dt);
                const v1 = context.getValue(context.t1);
                const dv1 = v1 - context.getValue(context.t1 - dt);
                context.state.p0 = v0;
                context.state.m0 = dv0 / dt * context.length;
                context.state.p1 = v1;
                context.state.m1 = dv1 / dt * context.length;
            }
            const { p0, m0, p1, m1 } = context.state;
            const t = context.progress;
            return (((2.0 * t - 3.0) * t * t + 1.0) * p0 +
                (((t - 2.0) * t + 1.0) * t) * m0 +
                ((-2.0 * t + 3.0) * t * t) * p1 +
                ((t - 1.0) * t * t) * m1);
        }
    };

    const lofi$1 = {
        name: 'Lo-Fi',
        description: 'Make curve more crunchy.',
        params: {
            rate: { name: 'Frame Rate', type: 'float', default: 10.0, min: 0.0, max: 1000.0 },
            relative: { name: 'Relative', type: 'boolean', default: false },
            reso: { name: 'Reso Per Unit', type: 'float', default: 10.0, min: 0.0, max: 1000.0 },
            round: { name: 'Round', type: 'boolean', default: false }
        },
        func(context) {
            let t;
            if (context.params.rate === 0.0) {
                t = context.time;
            }
            else if (context.params.relative) {
                t = context.t0 + Math.floor((context.time - context.t0) * context.params.rate) / context.params.rate;
            }
            else {
                t = Math.floor((context.time) * context.params.rate) / context.params.rate;
            }
            let v = context.getValue(t);
            if (context.params.reso !== 0.0) {
                v = Math.floor(v * context.params.reso + (context.params.round ? 0.5 : 0.0)) / context.params.reso;
            }
            return v;
        }
    };

    const xorshift$1 = new Xorshift();
    const noise$1 = {
        name: 'Fractal Noise',
        description: 'wiggle()',
        params: {
            recursion: { name: 'Recursion', type: 'int', default: 4, min: 1, max: 99 },
            freq: { name: 'Frequency', type: 'float', default: 1.0, min: 0.0 },
            reso: { name: 'Resolution', type: 'float', default: 8.0, min: 1.0 },
            seed: { name: 'Seed', type: 'int', default: 1, min: 0 },
            amp: { name: 'Amp', type: 'float', default: 0.2 }
        },
        func(context) {
            if (context.init) {
                xorshift$1.gen(context.params.seed);
                context.state.table = new Float32Array(Math.floor(context.params.reso) + 2);
                for (let i = 1; i < context.params.reso; i++) {
                    context.state.table[i] = xorshift$1.gen() * 2.0 - 1.0;
                }
            }
            let v = context.value;
            const p = context.progress;
            for (let i = 0; i < context.params.recursion; i++) {
                const index = (p * context.params.freq * context.params.reso * Math.pow(2.0, i)) % context.params.reso;
                const indexi = Math.floor(index);
                const indexf = index - indexi;
                const factor = Math.pow(0.5, i + 1.0);
                v += context.params.amp * factor * smoothstep(context.state.table[indexi], context.state.table[indexi + 1], indexf);
            }
            return v;
        }
    };

    const pow$1 = {
        name: 'Power',
        description: 'You got boost power!',
        params: {
            pow: { name: 'Power', type: 'float', default: 2.0 },
            bias: { name: 'Bias', type: 'float', default: 0.0 },
            positive: { name: 'Force Positive', type: 'boolean', default: false }
        },
        func(context) {
            const v = context.value - context.params.bias;
            const sign = context.params.positive ? 1.0 : Math.sign(v);
            return Math.pow(Math.abs(v), context.params.pow) * sign + context.params.bias;
        }
    };

    const repeat = {
        name: 'Repeat',
        description: 'Repeat a section of the curve.',
        params: {
            interval: { name: 'Interval', type: 'float', default: 1.0, min: 0.0 },
        },
        func(context) {
            return context.getValue(context.t0 + context.elapsed % context.params.interval);
        }
    };

    const TAU$1 = Math.PI * 2.0;
    const sine$1 = {
        name: 'Sinewave',
        description: 'Overlay a sinewave to the curve.',
        params: {
            amp: { name: 'Amp', type: 'float', default: 0.1 },
            freq: { name: 'Frequency', type: 'float', default: 5.0 },
            offset: { name: 'Offset', type: 'float', default: 0.0, min: 0.0, max: 1.0 }
        },
        func(context) {
            const v = context.value;
            const p = context.elapsed * context.params.freq + context.params.offset;
            return v + context.params.amp * Math.sin(p * TAU$1);
        }
    };

    exports.add = add$1;
    exports.cds = cds$1;
    exports.clamp = clamp$2;
    exports.exp = exp$1;
    exports.gravity = gravity$1;
    exports.hermitePatch = hermitePatch;
    exports.lofi = lofi$1;
    exports.noise = noise$1;
    exports.pow = pow$1;
    exports.repeat = repeat;
    exports.sine = sine$1;
    exports.v2compat = index;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b21hdG9uLWZ4cy5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL3YyY29tcGF0L2FkZC50cyIsIi4uL3NyYy92MmNvbXBhdC9jZHMudHMiLCIuLi9zcmMvdXRpbHMvY2xhbXAudHMiLCIuLi9zcmMvdXRpbHMvc21pbi50cyIsIi4uL3NyYy92MmNvbXBhdC9jbGFtcC50cyIsIi4uL3NyYy92MmNvbXBhdC9leHAudHMiLCIuLi9zcmMvdjJjb21wYXQvZ3Jhdml0eS50cyIsIi4uL3NyYy92MmNvbXBhdC9sb2ZpLnRzIiwiLi4vc3JjL3V0aWxzL3Ntb290aHN0ZXAudHMiLCIuLi9zcmMvdXRpbHMveG9yc2hpZnQudHMiLCIuLi9zcmMvdjJjb21wYXQvbm9pc2UudHMiLCIuLi9zcmMvdjJjb21wYXQvcG93LnRzIiwiLi4vc3JjL3YyY29tcGF0L3NpbmUudHMiLCIuLi9zcmMvYWRkLnRzIiwiLi4vc3JjL2Nkcy50cyIsIi4uL3NyYy9jbGFtcC50cyIsIi4uL3NyYy9leHAudHMiLCIuLi9zcmMvZ3Jhdml0eS50cyIsIi4uL3NyYy9oZXJtaXRlUGF0Y2gudHMiLCIuLi9zcmMvbG9maS50cyIsIi4uL3NyYy9ub2lzZS50cyIsIi4uL3NyYy9wb3cudHMiLCIuLi9zcmMvcmVwZWF0LnRzIiwiLi4vc3JjL3NpbmUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBGeERlZmluaXRpb24gfSBmcm9tICdAZm1zLWNhdC9hdXRvbWF0b24nO1xuXG5leHBvcnQgY29uc3QgYWRkOiBGeERlZmluaXRpb24gPSB7XG4gIG5hbWU6ICdBZGQnLFxuICBkZXNjcmlwdGlvbjogJ1RoZSBzaW1wbGVzdCBmeCBldmVyLiBKdXN0IGFkZCBhIGNvbnN0YW50IHZhbHVlIHRvIHRoZSBjdXJ2ZS4nLFxuICBwYXJhbXM6IHtcbiAgICB2YWx1ZTogeyBuYW1lOiAnVmFsdWUnLCB0eXBlOiAnZmxvYXQnLCBkZWZhdWx0OiAxLjAgfVxuICB9LFxuICBmdW5jKCBjb250ZXh0ICkge1xuICAgIHJldHVybiBjb250ZXh0LnZhbHVlICsgY29udGV4dC5wYXJhbXMudmFsdWU7XG4gIH1cbn07XG4iLCJpbXBvcnQgdHlwZSB7IEZ4RGVmaW5pdGlvbiB9IGZyb20gJ0BmbXMtY2F0L2F1dG9tYXRvbic7XG5cbmV4cG9ydCBjb25zdCBjZHM6IEZ4RGVmaW5pdGlvbiA9IHtcbiAgbmFtZTogJ0NyaXRpY2FsbHkgRGFtcGVkIFNwcmluZycsXG4gIGRlc2NyaXB0aW9uOiAnQmFzaWNhbGx5IHRoZSBiZXN0IHNtb290aGluZyBtZXRob2QuIFNob3V0b3V0cyB0byBLZWlqaXJvIFRha2FoYXNoaScsXG4gIHBhcmFtczoge1xuICAgIGZhY3RvcjogeyBuYW1lOiAnRmFjdG9yJywgdHlwZTogJ2Zsb2F0JywgZGVmYXVsdDogMTAwLjAsIG1pbjogMC4wIH0sXG4gICAgcmF0aW86IHsgbmFtZTogJ0RhbXAgUmF0aW8nLCB0eXBlOiAnZmxvYXQnLCBkZWZhdWx0OiAxLjAgfSxcbiAgICBwcmVzZXJ2ZTogeyBuYW1lOiAnUHJlc2VydmUgVmVsb2NpdHknLCB0eXBlOiAnYm9vbGVhbicsIGRlZmF1bHQ6IGZhbHNlIH1cbiAgfSxcbiAgZnVuYyggY29udGV4dCApIHtcbiAgICBjb25zdCBkdCA9IGNvbnRleHQuZGVsdGFUaW1lO1xuICAgIGNvbnN0IHYgPSBjb250ZXh0LnZhbHVlO1xuICAgIGNvbnN0IGsgPSBjb250ZXh0LnBhcmFtcy5mYWN0b3I7XG5cbiAgICBpZiAoIGNvbnRleHQuaW5pdCApIHtcbiAgICAgIGNvbnRleHQuc3RhdGUucG9zID0gY29udGV4dC52YWx1ZTtcbiAgICAgIGlmICggY29udGV4dC5wYXJhbXMucHJlc2VydmUgKSB7XG4gICAgICAgIGNvbnN0IGR2ID0gdiAtIGNvbnRleHQuZ2V0VmFsdWUoIGNvbnRleHQudGltZSAtIGR0ICk7XG4gICAgICAgIGNvbnRleHQuc3RhdGUudmVsID0gZHYgLyBkdDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnRleHQuc3RhdGUudmVsID0gMC4wO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnRleHQuc3RhdGUudmVsICs9IChcbiAgICAgIC1rICogKCBjb250ZXh0LnN0YXRlLnBvcyAtIHYgKVxuICAgICAgLSAyLjAgKiBjb250ZXh0LnN0YXRlLnZlbCAqIE1hdGguc3FydCggayApICogY29udGV4dC5wYXJhbXMucmF0aW9cbiAgICApICogZHQ7XG4gICAgY29udGV4dC5zdGF0ZS5wb3MgKz0gY29udGV4dC5zdGF0ZS52ZWwgKiBkdDtcbiAgICByZXR1cm4gY29udGV4dC5zdGF0ZS5wb3M7XG4gIH1cbn07XG4iLCJleHBvcnQgZnVuY3Rpb24gY2xhbXAoIHg6IG51bWJlciwgYTogbnVtYmVyLCBiOiBudW1iZXIgKTogbnVtYmVyIHtcbiAgcmV0dXJuIE1hdGgubWluKCBNYXRoLm1heCggeCwgYSApLCBiICk7XG59XG4iLCJleHBvcnQgZnVuY3Rpb24gc21pbiggYTogbnVtYmVyLCBiOiBudW1iZXIsIGs6IG51bWJlciApOiBudW1iZXIge1xuICBjb25zdCBoID0gTWF0aC5tYXgoIGsgLSBNYXRoLmFicyggYSAtIGIgKSwgMC4wICk7XG4gIHJldHVybiBNYXRoLm1pbiggYSwgYiApIC0gaCAqIGggKiBoIC8gKCA2LjAgKiBrICogayApO1xufVxuIiwiaW1wb3J0IHsgY2xhbXAgYXMgcmF3Q2xhbXAgfSBmcm9tICcuLi91dGlscy9jbGFtcCc7XG5pbXBvcnQgeyBzbWluIH0gZnJvbSAnLi4vdXRpbHMvc21pbic7XG5pbXBvcnQgdHlwZSB7IEZ4RGVmaW5pdGlvbiB9IGZyb20gJ0BmbXMtY2F0L2F1dG9tYXRvbic7XG5cbmV4cG9ydCBjb25zdCBjbGFtcDogRnhEZWZpbml0aW9uID0ge1xuICBuYW1lOiAnQ2xhbXAnLFxuICBkZXNjcmlwdGlvbjogJ0NvbnN0cmFpbiB0aGUgY3VydmUgYmV0d2VlbiB0d28gdmFsdWVzLCBmZWF0dXJpbmcgc21vb3RoIG1pbmltdW0uJyxcbiAgcGFyYW1zOiB7XG4gICAgbWluOiB7IG5hbWU6ICdNaW4nLCB0eXBlOiAnZmxvYXQnLCBkZWZhdWx0OiAwLjAgfSxcbiAgICBtYXg6IHsgbmFtZTogJ01heCcsIHR5cGU6ICdmbG9hdCcsIGRlZmF1bHQ6IDEuMCB9LFxuICAgIHNtb290aDogeyBuYW1lOiAnU21vb3RoJywgdHlwZTogJ2Zsb2F0JywgZGVmYXVsdDogMC4wLCBtaW46IDAuMCB9XG4gIH0sXG4gIGZ1bmMoIGNvbnRleHQgKSB7XG4gICAgaWYgKCBjb250ZXh0LnBhcmFtcy5zbW9vdGggPT09IDAuMCApIHtcbiAgICAgIHJldHVybiByYXdDbGFtcCggY29udGV4dC52YWx1ZSwgY29udGV4dC5wYXJhbXMubWluLCBjb250ZXh0LnBhcmFtcy5tYXggKTtcbiAgICB9XG5cbiAgICBjb25zdCB2ID0gLXNtaW4oIC1jb250ZXh0LnBhcmFtcy5taW4sIC1jb250ZXh0LnZhbHVlLCBjb250ZXh0LnBhcmFtcy5zbW9vdGggKTtcbiAgICByZXR1cm4gc21pbiggY29udGV4dC5wYXJhbXMubWF4LCB2LCBjb250ZXh0LnBhcmFtcy5zbW9vdGggKTtcbiAgfVxufTtcbiIsImltcG9ydCB0eXBlIHsgRnhEZWZpbml0aW9uIH0gZnJvbSAnQGZtcy1jYXQvYXV0b21hdG9uJztcblxuZXhwb3J0IGNvbnN0IGV4cDogRnhEZWZpbml0aW9uID0ge1xuICBuYW1lOiAnRXhwb25lbnRpYWwgU21vb3RoaW5nJyxcbiAgZGVzY3JpcHRpb246ICdTbW9vdGggdGhlIGN1cnZlLiBTaW1wbGUgYnV0IGdvb2QuJyxcbiAgcGFyYW1zOiB7XG4gICAgZmFjdG9yOiB7IG5hbWU6ICdGYWN0b3InLCB0eXBlOiAnZmxvYXQnLCBkZWZhdWx0OiAxMC4wLCBtaW46IDAuMCB9XG4gIH0sXG4gIGZ1bmMoIGNvbnRleHQgKSB7XG4gICAgY29uc3QgdiA9IGNvbnRleHQudmFsdWU7XG5cbiAgICBpZiAoIGNvbnRleHQuaW5pdCApIHtcbiAgICAgIGNvbnRleHQuc3RhdGUucG9zID0gdjtcbiAgICB9XG5cbiAgICBjb25zdCBrID0gTWF0aC5leHAoIC1jb250ZXh0LmRlbHRhVGltZSAqIGNvbnRleHQucGFyYW1zLmZhY3RvciApO1xuICAgIGNvbnRleHQuc3RhdGUucG9zID0gY29udGV4dC5zdGF0ZS5wb3MgKiBrICsgdiAqICggMS4wIC0gayApO1xuICAgIHJldHVybiBjb250ZXh0LnN0YXRlLnBvcztcbiAgfVxufTtcbiIsImltcG9ydCB0eXBlIHsgRnhEZWZpbml0aW9uIH0gZnJvbSAnQGZtcy1jYXQvYXV0b21hdG9uJztcblxuZXhwb3J0IGNvbnN0IGdyYXZpdHk6IEZ4RGVmaW5pdGlvbiA9IHtcbiAgbmFtZTogJ0dyYXZpdHknLFxuICBkZXNjcmlwdGlvbjogJ0FjY2VsZXJhdGUgYW5kIGJvdW5jZSB0aGUgY3VydmUuJyxcbiAgcGFyYW1zOiB7XG4gICAgYTogeyBuYW1lOiAnQWNjZWxlcmF0aW9uJywgdHlwZTogJ2Zsb2F0JywgZGVmYXVsdDogOS44IH0sXG4gICAgZTogeyBuYW1lOiAnUmVzdGl0dXRpb24nLCB0eXBlOiAnZmxvYXQnLCBkZWZhdWx0OiAwLjUsIG1pbjogMC4wIH0sXG4gICAgcHJlc2VydmU6IHsgbmFtZTogJ1ByZXNlcnZlIFZlbG9jaXR5JywgdHlwZTogJ2Jvb2xlYW4nLCBkZWZhdWx0OiBmYWxzZSB9XG4gIH0sXG4gIGZ1bmMoIGNvbnRleHQgKSB7XG4gICAgY29uc3QgZHQgPSBjb250ZXh0LmRlbHRhVGltZTtcbiAgICBjb25zdCB2ID0gY29udGV4dC52YWx1ZTtcblxuICAgIGlmICggY29udGV4dC5pbml0ICkge1xuICAgICAgY29udGV4dC5zdGF0ZS5wb3MgPSB2O1xuICAgICAgaWYgKCBjb250ZXh0LnBhcmFtcy5wcmVzZXJ2ZSApIHtcbiAgICAgICAgY29uc3QgZHYgPSB2IC0gY29udGV4dC5nZXRWYWx1ZSggY29udGV4dC50aW1lIC0gZHQgKTtcbiAgICAgICAgY29udGV4dC5zdGF0ZS52ZWwgPSBkdiAvIGR0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29udGV4dC5zdGF0ZS52ZWwgPSAwLjA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgYSA9IE1hdGguc2lnbiggdiAtIGNvbnRleHQuc3RhdGUucG9zICkgKiBjb250ZXh0LnBhcmFtcy5hO1xuICAgIGNvbnRleHQuc3RhdGUudmVsICs9IGEgKiBkdDtcbiAgICBjb250ZXh0LnN0YXRlLnBvcyArPSBjb250ZXh0LnN0YXRlLnZlbCAqIGR0O1xuXG4gICAgaWYgKCBNYXRoLnNpZ24oIGEgKSAhPT0gTWF0aC5zaWduKCB2IC0gY29udGV4dC5zdGF0ZS5wb3MgKSApIHtcbiAgICAgIGNvbnRleHQuc3RhdGUudmVsICo9IC1jb250ZXh0LnBhcmFtcy5lO1xuICAgICAgY29udGV4dC5zdGF0ZS5wb3MgPSB2ICsgY29udGV4dC5wYXJhbXMuZSAqICggdiAtIGNvbnRleHQuc3RhdGUucG9zICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbnRleHQuc3RhdGUucG9zO1xuICB9XG59O1xuIiwiaW1wb3J0IHR5cGUgeyBGeERlZmluaXRpb24gfSBmcm9tICdAZm1zLWNhdC9hdXRvbWF0b24nO1xuXG5leHBvcnQgY29uc3QgbG9maTogRnhEZWZpbml0aW9uID0ge1xuICBuYW1lOiAnTG8tRmknLFxuICBkZXNjcmlwdGlvbjogJ01ha2UgY3VydmUgbW9yZSBjcnVuY2h5LicsXG4gIHBhcmFtczoge1xuICAgIHJhdGU6IHsgbmFtZTogJ0ZyYW1lIFJhdGUnLCB0eXBlOiAnZmxvYXQnLCBkZWZhdWx0OiAxMC4wLCBtaW46IDAuMCwgbWF4OiAxMDAwLjAgfSxcbiAgICByZWxhdGl2ZTogeyBuYW1lOiAnUmVsYXRpdmUnLCB0eXBlOiAnYm9vbGVhbicsIGRlZmF1bHQ6IGZhbHNlIH0sXG4gICAgcmVzbzogeyBuYW1lOiAnUmVzbyBQZXIgVW5pdCcsIHR5cGU6ICdmbG9hdCcsIGRlZmF1bHQ6IDEwLjAsIG1pbjogMC4wLCBtYXg6IDEwMDAuMCB9LFxuICAgIHJvdW5kOiB7IG5hbWU6ICdSb3VuZCcsIHR5cGU6ICdib29sZWFuJywgZGVmYXVsdDogZmFsc2UgfVxuICB9LFxuICBmdW5jKCBjb250ZXh0ICkge1xuICAgIGxldCB0O1xuICAgIGlmICggY29udGV4dC5wYXJhbXMucmF0ZSA9PT0gMC4wICkge1xuICAgICAgdCA9IGNvbnRleHQudGltZTtcbiAgICB9IGVsc2UgaWYgKCBjb250ZXh0LnBhcmFtcy5yZWxhdGl2ZSApIHtcbiAgICAgIHQgPSBjb250ZXh0LnQwICsgTWF0aC5mbG9vcihcbiAgICAgICAgKCBjb250ZXh0LnRpbWUgLSBjb250ZXh0LnQwICkgKiBjb250ZXh0LnBhcmFtcy5yYXRlXG4gICAgICApIC8gY29udGV4dC5wYXJhbXMucmF0ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdCA9IE1hdGguZmxvb3IoICggY29udGV4dC50aW1lICkgKiBjb250ZXh0LnBhcmFtcy5yYXRlICkgLyBjb250ZXh0LnBhcmFtcy5yYXRlO1xuICAgIH1cblxuICAgIGxldCB2ID0gY29udGV4dC5nZXRWYWx1ZSggdCApO1xuICAgIGlmICggY29udGV4dC5wYXJhbXMucmVzbyAhPT0gMC4wICkge1xuICAgICAgdiA9IE1hdGguZmxvb3IoXG4gICAgICAgIHYgKiBjb250ZXh0LnBhcmFtcy5yZXNvICsgKCBjb250ZXh0LnBhcmFtcy5yb3VuZCA/IDAuNSA6IDAuMCApXG4gICAgICApIC8gY29udGV4dC5wYXJhbXMucmVzbztcbiAgICB9XG4gICAgcmV0dXJuIHY7XG4gIH1cbn07XG4iLCJleHBvcnQgZnVuY3Rpb24gc21vb3Roc3RlcCggYTogbnVtYmVyLCBiOiBudW1iZXIsIGs6IG51bWJlciApOiBudW1iZXIge1xuICBjb25zdCBzbW9vdGggPSBrICogayAqICggMy4wIC0gMi4wICogayApO1xuICByZXR1cm4gYSArICggYiAtIGEgKSAqIHNtb290aDtcbn1cbiIsImV4cG9ydCBjbGFzcyBYb3JzaGlmdCB7XG4gIHByaXZhdGUgX19zZWVkOiBudW1iZXIgPSAxO1xuXG4gIHB1YmxpYyBjb25zdHJ1Y3Rvciggc2VlZD86IG51bWJlciApIHtcbiAgICB0aGlzLnNldCggc2VlZCApO1xuICB9XG5cbiAgcHVibGljIGdlbiggc2VlZD86IG51bWJlciApOiBudW1iZXIge1xuICAgIGlmICggc2VlZCApIHsgdGhpcy5zZXQoIHNlZWQgKTsgfVxuICAgIHRoaXMuX19zZWVkID0gdGhpcy5fX3NlZWQgXiAoIHRoaXMuX19zZWVkIDw8IDEzICk7XG4gICAgdGhpcy5fX3NlZWQgPSB0aGlzLl9fc2VlZCBeICggdGhpcy5fX3NlZWQgPj4+IDE3ICk7XG4gICAgdGhpcy5fX3NlZWQgPSB0aGlzLl9fc2VlZCBeICggdGhpcy5fX3NlZWQgPDwgNSApO1xuICAgIHJldHVybiB0aGlzLl9fc2VlZCAvIE1hdGgucG93KCAyLCAzMiApICsgMC41O1xuICB9XG5cbiAgcHVibGljIHNldCggc2VlZDogbnVtYmVyID0gMSApOiB2b2lkIHtcbiAgICB0aGlzLl9fc2VlZCA9IHNlZWQ7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgWG9yc2hpZnQ7XG4iLCJpbXBvcnQgeyBzbW9vdGhzdGVwIH0gZnJvbSAnLi4vdXRpbHMvc21vb3Roc3RlcCc7XG5pbXBvcnQgWG9yc2hpZnQgZnJvbSAnLi4vdXRpbHMveG9yc2hpZnQnO1xuaW1wb3J0IHR5cGUgeyBGeERlZmluaXRpb24gfSBmcm9tICdAZm1zLWNhdC9hdXRvbWF0b24nO1xuXG5jb25zdCB4b3JzaGlmdCA9IG5ldyBYb3JzaGlmdCgpO1xuXG5leHBvcnQgY29uc3Qgbm9pc2U6IEZ4RGVmaW5pdGlvbiA9IHtcbiAgbmFtZTogJ0ZyYWN0YWwgTm9pc2UnLFxuICBkZXNjcmlwdGlvbjogJ3dpZ2dsZSgpJyxcbiAgcGFyYW1zOiB7XG4gICAgcmVjdXJzaW9uOiB7IG5hbWU6ICdSZWN1cnNpb24nLCB0eXBlOiAnaW50JywgZGVmYXVsdDogNCwgbWluOiAxLCBtYXg6IDk5IH0sXG4gICAgZnJlcTogeyBuYW1lOiAnRnJlcXVlbmN5JywgdHlwZTogJ2Zsb2F0JywgZGVmYXVsdDogMS4wLCBtaW46IDAuMCB9LFxuICAgIHJlc286IHsgbmFtZTogJ1Jlc29sdXRpb24nLCB0eXBlOiAnZmxvYXQnLCBkZWZhdWx0OiA4LjAsIG1pbjogMS4wIH0sXG4gICAgc2VlZDogeyBuYW1lOiAnU2VlZCcsIHR5cGU6ICdpbnQnLCBkZWZhdWx0OiAxLCBtaW46IDAgfSxcbiAgICBhbXA6IHsgbmFtZTogJ0FtcCcsIHR5cGU6ICdmbG9hdCcsIGRlZmF1bHQ6IDAuMiB9XG4gIH0sXG4gIGZ1bmMoIGNvbnRleHQgKSB7XG4gICAgaWYgKCBjb250ZXh0LmluaXQgKSB7XG4gICAgICB4b3JzaGlmdC5nZW4oIGNvbnRleHQucGFyYW1zLnNlZWQgKTtcblxuICAgICAgY29udGV4dC5zdGF0ZS50YWJsZSA9IG5ldyBGbG9hdDMyQXJyYXkoIE1hdGguZmxvb3IoIGNvbnRleHQucGFyYW1zLnJlc28gKSArIDIgKTtcbiAgICAgIGZvciAoIGxldCBpID0gMTsgaSA8IGNvbnRleHQucGFyYW1zLnJlc287IGkgKysgKSB7XG4gICAgICAgIGNvbnRleHQuc3RhdGUudGFibGVbIGkgXSA9IHhvcnNoaWZ0LmdlbigpICogMi4wIC0gMS4wO1xuICAgICAgfVxuICAgIH1cblxuICAgIGxldCB2ID0gY29udGV4dC52YWx1ZTtcbiAgICBjb25zdCBwID0gY29udGV4dC5wcm9ncmVzcztcblxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGNvbnRleHQucGFyYW1zLnJlY3Vyc2lvbjsgaSArKyApIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gKFxuICAgICAgICBwICogY29udGV4dC5wYXJhbXMuZnJlcSAqIGNvbnRleHQucGFyYW1zLnJlc28gKiBNYXRoLnBvdyggMi4wLCBpIClcbiAgICAgICkgJSBjb250ZXh0LnBhcmFtcy5yZXNvO1xuICAgICAgY29uc3QgaW5kZXhpID0gTWF0aC5mbG9vciggaW5kZXggKTtcbiAgICAgIGNvbnN0IGluZGV4ZiA9IGluZGV4IC0gaW5kZXhpO1xuICAgICAgY29uc3QgZmFjdG9yID0gTWF0aC5wb3coIDAuNSwgaSArIDEuMCApO1xuXG4gICAgICB2ICs9IGNvbnRleHQucGFyYW1zLmFtcCAqIGZhY3RvciAqIHNtb290aHN0ZXAoXG4gICAgICAgIGNvbnRleHQuc3RhdGUudGFibGVbIGluZGV4aSBdLFxuICAgICAgICBjb250ZXh0LnN0YXRlLnRhYmxlWyBpbmRleGkgKyAxIF0sXG4gICAgICAgIGluZGV4ZlxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIHY7XG4gIH1cbn07XG4iLCJpbXBvcnQgdHlwZSB7IEZ4RGVmaW5pdGlvbiB9IGZyb20gJ0BmbXMtY2F0L2F1dG9tYXRvbic7XG5cbmV4cG9ydCBjb25zdCBwb3c6IEZ4RGVmaW5pdGlvbiA9IHtcbiAgbmFtZTogJ1Bvd2VyJyxcbiAgZGVzY3JpcHRpb246ICdZb3UgZ290IGJvb3N0IHBvd2VyIScsXG4gIHBhcmFtczoge1xuICAgIHBvdzogeyBuYW1lOiAnUG93ZXInLCB0eXBlOiAnZmxvYXQnLCBkZWZhdWx0OiAyLjAgfSxcbiAgICBiaWFzOiB7IG5hbWU6ICdCaWFzJywgdHlwZTogJ2Zsb2F0JywgZGVmYXVsdDogMC4wIH0sXG4gICAgcG9zaXRpdmU6IHsgbmFtZTogJ0ZvcmNlIFBvc2l0aXZlJywgdHlwZTogJ2Jvb2xlYW4nLCBkZWZhdWx0OiBmYWxzZSB9XG4gIH0sXG4gIGZ1bmMoIGNvbnRleHQgKSB7XG4gICAgY29uc3QgdiA9IGNvbnRleHQudmFsdWUgLSBjb250ZXh0LnBhcmFtcy5iaWFzO1xuICAgIGNvbnN0IHNpZ24gPSBjb250ZXh0LnBhcmFtcy5wb3NpdGl2ZSA/IDEuMCA6IE1hdGguc2lnbiggdiApO1xuICAgIHJldHVybiBNYXRoLnBvdyhcbiAgICAgIE1hdGguYWJzKCB2ICksXG4gICAgICBjb250ZXh0LnBhcmFtcy5wb3dcbiAgICApICogc2lnbiArIGNvbnRleHQucGFyYW1zLmJpYXM7XG4gIH1cbn07XG4iLCJpbXBvcnQgdHlwZSB7IEZ4RGVmaW5pdGlvbiB9IGZyb20gJ0BmbXMtY2F0L2F1dG9tYXRvbic7XG5cbmNvbnN0IFRBVSA9IE1hdGguUEkgKiAyLjA7XG5cbmV4cG9ydCBjb25zdCBzaW5lOiBGeERlZmluaXRpb24gPSB7XG4gIG5hbWU6ICdTaW5ld2F2ZScsXG4gIGRlc2NyaXB0aW9uOiAnT3ZlcmxheSBhIHNpbmV3YXZlIHRvIHRoZSBjdXJ2ZS4nLFxuICBwYXJhbXM6IHtcbiAgICBhbXA6IHsgbmFtZTogJ0FtcCcsIHR5cGU6ICdmbG9hdCcsIGRlZmF1bHQ6IDAuMSB9LFxuICAgIGZyZXE6IHsgbmFtZTogJ0ZyZXF1ZW5jeScsIHR5cGU6ICdmbG9hdCcsIGRlZmF1bHQ6IDUuMCB9LFxuICAgIHBoYXNlOiB7IG5hbWU6ICdQaGFzZScsIHR5cGU6ICdmbG9hdCcsIGRlZmF1bHQ6IDAuMCwgbWluOiAwLjAsIG1heDogMS4wIH1cbiAgfSxcbiAgZnVuYyggY29udGV4dCApIHtcbiAgICBjb25zdCB2ID0gY29udGV4dC52YWx1ZTtcbiAgICBjb25zdCBwID0gY29udGV4dC5wcm9ncmVzcyAqIGNvbnRleHQucGFyYW1zLmZyZXEgKyBjb250ZXh0LnBhcmFtcy5waGFzZTtcbiAgICByZXR1cm4gdiArIGNvbnRleHQucGFyYW1zLmFtcCAqIE1hdGguc2luKCBwICogVEFVICk7XG4gIH1cbn07XG4iLCJpbXBvcnQgdHlwZSB7IEZ4RGVmaW5pdGlvbiB9IGZyb20gJ0BmbXMtY2F0L2F1dG9tYXRvbic7XG5cbmV4cG9ydCBjb25zdCBhZGQ6IEZ4RGVmaW5pdGlvbiA9IHtcbiAgbmFtZTogJ0FkZCcsXG4gIGRlc2NyaXB0aW9uOiAnVGhlIHNpbXBsZXN0IGZ4IGV2ZXIuIEp1c3QgYWRkIGEgY29uc3RhbnQgdmFsdWUgdG8gdGhlIGN1cnZlLicsXG4gIHBhcmFtczoge1xuICAgIHZhbHVlOiB7IG5hbWU6ICdWYWx1ZScsIHR5cGU6ICdmbG9hdCcsIGRlZmF1bHQ6IDEuMCB9XG4gIH0sXG4gIGZ1bmMoIGNvbnRleHQgKSB7XG4gICAgcmV0dXJuIGNvbnRleHQudmFsdWUgKyBjb250ZXh0LnBhcmFtcy52YWx1ZTtcbiAgfVxufTtcbiIsImltcG9ydCB0eXBlIHsgRnhEZWZpbml0aW9uIH0gZnJvbSAnQGZtcy1jYXQvYXV0b21hdG9uJztcblxuZXhwb3J0IGNvbnN0IGNkczogRnhEZWZpbml0aW9uID0ge1xuICBuYW1lOiAnQ3JpdGljYWxseSBEYW1wZWQgU3ByaW5nJyxcbiAgZGVzY3JpcHRpb246ICdCYXNpY2FsbHkgdGhlIGJlc3Qgc21vb3RoaW5nIG1ldGhvZC4gU2hvdXRvdXRzIHRvIEtlaWppcm8gVGFrYWhhc2hpJyxcbiAgcGFyYW1zOiB7XG4gICAgZmFjdG9yOiB7IG5hbWU6ICdGYWN0b3InLCB0eXBlOiAnZmxvYXQnLCBkZWZhdWx0OiAxMDAuMCwgbWluOiAwLjAgfSxcbiAgICByYXRpbzogeyBuYW1lOiAnRGFtcCBSYXRpbycsIHR5cGU6ICdmbG9hdCcsIGRlZmF1bHQ6IDEuMCB9LFxuICAgIHByZXNlcnZlOiB7IG5hbWU6ICdQcmVzZXJ2ZSBWZWxvY2l0eScsIHR5cGU6ICdib29sZWFuJywgZGVmYXVsdDogZmFsc2UgfVxuICB9LFxuICBmdW5jKCBjb250ZXh0ICkge1xuICAgIGNvbnN0IGR0ID0gY29udGV4dC5kZWx0YVRpbWU7XG4gICAgY29uc3QgdiA9IGNvbnRleHQudmFsdWU7XG4gICAgY29uc3QgayA9IGNvbnRleHQucGFyYW1zLmZhY3RvcjtcblxuICAgIGlmICggY29udGV4dC5pbml0ICkge1xuICAgICAgY29udGV4dC5zdGF0ZS5wb3MgPSBjb250ZXh0LnZhbHVlO1xuICAgICAgaWYgKCBjb250ZXh0LnBhcmFtcy5wcmVzZXJ2ZSApIHtcbiAgICAgICAgY29uc3QgZHYgPSB2IC0gY29udGV4dC5nZXRWYWx1ZSggY29udGV4dC50aW1lIC0gZHQgKTtcbiAgICAgICAgY29udGV4dC5zdGF0ZS52ZWwgPSBkdiAvIGR0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29udGV4dC5zdGF0ZS52ZWwgPSAwLjA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29udGV4dC5zdGF0ZS52ZWwgKz0gKFxuICAgICAgLWsgKiAoIGNvbnRleHQuc3RhdGUucG9zIC0gdiApXG4gICAgICAtIDIuMCAqIGNvbnRleHQuc3RhdGUudmVsICogTWF0aC5zcXJ0KCBrICkgKiBjb250ZXh0LnBhcmFtcy5yYXRpb1xuICAgICkgKiBkdDtcbiAgICBjb250ZXh0LnN0YXRlLnBvcyArPSBjb250ZXh0LnN0YXRlLnZlbCAqIGR0O1xuICAgIHJldHVybiBjb250ZXh0LnN0YXRlLnBvcztcbiAgfVxufTtcbiIsImltcG9ydCB7IGNsYW1wIGFzIHJhd0NsYW1wIH0gZnJvbSAnLi91dGlscy9jbGFtcCc7XG5pbXBvcnQgeyBzbWluIH0gZnJvbSAnLi91dGlscy9zbWluJztcbmltcG9ydCB0eXBlIHsgRnhEZWZpbml0aW9uIH0gZnJvbSAnQGZtcy1jYXQvYXV0b21hdG9uJztcblxuZXhwb3J0IGNvbnN0IGNsYW1wOiBGeERlZmluaXRpb24gPSB7XG4gIG5hbWU6ICdDbGFtcCcsXG4gIGRlc2NyaXB0aW9uOiAnQ29uc3RyYWluIHRoZSBjdXJ2ZSBiZXR3ZWVuIHR3byB2YWx1ZXMsIGZlYXR1cmluZyBzbW9vdGggbWluaW11bS4nLFxuICBwYXJhbXM6IHtcbiAgICBtaW46IHsgbmFtZTogJ01pbicsIHR5cGU6ICdmbG9hdCcsIGRlZmF1bHQ6IDAuMCB9LFxuICAgIG1heDogeyBuYW1lOiAnTWF4JywgdHlwZTogJ2Zsb2F0JywgZGVmYXVsdDogMS4wIH0sXG4gICAgc21vb3RoOiB7IG5hbWU6ICdTbW9vdGgnLCB0eXBlOiAnZmxvYXQnLCBkZWZhdWx0OiAwLjAsIG1pbjogMC4wIH1cbiAgfSxcbiAgZnVuYyggY29udGV4dCApIHtcbiAgICBpZiAoIGNvbnRleHQucGFyYW1zLnNtb290aCA9PT0gMC4wICkge1xuICAgICAgcmV0dXJuIHJhd0NsYW1wKCBjb250ZXh0LnZhbHVlLCBjb250ZXh0LnBhcmFtcy5taW4sIGNvbnRleHQucGFyYW1zLm1heCApO1xuICAgIH1cblxuICAgIGNvbnN0IHYgPSAtc21pbiggLWNvbnRleHQucGFyYW1zLm1pbiwgLWNvbnRleHQudmFsdWUsIGNvbnRleHQucGFyYW1zLnNtb290aCApO1xuICAgIHJldHVybiBzbWluKCBjb250ZXh0LnBhcmFtcy5tYXgsIHYsIGNvbnRleHQucGFyYW1zLnNtb290aCApO1xuICB9XG59O1xuIiwiaW1wb3J0IHR5cGUgeyBGeERlZmluaXRpb24gfSBmcm9tICdAZm1zLWNhdC9hdXRvbWF0b24nO1xuXG5leHBvcnQgY29uc3QgZXhwOiBGeERlZmluaXRpb24gPSB7XG4gIG5hbWU6ICdFeHBvbmVudGlhbCBTbW9vdGhpbmcnLFxuICBkZXNjcmlwdGlvbjogJ1Ntb290aCB0aGUgY3VydmUuIFNpbXBsZSBidXQgZ29vZC4nLFxuICBwYXJhbXM6IHtcbiAgICBmYWN0b3I6IHsgbmFtZTogJ0ZhY3RvcicsIHR5cGU6ICdmbG9hdCcsIGRlZmF1bHQ6IDEwLjAsIG1pbjogMC4wIH1cbiAgfSxcbiAgZnVuYyggY29udGV4dCApIHtcbiAgICBjb25zdCB2ID0gY29udGV4dC52YWx1ZTtcblxuICAgIGlmICggY29udGV4dC5pbml0ICkge1xuICAgICAgY29udGV4dC5zdGF0ZS5wb3MgPSB2O1xuICAgIH1cblxuICAgIGNvbnN0IGsgPSBNYXRoLmV4cCggLWNvbnRleHQuZGVsdGFUaW1lICogY29udGV4dC5wYXJhbXMuZmFjdG9yICk7XG4gICAgY29udGV4dC5zdGF0ZS5wb3MgPSBjb250ZXh0LnN0YXRlLnBvcyAqIGsgKyB2ICogKCAxLjAgLSBrICk7XG4gICAgcmV0dXJuIGNvbnRleHQuc3RhdGUucG9zO1xuICB9XG59O1xuIiwiaW1wb3J0IHR5cGUgeyBGeERlZmluaXRpb24gfSBmcm9tICdAZm1zLWNhdC9hdXRvbWF0b24nO1xuXG5leHBvcnQgY29uc3QgZ3Jhdml0eTogRnhEZWZpbml0aW9uID0ge1xuICBuYW1lOiAnR3Jhdml0eScsXG4gIGRlc2NyaXB0aW9uOiAnQWNjZWxlcmF0ZSBhbmQgYm91bmNlIHRoZSBjdXJ2ZS4nLFxuICBwYXJhbXM6IHtcbiAgICBhOiB7IG5hbWU6ICdBY2NlbGVyYXRpb24nLCB0eXBlOiAnZmxvYXQnLCBkZWZhdWx0OiA5LjggfSxcbiAgICBlOiB7IG5hbWU6ICdSZXN0aXR1dGlvbicsIHR5cGU6ICdmbG9hdCcsIGRlZmF1bHQ6IDAuNSwgbWluOiAwLjAgfSxcbiAgICBwcmVzZXJ2ZTogeyBuYW1lOiAnUHJlc2VydmUgVmVsb2NpdHknLCB0eXBlOiAnYm9vbGVhbicsIGRlZmF1bHQ6IGZhbHNlIH1cbiAgfSxcbiAgZnVuYyggY29udGV4dCApIHtcbiAgICBjb25zdCBkdCA9IGNvbnRleHQuZGVsdGFUaW1lO1xuICAgIGNvbnN0IHYgPSBjb250ZXh0LnZhbHVlO1xuXG4gICAgaWYgKCBjb250ZXh0LmluaXQgKSB7XG4gICAgICBjb250ZXh0LnN0YXRlLnBvcyA9IHY7XG4gICAgICBpZiAoIGNvbnRleHQucGFyYW1zLnByZXNlcnZlICkge1xuICAgICAgICBjb25zdCBkdiA9IHYgLSBjb250ZXh0LmdldFZhbHVlKCBjb250ZXh0LnRpbWUgLSBkdCApO1xuICAgICAgICBjb250ZXh0LnN0YXRlLnZlbCA9IGR2IC8gZHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb250ZXh0LnN0YXRlLnZlbCA9IDAuMDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBhID0gTWF0aC5zaWduKCB2IC0gY29udGV4dC5zdGF0ZS5wb3MgKSAqIGNvbnRleHQucGFyYW1zLmE7XG4gICAgY29udGV4dC5zdGF0ZS52ZWwgKz0gYSAqIGR0O1xuICAgIGNvbnRleHQuc3RhdGUucG9zICs9IGNvbnRleHQuc3RhdGUudmVsICogZHQ7XG5cbiAgICBpZiAoIE1hdGguc2lnbiggYSApICE9PSBNYXRoLnNpZ24oIHYgLSBjb250ZXh0LnN0YXRlLnBvcyApICkge1xuICAgICAgY29udGV4dC5zdGF0ZS52ZWwgKj0gLWNvbnRleHQucGFyYW1zLmU7XG4gICAgICBjb250ZXh0LnN0YXRlLnBvcyA9IHYgKyBjb250ZXh0LnBhcmFtcy5lICogKCB2IC0gY29udGV4dC5zdGF0ZS5wb3MgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY29udGV4dC5zdGF0ZS5wb3M7XG4gIH1cbn07XG4iLCJpbXBvcnQgdHlwZSB7IEZ4RGVmaW5pdGlvbiB9IGZyb20gJ0BmbXMtY2F0L2F1dG9tYXRvbic7XG5cbmV4cG9ydCBjb25zdCBoZXJtaXRlUGF0Y2g6IEZ4RGVmaW5pdGlvbiA9IHtcbiAgbmFtZTogJ0hlcm1pdGUgUGF0Y2gnLFxuICBkZXNjcmlwdGlvbjogJ1BhdGNoIGEgY3VydmUgdXNpbmcgaGVybWl0ZSBzcGxpbmUuJyxcbiAgcGFyYW1zOiB7fSxcbiAgZnVuYyggY29udGV4dCApIHtcbiAgICBpZiAoIGNvbnRleHQuaW5pdCApIHtcbiAgICAgIGNvbnN0IGR0ID0gY29udGV4dC5kZWx0YVRpbWU7XG5cbiAgICAgIGNvbnN0IHYwID0gY29udGV4dC5nZXRWYWx1ZSggY29udGV4dC50MCApO1xuICAgICAgY29uc3QgZHYwID0gdjAgLSBjb250ZXh0LmdldFZhbHVlKCBjb250ZXh0LnQwIC0gZHQgKTtcbiAgICAgIGNvbnN0IHYxID0gY29udGV4dC5nZXRWYWx1ZSggY29udGV4dC50MSApO1xuICAgICAgY29uc3QgZHYxID0gdjEgLSBjb250ZXh0LmdldFZhbHVlKCBjb250ZXh0LnQxIC0gZHQgKTtcblxuICAgICAgY29udGV4dC5zdGF0ZS5wMCA9IHYwO1xuICAgICAgY29udGV4dC5zdGF0ZS5tMCA9IGR2MCAvIGR0ICogY29udGV4dC5sZW5ndGg7XG4gICAgICBjb250ZXh0LnN0YXRlLnAxID0gdjE7XG4gICAgICBjb250ZXh0LnN0YXRlLm0xID0gZHYxIC8gZHQgKiBjb250ZXh0Lmxlbmd0aDtcbiAgICB9XG5cbiAgICBjb25zdCB7IHAwLCBtMCwgcDEsIG0xIH0gPSBjb250ZXh0LnN0YXRlO1xuICAgIGNvbnN0IHQgPSBjb250ZXh0LnByb2dyZXNzO1xuXG4gICAgcmV0dXJuIChcbiAgICAgICggKCAyLjAgKiB0IC0gMy4wICkgKiB0ICogdCArIDEuMCApICogcDAgK1xuICAgICAgKCAoICggdCAtIDIuMCApICogdCArIDEuMCApICogdCApICogbTAgK1xuICAgICAgKCAoIC0yLjAgKiB0ICsgMy4wICkgKiB0ICogdCApICogcDEgK1xuICAgICAgKCAoIHQgLSAxLjAgKSAqIHQgKiB0ICkgKiBtMVxuICAgICk7XG4gIH1cbn07XG4iLCJpbXBvcnQgdHlwZSB7IEZ4RGVmaW5pdGlvbiB9IGZyb20gJ0BmbXMtY2F0L2F1dG9tYXRvbic7XG5cbmV4cG9ydCBjb25zdCBsb2ZpOiBGeERlZmluaXRpb24gPSB7XG4gIG5hbWU6ICdMby1GaScsXG4gIGRlc2NyaXB0aW9uOiAnTWFrZSBjdXJ2ZSBtb3JlIGNydW5jaHkuJyxcbiAgcGFyYW1zOiB7XG4gICAgcmF0ZTogeyBuYW1lOiAnRnJhbWUgUmF0ZScsIHR5cGU6ICdmbG9hdCcsIGRlZmF1bHQ6IDEwLjAsIG1pbjogMC4wLCBtYXg6IDEwMDAuMCB9LFxuICAgIHJlbGF0aXZlOiB7IG5hbWU6ICdSZWxhdGl2ZScsIHR5cGU6ICdib29sZWFuJywgZGVmYXVsdDogZmFsc2UgfSxcbiAgICByZXNvOiB7IG5hbWU6ICdSZXNvIFBlciBVbml0JywgdHlwZTogJ2Zsb2F0JywgZGVmYXVsdDogMTAuMCwgbWluOiAwLjAsIG1heDogMTAwMC4wIH0sXG4gICAgcm91bmQ6IHsgbmFtZTogJ1JvdW5kJywgdHlwZTogJ2Jvb2xlYW4nLCBkZWZhdWx0OiBmYWxzZSB9XG4gIH0sXG4gIGZ1bmMoIGNvbnRleHQgKSB7XG4gICAgbGV0IHQ7XG4gICAgaWYgKCBjb250ZXh0LnBhcmFtcy5yYXRlID09PSAwLjAgKSB7XG4gICAgICB0ID0gY29udGV4dC50aW1lO1xuICAgIH0gZWxzZSBpZiAoIGNvbnRleHQucGFyYW1zLnJlbGF0aXZlICkge1xuICAgICAgdCA9IGNvbnRleHQudDAgKyBNYXRoLmZsb29yKFxuICAgICAgICAoIGNvbnRleHQudGltZSAtIGNvbnRleHQudDAgKSAqIGNvbnRleHQucGFyYW1zLnJhdGVcbiAgICAgICkgLyBjb250ZXh0LnBhcmFtcy5yYXRlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0ID0gTWF0aC5mbG9vciggKCBjb250ZXh0LnRpbWUgKSAqIGNvbnRleHQucGFyYW1zLnJhdGUgKSAvIGNvbnRleHQucGFyYW1zLnJhdGU7XG4gICAgfVxuXG4gICAgbGV0IHYgPSBjb250ZXh0LmdldFZhbHVlKCB0ICk7XG4gICAgaWYgKCBjb250ZXh0LnBhcmFtcy5yZXNvICE9PSAwLjAgKSB7XG4gICAgICB2ID0gTWF0aC5mbG9vcihcbiAgICAgICAgdiAqIGNvbnRleHQucGFyYW1zLnJlc28gKyAoIGNvbnRleHQucGFyYW1zLnJvdW5kID8gMC41IDogMC4wIClcbiAgICAgICkgLyBjb250ZXh0LnBhcmFtcy5yZXNvO1xuICAgIH1cbiAgICByZXR1cm4gdjtcbiAgfVxufTtcbiIsImltcG9ydCB7IHNtb290aHN0ZXAgfSBmcm9tICcuL3V0aWxzL3Ntb290aHN0ZXAnO1xuaW1wb3J0IFhvcnNoaWZ0IGZyb20gJy4vdXRpbHMveG9yc2hpZnQnO1xuaW1wb3J0IHR5cGUgeyBGeERlZmluaXRpb24gfSBmcm9tICdAZm1zLWNhdC9hdXRvbWF0b24nO1xuXG5jb25zdCB4b3JzaGlmdCA9IG5ldyBYb3JzaGlmdCgpO1xuXG5leHBvcnQgY29uc3Qgbm9pc2U6IEZ4RGVmaW5pdGlvbiA9IHtcbiAgbmFtZTogJ0ZyYWN0YWwgTm9pc2UnLFxuICBkZXNjcmlwdGlvbjogJ3dpZ2dsZSgpJyxcbiAgcGFyYW1zOiB7XG4gICAgcmVjdXJzaW9uOiB7IG5hbWU6ICdSZWN1cnNpb24nLCB0eXBlOiAnaW50JywgZGVmYXVsdDogNCwgbWluOiAxLCBtYXg6IDk5IH0sXG4gICAgZnJlcTogeyBuYW1lOiAnRnJlcXVlbmN5JywgdHlwZTogJ2Zsb2F0JywgZGVmYXVsdDogMS4wLCBtaW46IDAuMCB9LFxuICAgIHJlc286IHsgbmFtZTogJ1Jlc29sdXRpb24nLCB0eXBlOiAnZmxvYXQnLCBkZWZhdWx0OiA4LjAsIG1pbjogMS4wIH0sXG4gICAgc2VlZDogeyBuYW1lOiAnU2VlZCcsIHR5cGU6ICdpbnQnLCBkZWZhdWx0OiAxLCBtaW46IDAgfSxcbiAgICBhbXA6IHsgbmFtZTogJ0FtcCcsIHR5cGU6ICdmbG9hdCcsIGRlZmF1bHQ6IDAuMiB9XG4gIH0sXG4gIGZ1bmMoIGNvbnRleHQgKSB7XG4gICAgaWYgKCBjb250ZXh0LmluaXQgKSB7XG4gICAgICB4b3JzaGlmdC5nZW4oIGNvbnRleHQucGFyYW1zLnNlZWQgKTtcblxuICAgICAgY29udGV4dC5zdGF0ZS50YWJsZSA9IG5ldyBGbG9hdDMyQXJyYXkoIE1hdGguZmxvb3IoIGNvbnRleHQucGFyYW1zLnJlc28gKSArIDIgKTtcbiAgICAgIGZvciAoIGxldCBpID0gMTsgaSA8IGNvbnRleHQucGFyYW1zLnJlc287IGkgKysgKSB7XG4gICAgICAgIGNvbnRleHQuc3RhdGUudGFibGVbIGkgXSA9IHhvcnNoaWZ0LmdlbigpICogMi4wIC0gMS4wO1xuICAgICAgfVxuICAgIH1cblxuICAgIGxldCB2ID0gY29udGV4dC52YWx1ZTtcbiAgICBjb25zdCBwID0gY29udGV4dC5wcm9ncmVzcztcblxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGNvbnRleHQucGFyYW1zLnJlY3Vyc2lvbjsgaSArKyApIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gKFxuICAgICAgICBwICogY29udGV4dC5wYXJhbXMuZnJlcSAqIGNvbnRleHQucGFyYW1zLnJlc28gKiBNYXRoLnBvdyggMi4wLCBpIClcbiAgICAgICkgJSBjb250ZXh0LnBhcmFtcy5yZXNvO1xuICAgICAgY29uc3QgaW5kZXhpID0gTWF0aC5mbG9vciggaW5kZXggKTtcbiAgICAgIGNvbnN0IGluZGV4ZiA9IGluZGV4IC0gaW5kZXhpO1xuICAgICAgY29uc3QgZmFjdG9yID0gTWF0aC5wb3coIDAuNSwgaSArIDEuMCApO1xuXG4gICAgICB2ICs9IGNvbnRleHQucGFyYW1zLmFtcCAqIGZhY3RvciAqIHNtb290aHN0ZXAoXG4gICAgICAgIGNvbnRleHQuc3RhdGUudGFibGVbIGluZGV4aSBdLFxuICAgICAgICBjb250ZXh0LnN0YXRlLnRhYmxlWyBpbmRleGkgKyAxIF0sXG4gICAgICAgIGluZGV4ZlxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIHY7XG4gIH1cbn07XG4iLCJpbXBvcnQgdHlwZSB7IEZ4RGVmaW5pdGlvbiB9IGZyb20gJ0BmbXMtY2F0L2F1dG9tYXRvbic7XG5cbmV4cG9ydCBjb25zdCBwb3c6IEZ4RGVmaW5pdGlvbiA9IHtcbiAgbmFtZTogJ1Bvd2VyJyxcbiAgZGVzY3JpcHRpb246ICdZb3UgZ290IGJvb3N0IHBvd2VyIScsXG4gIHBhcmFtczoge1xuICAgIHBvdzogeyBuYW1lOiAnUG93ZXInLCB0eXBlOiAnZmxvYXQnLCBkZWZhdWx0OiAyLjAgfSxcbiAgICBiaWFzOiB7IG5hbWU6ICdCaWFzJywgdHlwZTogJ2Zsb2F0JywgZGVmYXVsdDogMC4wIH0sXG4gICAgcG9zaXRpdmU6IHsgbmFtZTogJ0ZvcmNlIFBvc2l0aXZlJywgdHlwZTogJ2Jvb2xlYW4nLCBkZWZhdWx0OiBmYWxzZSB9XG4gIH0sXG4gIGZ1bmMoIGNvbnRleHQgKSB7XG4gICAgY29uc3QgdiA9IGNvbnRleHQudmFsdWUgLSBjb250ZXh0LnBhcmFtcy5iaWFzO1xuICAgIGNvbnN0IHNpZ24gPSBjb250ZXh0LnBhcmFtcy5wb3NpdGl2ZSA/IDEuMCA6IE1hdGguc2lnbiggdiApO1xuICAgIHJldHVybiBNYXRoLnBvdyhcbiAgICAgIE1hdGguYWJzKCB2ICksXG4gICAgICBjb250ZXh0LnBhcmFtcy5wb3dcbiAgICApICogc2lnbiArIGNvbnRleHQucGFyYW1zLmJpYXM7XG4gIH1cbn07XG4iLCJpbXBvcnQgdHlwZSB7IEZ4RGVmaW5pdGlvbiB9IGZyb20gJ0BmbXMtY2F0L2F1dG9tYXRvbic7XG5cbmV4cG9ydCBjb25zdCByZXBlYXQ6IEZ4RGVmaW5pdGlvbiA9IHtcbiAgbmFtZTogJ1JlcGVhdCcsXG4gIGRlc2NyaXB0aW9uOiAnUmVwZWF0IGEgc2VjdGlvbiBvZiB0aGUgY3VydmUuJyxcbiAgcGFyYW1zOiB7XG4gICAgaW50ZXJ2YWw6IHsgbmFtZTogJ0ludGVydmFsJywgdHlwZTogJ2Zsb2F0JywgZGVmYXVsdDogMS4wLCBtaW46IDAuMCB9LFxuICB9LFxuICBmdW5jKCBjb250ZXh0ICkge1xuICAgIHJldHVybiBjb250ZXh0LmdldFZhbHVlKCBjb250ZXh0LnQwICsgY29udGV4dC5lbGFwc2VkICUgY29udGV4dC5wYXJhbXMuaW50ZXJ2YWwgKTtcbiAgfVxufTtcbiIsImltcG9ydCB0eXBlIHsgRnhEZWZpbml0aW9uIH0gZnJvbSAnQGZtcy1jYXQvYXV0b21hdG9uJztcblxuY29uc3QgVEFVID0gTWF0aC5QSSAqIDIuMDtcblxuZXhwb3J0IGNvbnN0IHNpbmU6IEZ4RGVmaW5pdGlvbiA9IHtcbiAgbmFtZTogJ1NpbmV3YXZlJyxcbiAgZGVzY3JpcHRpb246ICdPdmVybGF5IGEgc2luZXdhdmUgdG8gdGhlIGN1cnZlLicsXG4gIHBhcmFtczoge1xuICAgIGFtcDogeyBuYW1lOiAnQW1wJywgdHlwZTogJ2Zsb2F0JywgZGVmYXVsdDogMC4xIH0sXG4gICAgZnJlcTogeyBuYW1lOiAnRnJlcXVlbmN5JywgdHlwZTogJ2Zsb2F0JywgZGVmYXVsdDogNS4wIH0sXG4gICAgb2Zmc2V0OiB7IG5hbWU6ICdPZmZzZXQnLCB0eXBlOiAnZmxvYXQnLCBkZWZhdWx0OiAwLjAsIG1pbjogMC4wLCBtYXg6IDEuMCB9XG4gIH0sXG4gIGZ1bmMoIGNvbnRleHQgKSB7XG4gICAgY29uc3QgdiA9IGNvbnRleHQudmFsdWU7XG4gICAgY29uc3QgcCA9IGNvbnRleHQuZWxhcHNlZCAqIGNvbnRleHQucGFyYW1zLmZyZXEgKyBjb250ZXh0LnBhcmFtcy5vZmZzZXQ7XG4gICAgcmV0dXJuIHYgKyBjb250ZXh0LnBhcmFtcy5hbXAgKiBNYXRoLnNpbiggcCAqIFRBVSApO1xuICB9XG59O1xuIl0sIm5hbWVzIjpbImNsYW1wIiwicmF3Q2xhbXAiLCJhZGQiLCJjZHMiLCJleHAiLCJncmF2aXR5IiwibG9maSIsInhvcnNoaWZ0Iiwibm9pc2UiLCJwb3ciLCJUQVUiLCJzaW5lIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztJQUVPLE1BQU0s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
