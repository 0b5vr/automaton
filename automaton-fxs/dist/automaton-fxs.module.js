/*!
* @fms-cat/automaton-fxs v3.1.0
* Bunch of automaton fxs
*
* Copyright (c) 2020 FMS_Cat
* @fms-cat/automaton-fxs is distributed under MIT License
* https://github.com/FMS-Cat/automaton/blob/master/LICENSE
*/
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

export { add$1 as add, cds$1 as cds, clamp$2 as clamp, exp$1 as exp, gravity$1 as gravity, hermitePatch, lofi$1 as lofi, noise$1 as noise, pow$1 as pow, repeat, sine$1 as sine, index as v2compat };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b21hdG9uLWZ4cy5tb2R1bGUuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy92MmNvbXBhdC9hZGQudHMiLCIuLi9zcmMvdjJjb21wYXQvY2RzLnRzIiwiLi4vc3JjL3V0aWxzL2NsYW1wLnRzIiwiLi4vc3JjL3V0aWxzL3NtaW4udHMiLCIuLi9zcmMvdjJjb21wYXQvY2xhbXAudHMiLCIuLi9zcmMvdjJjb21wYXQvZXhwLnRzIiwiLi4vc3JjL3YyY29tcGF0L2dyYXZpdHkudHMiLCIuLi9zcmMvdjJjb21wYXQvbG9maS50cyIsIi4uL3NyYy91dGlscy9zbW9vdGhzdGVwLnRzIiwiLi4vc3JjL3V0aWxzL3hvcnNoaWZ0LnRzIiwiLi4vc3JjL3YyY29tcGF0L25vaXNlLnRzIiwiLi4vc3JjL3YyY29tcGF0L3Bvdy50cyIsIi4uL3NyYy92MmNvbXBhdC9zaW5lLnRzIiwiLi4vc3JjL2FkZC50cyIsIi4uL3NyYy9jZHMudHMiLCIuLi9zcmMvY2xhbXAudHMiLCIuLi9zcmMvZXhwLnRzIiwiLi4vc3JjL2dyYXZpdHkudHMiLCIuLi9zcmMvaGVybWl0ZVBhdGNoLnRzIiwiLi4vc3JjL2xvZmkudHMiLCIuLi9zcmMvbm9pc2UudHMiLCIuLi9zcmMvcG93LnRzIiwiLi4vc3JjL3JlcGVhdC50cyIsIi4uL3NyYy9zaW5lLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgRnhEZWZpbml0aW9uIH0gZnJvbSAnQGZtcy1jYXQvYXV0b21hdG9uJztcblxuZXhwb3J0IGNvbnN0IGFkZDogRnhEZWZpbml0aW9uID0ge1xuICBuYW1lOiAnQWRkJyxcbiAgZGVzY3JpcHRpb246ICdUaGUgc2ltcGxlc3QgZnggZXZlci4gSnVzdCBhZGQgYSBjb25zdGFudCB2YWx1ZSB0byB0aGUgY3VydmUuJyxcbiAgcGFyYW1zOiB7XG4gICAgdmFsdWU6IHsgbmFtZTogJ1ZhbHVlJywgdHlwZTogJ2Zsb2F0JywgZGVmYXVsdDogMS4wIH1cbiAgfSxcbiAgZnVuYyggY29udGV4dCApIHtcbiAgICByZXR1cm4gY29udGV4dC52YWx1ZSArIGNvbnRleHQucGFyYW1zLnZhbHVlO1xuICB9XG59O1xuIiwiaW1wb3J0IHR5cGUgeyBGeERlZmluaXRpb24gfSBmcm9tICdAZm1zLWNhdC9hdXRvbWF0b24nO1xuXG5leHBvcnQgY29uc3QgY2RzOiBGeERlZmluaXRpb24gPSB7XG4gIG5hbWU6ICdDcml0aWNhbGx5IERhbXBlZCBTcHJpbmcnLFxuICBkZXNjcmlwdGlvbjogJ0Jhc2ljYWxseSB0aGUgYmVzdCBzbW9vdGhpbmcgbWV0aG9kLiBTaG91dG91dHMgdG8gS2VpamlybyBUYWthaGFzaGknLFxuICBwYXJhbXM6IHtcbiAgICBmYWN0b3I6IHsgbmFtZTogJ0ZhY3RvcicsIHR5cGU6ICdmbG9hdCcsIGRlZmF1bHQ6IDEwMC4wLCBtaW46IDAuMCB9LFxuICAgIHJhdGlvOiB7IG5hbWU6ICdEYW1wIFJhdGlvJywgdHlwZTogJ2Zsb2F0JywgZGVmYXVsdDogMS4wIH0sXG4gICAgcHJlc2VydmU6IHsgbmFtZTogJ1ByZXNlcnZlIFZlbG9jaXR5JywgdHlwZTogJ2Jvb2xlYW4nLCBkZWZhdWx0OiBmYWxzZSB9XG4gIH0sXG4gIGZ1bmMoIGNvbnRleHQgKSB7XG4gICAgY29uc3QgZHQgPSBjb250ZXh0LmRlbHRhVGltZTtcbiAgICBjb25zdCB2ID0gY29udGV4dC52YWx1ZTtcbiAgICBjb25zdCBrID0gY29udGV4dC5wYXJhbXMuZmFjdG9yO1xuXG4gICAgaWYgKCBjb250ZXh0LmluaXQgKSB7XG4gICAgICBjb250ZXh0LnN0YXRlLnBvcyA9IGNvbnRleHQudmFsdWU7XG4gICAgICBpZiAoIGNvbnRleHQucGFyYW1zLnByZXNlcnZlICkge1xuICAgICAgICBjb25zdCBkdiA9IHYgLSBjb250ZXh0LmdldFZhbHVlKCBjb250ZXh0LnRpbWUgLSBkdCApO1xuICAgICAgICBjb250ZXh0LnN0YXRlLnZlbCA9IGR2IC8gZHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb250ZXh0LnN0YXRlLnZlbCA9IDAuMDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb250ZXh0LnN0YXRlLnZlbCArPSAoXG4gICAgICAtayAqICggY29udGV4dC5zdGF0ZS5wb3MgLSB2IClcbiAgICAgIC0gMi4wICogY29udGV4dC5zdGF0ZS52ZWwgKiBNYXRoLnNxcnQoIGsgKSAqIGNvbnRleHQucGFyYW1zLnJhdGlvXG4gICAgKSAqIGR0O1xuICAgIGNvbnRleHQuc3RhdGUucG9zICs9IGNvbnRleHQuc3RhdGUudmVsICogZHQ7XG4gICAgcmV0dXJuIGNvbnRleHQuc3RhdGUucG9zO1xuICB9XG59O1xuIiwiZXhwb3J0IGZ1bmN0aW9uIGNsYW1wKCB4OiBudW1iZXIsIGE6IG51bWJlciwgYjogbnVtYmVyICk6IG51bWJlciB7XG4gIHJldHVybiBNYXRoLm1pbiggTWF0aC5tYXgoIHgsIGEgKSwgYiApO1xufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIHNtaW4oIGE6IG51bWJlciwgYjogbnVtYmVyLCBrOiBudW1iZXIgKTogbnVtYmVyIHtcbiAgY29uc3QgaCA9IE1hdGgubWF4KCBrIC0gTWF0aC5hYnMoIGEgLSBiICksIDAuMCApO1xuICByZXR1cm4gTWF0aC5taW4oIGEsIGIgKSAtIGggKiBoICogaCAvICggNi4wICogayAqIGsgKTtcbn1cbiIsImltcG9ydCB7IGNsYW1wIGFzIHJhd0NsYW1wIH0gZnJvbSAnLi4vdXRpbHMvY2xhbXAnO1xuaW1wb3J0IHsgc21pbiB9IGZyb20gJy4uL3V0aWxzL3NtaW4nO1xuaW1wb3J0IHR5cGUgeyBGeERlZmluaXRpb24gfSBmcm9tICdAZm1zLWNhdC9hdXRvbWF0b24nO1xuXG5leHBvcnQgY29uc3QgY2xhbXA6IEZ4RGVmaW5pdGlvbiA9IHtcbiAgbmFtZTogJ0NsYW1wJyxcbiAgZGVzY3JpcHRpb246ICdDb25zdHJhaW4gdGhlIGN1cnZlIGJldHdlZW4gdHdvIHZhbHVlcywgZmVhdHVyaW5nIHNtb290aCBtaW5pbXVtLicsXG4gIHBhcmFtczoge1xuICAgIG1pbjogeyBuYW1lOiAnTWluJywgdHlwZTogJ2Zsb2F0JywgZGVmYXVsdDogMC4wIH0sXG4gICAgbWF4OiB7IG5hbWU6ICdNYXgnLCB0eXBlOiAnZmxvYXQnLCBkZWZhdWx0OiAxLjAgfSxcbiAgICBzbW9vdGg6IHsgbmFtZTogJ1Ntb290aCcsIHR5cGU6ICdmbG9hdCcsIGRlZmF1bHQ6IDAuMCwgbWluOiAwLjAgfVxuICB9LFxuICBmdW5jKCBjb250ZXh0ICkge1xuICAgIGlmICggY29udGV4dC5wYXJhbXMuc21vb3RoID09PSAwLjAgKSB7XG4gICAgICByZXR1cm4gcmF3Q2xhbXAoIGNvbnRleHQudmFsdWUsIGNvbnRleHQucGFyYW1zLm1pbiwgY29udGV4dC5wYXJhbXMubWF4ICk7XG4gICAgfVxuXG4gICAgY29uc3QgdiA9IC1zbWluKCAtY29udGV4dC5wYXJhbXMubWluLCAtY29udGV4dC52YWx1ZSwgY29udGV4dC5wYXJhbXMuc21vb3RoICk7XG4gICAgcmV0dXJuIHNtaW4oIGNvbnRleHQucGFyYW1zLm1heCwgdiwgY29udGV4dC5wYXJhbXMuc21vb3RoICk7XG4gIH1cbn07XG4iLCJpbXBvcnQgdHlwZSB7IEZ4RGVmaW5pdGlvbiB9IGZyb20gJ0BmbXMtY2F0L2F1dG9tYXRvbic7XG5cbmV4cG9ydCBjb25zdCBleHA6IEZ4RGVmaW5pdGlvbiA9IHtcbiAgbmFtZTogJ0V4cG9uZW50aWFsIFNtb290aGluZycsXG4gIGRlc2NyaXB0aW9uOiAnU21vb3RoIHRoZSBjdXJ2ZS4gU2ltcGxlIGJ1dCBnb29kLicsXG4gIHBhcmFtczoge1xuICAgIGZhY3RvcjogeyBuYW1lOiAnRmFjdG9yJywgdHlwZTogJ2Zsb2F0JywgZGVmYXVsdDogMTAuMCwgbWluOiAwLjAgfVxuICB9LFxuICBmdW5jKCBjb250ZXh0ICkge1xuICAgIGNvbnN0IHYgPSBjb250ZXh0LnZhbHVlO1xuXG4gICAgaWYgKCBjb250ZXh0LmluaXQgKSB7XG4gICAgICBjb250ZXh0LnN0YXRlLnBvcyA9IHY7XG4gICAgfVxuXG4gICAgY29uc3QgayA9IE1hdGguZXhwKCAtY29udGV4dC5kZWx0YVRpbWUgKiBjb250ZXh0LnBhcmFtcy5mYWN0b3IgKTtcbiAgICBjb250ZXh0LnN0YXRlLnBvcyA9IGNvbnRleHQuc3RhdGUucG9zICogayArIHYgKiAoIDEuMCAtIGsgKTtcbiAgICByZXR1cm4gY29udGV4dC5zdGF0ZS5wb3M7XG4gIH1cbn07XG4iLCJpbXBvcnQgdHlwZSB7IEZ4RGVmaW5pdGlvbiB9IGZyb20gJ0BmbXMtY2F0L2F1dG9tYXRvbic7XG5cbmV4cG9ydCBjb25zdCBncmF2aXR5OiBGeERlZmluaXRpb24gPSB7XG4gIG5hbWU6ICdHcmF2aXR5JyxcbiAgZGVzY3JpcHRpb246ICdBY2NlbGVyYXRlIGFuZCBib3VuY2UgdGhlIGN1cnZlLicsXG4gIHBhcmFtczoge1xuICAgIGE6IHsgbmFtZTogJ0FjY2VsZXJhdGlvbicsIHR5cGU6ICdmbG9hdCcsIGRlZmF1bHQ6IDkuOCB9LFxuICAgIGU6IHsgbmFtZTogJ1Jlc3RpdHV0aW9uJywgdHlwZTogJ2Zsb2F0JywgZGVmYXVsdDogMC41LCBtaW46IDAuMCB9LFxuICAgIHByZXNlcnZlOiB7IG5hbWU6ICdQcmVzZXJ2ZSBWZWxvY2l0eScsIHR5cGU6ICdib29sZWFuJywgZGVmYXVsdDogZmFsc2UgfVxuICB9LFxuICBmdW5jKCBjb250ZXh0ICkge1xuICAgIGNvbnN0IGR0ID0gY29udGV4dC5kZWx0YVRpbWU7XG4gICAgY29uc3QgdiA9IGNvbnRleHQudmFsdWU7XG5cbiAgICBpZiAoIGNvbnRleHQuaW5pdCApIHtcbiAgICAgIGNvbnRleHQuc3RhdGUucG9zID0gdjtcbiAgICAgIGlmICggY29udGV4dC5wYXJhbXMucHJlc2VydmUgKSB7XG4gICAgICAgIGNvbnN0IGR2ID0gdiAtIGNvbnRleHQuZ2V0VmFsdWUoIGNvbnRleHQudGltZSAtIGR0ICk7XG4gICAgICAgIGNvbnRleHQuc3RhdGUudmVsID0gZHYgLyBkdDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnRleHQuc3RhdGUudmVsID0gMC4wO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGEgPSBNYXRoLnNpZ24oIHYgLSBjb250ZXh0LnN0YXRlLnBvcyApICogY29udGV4dC5wYXJhbXMuYTtcbiAgICBjb250ZXh0LnN0YXRlLnZlbCArPSBhICogZHQ7XG4gICAgY29udGV4dC5zdGF0ZS5wb3MgKz0gY29udGV4dC5zdGF0ZS52ZWwgKiBkdDtcblxuICAgIGlmICggTWF0aC5zaWduKCBhICkgIT09IE1hdGguc2lnbiggdiAtIGNvbnRleHQuc3RhdGUucG9zICkgKSB7XG4gICAgICBjb250ZXh0LnN0YXRlLnZlbCAqPSAtY29udGV4dC5wYXJhbXMuZTtcbiAgICAgIGNvbnRleHQuc3RhdGUucG9zID0gdiArIGNvbnRleHQucGFyYW1zLmUgKiAoIHYgLSBjb250ZXh0LnN0YXRlLnBvcyApO1xuICAgIH1cblxuICAgIHJldHVybiBjb250ZXh0LnN0YXRlLnBvcztcbiAgfVxufTtcbiIsImltcG9ydCB0eXBlIHsgRnhEZWZpbml0aW9uIH0gZnJvbSAnQGZtcy1jYXQvYXV0b21hdG9uJztcblxuZXhwb3J0IGNvbnN0IGxvZmk6IEZ4RGVmaW5pdGlvbiA9IHtcbiAgbmFtZTogJ0xvLUZpJyxcbiAgZGVzY3JpcHRpb246ICdNYWtlIGN1cnZlIG1vcmUgY3J1bmNoeS4nLFxuICBwYXJhbXM6IHtcbiAgICByYXRlOiB7IG5hbWU6ICdGcmFtZSBSYXRlJywgdHlwZTogJ2Zsb2F0JywgZGVmYXVsdDogMTAuMCwgbWluOiAwLjAsIG1heDogMTAwMC4wIH0sXG4gICAgcmVsYXRpdmU6IHsgbmFtZTogJ1JlbGF0aXZlJywgdHlwZTogJ2Jvb2xlYW4nLCBkZWZhdWx0OiBmYWxzZSB9LFxuICAgIHJlc286IHsgbmFtZTogJ1Jlc28gUGVyIFVuaXQnLCB0eXBlOiAnZmxvYXQnLCBkZWZhdWx0OiAxMC4wLCBtaW46IDAuMCwgbWF4OiAxMDAwLjAgfSxcbiAgICByb3VuZDogeyBuYW1lOiAnUm91bmQnLCB0eXBlOiAnYm9vbGVhbicsIGRlZmF1bHQ6IGZhbHNlIH1cbiAgfSxcbiAgZnVuYyggY29udGV4dCApIHtcbiAgICBsZXQgdDtcbiAgICBpZiAoIGNvbnRleHQucGFyYW1zLnJhdGUgPT09IDAuMCApIHtcbiAgICAgIHQgPSBjb250ZXh0LnRpbWU7XG4gICAgfSBlbHNlIGlmICggY29udGV4dC5wYXJhbXMucmVsYXRpdmUgKSB7XG4gICAgICB0ID0gY29udGV4dC50MCArIE1hdGguZmxvb3IoXG4gICAgICAgICggY29udGV4dC50aW1lIC0gY29udGV4dC50MCApICogY29udGV4dC5wYXJhbXMucmF0ZVxuICAgICAgKSAvIGNvbnRleHQucGFyYW1zLnJhdGU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHQgPSBNYXRoLmZsb29yKCAoIGNvbnRleHQudGltZSApICogY29udGV4dC5wYXJhbXMucmF0ZSApIC8gY29udGV4dC5wYXJhbXMucmF0ZTtcbiAgICB9XG5cbiAgICBsZXQgdiA9IGNvbnRleHQuZ2V0VmFsdWUoIHQgKTtcbiAgICBpZiAoIGNvbnRleHQucGFyYW1zLnJlc28gIT09IDAuMCApIHtcbiAgICAgIHYgPSBNYXRoLmZsb29yKFxuICAgICAgICB2ICogY29udGV4dC5wYXJhbXMucmVzbyArICggY29udGV4dC5wYXJhbXMucm91bmQgPyAwLjUgOiAwLjAgKVxuICAgICAgKSAvIGNvbnRleHQucGFyYW1zLnJlc287XG4gICAgfVxuICAgIHJldHVybiB2O1xuICB9XG59O1xuIiwiZXhwb3J0IGZ1bmN0aW9uIHNtb290aHN0ZXAoIGE6IG51bWJlciwgYjogbnVtYmVyLCBrOiBudW1iZXIgKTogbnVtYmVyIHtcbiAgY29uc3Qgc21vb3RoID0gayAqIGsgKiAoIDMuMCAtIDIuMCAqIGsgKTtcbiAgcmV0dXJuIGEgKyAoIGIgLSBhICkgKiBzbW9vdGg7XG59XG4iLCJleHBvcnQgY2xhc3MgWG9yc2hpZnQge1xuICBwcml2YXRlIF9fc2VlZDogbnVtYmVyID0gMTtcblxuICBwdWJsaWMgY29uc3RydWN0b3IoIHNlZWQ/OiBudW1iZXIgKSB7XG4gICAgdGhpcy5zZXQoIHNlZWQgKTtcbiAgfVxuXG4gIHB1YmxpYyBnZW4oIHNlZWQ/OiBudW1iZXIgKTogbnVtYmVyIHtcbiAgICBpZiAoIHNlZWQgKSB7IHRoaXMuc2V0KCBzZWVkICk7IH1cbiAgICB0aGlzLl9fc2VlZCA9IHRoaXMuX19zZWVkIF4gKCB0aGlzLl9fc2VlZCA8PCAxMyApO1xuICAgIHRoaXMuX19zZWVkID0gdGhpcy5fX3NlZWQgXiAoIHRoaXMuX19zZWVkID4+PiAxNyApO1xuICAgIHRoaXMuX19zZWVkID0gdGhpcy5fX3NlZWQgXiAoIHRoaXMuX19zZWVkIDw8IDUgKTtcbiAgICByZXR1cm4gdGhpcy5fX3NlZWQgLyBNYXRoLnBvdyggMiwgMzIgKSArIDAuNTtcbiAgfVxuXG4gIHB1YmxpYyBzZXQoIHNlZWQ6IG51bWJlciA9IDEgKTogdm9pZCB7XG4gICAgdGhpcy5fX3NlZWQgPSBzZWVkO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFhvcnNoaWZ0O1xuIiwiaW1wb3J0IHsgc21vb3Roc3RlcCB9IGZyb20gJy4uL3V0aWxzL3Ntb290aHN0ZXAnO1xuaW1wb3J0IFhvcnNoaWZ0IGZyb20gJy4uL3V0aWxzL3hvcnNoaWZ0JztcbmltcG9ydCB0eXBlIHsgRnhEZWZpbml0aW9uIH0gZnJvbSAnQGZtcy1jYXQvYXV0b21hdG9uJztcblxuY29uc3QgeG9yc2hpZnQgPSBuZXcgWG9yc2hpZnQoKTtcblxuZXhwb3J0IGNvbnN0IG5vaXNlOiBGeERlZmluaXRpb24gPSB7XG4gIG5hbWU6ICdGcmFjdGFsIE5vaXNlJyxcbiAgZGVzY3JpcHRpb246ICd3aWdnbGUoKScsXG4gIHBhcmFtczoge1xuICAgIHJlY3Vyc2lvbjogeyBuYW1lOiAnUmVjdXJzaW9uJywgdHlwZTogJ2ludCcsIGRlZmF1bHQ6IDQsIG1pbjogMSwgbWF4OiA5OSB9LFxuICAgIGZyZXE6IHsgbmFtZTogJ0ZyZXF1ZW5jeScsIHR5cGU6ICdmbG9hdCcsIGRlZmF1bHQ6IDEuMCwgbWluOiAwLjAgfSxcbiAgICByZXNvOiB7IG5hbWU6ICdSZXNvbHV0aW9uJywgdHlwZTogJ2Zsb2F0JywgZGVmYXVsdDogOC4wLCBtaW46IDEuMCB9LFxuICAgIHNlZWQ6IHsgbmFtZTogJ1NlZWQnLCB0eXBlOiAnaW50JywgZGVmYXVsdDogMSwgbWluOiAwIH0sXG4gICAgYW1wOiB7IG5hbWU6ICdBbXAnLCB0eXBlOiAnZmxvYXQnLCBkZWZhdWx0OiAwLjIgfVxuICB9LFxuICBmdW5jKCBjb250ZXh0ICkge1xuICAgIGlmICggY29udGV4dC5pbml0ICkge1xuICAgICAgeG9yc2hpZnQuZ2VuKCBjb250ZXh0LnBhcmFtcy5zZWVkICk7XG5cbiAgICAgIGNvbnRleHQuc3RhdGUudGFibGUgPSBuZXcgRmxvYXQzMkFycmF5KCBNYXRoLmZsb29yKCBjb250ZXh0LnBhcmFtcy5yZXNvICkgKyAyICk7XG4gICAgICBmb3IgKCBsZXQgaSA9IDE7IGkgPCBjb250ZXh0LnBhcmFtcy5yZXNvOyBpICsrICkge1xuICAgICAgICBjb250ZXh0LnN0YXRlLnRhYmxlWyBpIF0gPSB4b3JzaGlmdC5nZW4oKSAqIDIuMCAtIDEuMDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgdiA9IGNvbnRleHQudmFsdWU7XG4gICAgY29uc3QgcCA9IGNvbnRleHQucHJvZ3Jlc3M7XG5cbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBjb250ZXh0LnBhcmFtcy5yZWN1cnNpb247IGkgKysgKSB7XG4gICAgICBjb25zdCBpbmRleCA9IChcbiAgICAgICAgcCAqIGNvbnRleHQucGFyYW1zLmZyZXEgKiBjb250ZXh0LnBhcmFtcy5yZXNvICogTWF0aC5wb3coIDIuMCwgaSApXG4gICAgICApICUgY29udGV4dC5wYXJhbXMucmVzbztcbiAgICAgIGNvbnN0IGluZGV4aSA9IE1hdGguZmxvb3IoIGluZGV4ICk7XG4gICAgICBjb25zdCBpbmRleGYgPSBpbmRleCAtIGluZGV4aTtcbiAgICAgIGNvbnN0IGZhY3RvciA9IE1hdGgucG93KCAwLjUsIGkgKyAxLjAgKTtcblxuICAgICAgdiArPSBjb250ZXh0LnBhcmFtcy5hbXAgKiBmYWN0b3IgKiBzbW9vdGhzdGVwKFxuICAgICAgICBjb250ZXh0LnN0YXRlLnRhYmxlWyBpbmRleGkgXSxcbiAgICAgICAgY29udGV4dC5zdGF0ZS50YWJsZVsgaW5kZXhpICsgMSBdLFxuICAgICAgICBpbmRleGZcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiB2O1xuICB9XG59O1xuIiwiaW1wb3J0IHR5cGUgeyBGeERlZmluaXRpb24gfSBmcm9tICdAZm1zLWNhdC9hdXRvbWF0b24nO1xuXG5leHBvcnQgY29uc3QgcG93OiBGeERlZmluaXRpb24gPSB7XG4gIG5hbWU6ICdQb3dlcicsXG4gIGRlc2NyaXB0aW9uOiAnWW91IGdvdCBib29zdCBwb3dlciEnLFxuICBwYXJhbXM6IHtcbiAgICBwb3c6IHsgbmFtZTogJ1Bvd2VyJywgdHlwZTogJ2Zsb2F0JywgZGVmYXVsdDogMi4wIH0sXG4gICAgYmlhczogeyBuYW1lOiAnQmlhcycsIHR5cGU6ICdmbG9hdCcsIGRlZmF1bHQ6IDAuMCB9LFxuICAgIHBvc2l0aXZlOiB7IG5hbWU6ICdGb3JjZSBQb3NpdGl2ZScsIHR5cGU6ICdib29sZWFuJywgZGVmYXVsdDogZmFsc2UgfVxuICB9LFxuICBmdW5jKCBjb250ZXh0ICkge1xuICAgIGNvbnN0IHYgPSBjb250ZXh0LnZhbHVlIC0gY29udGV4dC5wYXJhbXMuYmlhcztcbiAgICBjb25zdCBzaWduID0gY29udGV4dC5wYXJhbXMucG9zaXRpdmUgPyAxLjAgOiBNYXRoLnNpZ24oIHYgKTtcbiAgICByZXR1cm4gTWF0aC5wb3coXG4gICAgICBNYXRoLmFicyggdiApLFxuICAgICAgY29udGV4dC5wYXJhbXMucG93XG4gICAgKSAqIHNpZ24gKyBjb250ZXh0LnBhcmFtcy5iaWFzO1xuICB9XG59O1xuIiwiaW1wb3J0IHR5cGUgeyBGeERlZmluaXRpb24gfSBmcm9tICdAZm1zLWNhdC9hdXRvbWF0b24nO1xuXG5jb25zdCBUQVUgPSBNYXRoLlBJICogMi4wO1xuXG5leHBvcnQgY29uc3Qgc2luZTogRnhEZWZpbml0aW9uID0ge1xuICBuYW1lOiAnU2luZXdhdmUnLFxuICBkZXNjcmlwdGlvbjogJ092ZXJsYXkgYSBzaW5ld2F2ZSB0byB0aGUgY3VydmUuJyxcbiAgcGFyYW1zOiB7XG4gICAgYW1wOiB7IG5hbWU6ICdBbXAnLCB0eXBlOiAnZmxvYXQnLCBkZWZhdWx0OiAwLjEgfSxcbiAgICBmcmVxOiB7IG5hbWU6ICdGcmVxdWVuY3knLCB0eXBlOiAnZmxvYXQnLCBkZWZhdWx0OiA1LjAgfSxcbiAgICBwaGFzZTogeyBuYW1lOiAnUGhhc2UnLCB0eXBlOiAnZmxvYXQnLCBkZWZhdWx0OiAwLjAsIG1pbjogMC4wLCBtYXg6IDEuMCB9XG4gIH0sXG4gIGZ1bmMoIGNvbnRleHQgKSB7XG4gICAgY29uc3QgdiA9IGNvbnRleHQudmFsdWU7XG4gICAgY29uc3QgcCA9IGNvbnRleHQucHJvZ3Jlc3MgKiBjb250ZXh0LnBhcmFtcy5mcmVxICsgY29udGV4dC5wYXJhbXMucGhhc2U7XG4gICAgcmV0dXJuIHYgKyBjb250ZXh0LnBhcmFtcy5hbXAgKiBNYXRoLnNpbiggcCAqIFRBVSApO1xuICB9XG59O1xuIiwiaW1wb3J0IHR5cGUgeyBGeERlZmluaXRpb24gfSBmcm9tICdAZm1zLWNhdC9hdXRvbWF0b24nO1xuXG5leHBvcnQgY29uc3QgYWRkOiBGeERlZmluaXRpb24gPSB7XG4gIG5hbWU6ICdBZGQnLFxuICBkZXNjcmlwdGlvbjogJ1RoZSBzaW1wbGVzdCBmeCBldmVyLiBKdXN0IGFkZCBhIGNvbnN0YW50IHZhbHVlIHRvIHRoZSBjdXJ2ZS4nLFxuICBwYXJhbXM6IHtcbiAgICB2YWx1ZTogeyBuYW1lOiAnVmFsdWUnLCB0eXBlOiAnZmxvYXQnLCBkZWZhdWx0OiAxLjAgfVxuICB9LFxuICBmdW5jKCBjb250ZXh0ICkge1xuICAgIHJldHVybiBjb250ZXh0LnZhbHVlICsgY29udGV4dC5wYXJhbXMudmFsdWU7XG4gIH1cbn07XG4iLCJpbXBvcnQgdHlwZSB7IEZ4RGVmaW5pdGlvbiB9IGZyb20gJ0BmbXMtY2F0L2F1dG9tYXRvbic7XG5cbmV4cG9ydCBjb25zdCBjZHM6IEZ4RGVmaW5pdGlvbiA9IHtcbiAgbmFtZTogJ0NyaXRpY2FsbHkgRGFtcGVkIFNwcmluZycsXG4gIGRlc2NyaXB0aW9uOiAnQmFzaWNhbGx5IHRoZSBiZXN0IHNtb290aGluZyBtZXRob2QuIFNob3V0b3V0cyB0byBLZWlqaXJvIFRha2FoYXNoaScsXG4gIHBhcmFtczoge1xuICAgIGZhY3RvcjogeyBuYW1lOiAnRmFjdG9yJywgdHlwZTogJ2Zsb2F0JywgZGVmYXVsdDogMTAwLjAsIG1pbjogMC4wIH0sXG4gICAgcmF0aW86IHsgbmFtZTogJ0RhbXAgUmF0aW8nLCB0eXBlOiAnZmxvYXQnLCBkZWZhdWx0OiAxLjAgfSxcbiAgICBwcmVzZXJ2ZTogeyBuYW1lOiAnUHJlc2VydmUgVmVsb2NpdHknLCB0eXBlOiAnYm9vbGVhbicsIGRlZmF1bHQ6IGZhbHNlIH1cbiAgfSxcbiAgZnVuYyggY29udGV4dCApIHtcbiAgICBjb25zdCBkdCA9IGNvbnRleHQuZGVsdGFUaW1lO1xuICAgIGNvbnN0IHYgPSBjb250ZXh0LnZhbHVlO1xuICAgIGNvbnN0IGsgPSBjb250ZXh0LnBhcmFtcy5mYWN0b3I7XG5cbiAgICBpZiAoIGNvbnRleHQuaW5pdCApIHtcbiAgICAgIGNvbnRleHQuc3RhdGUucG9zID0gY29udGV4dC52YWx1ZTtcbiAgICAgIGlmICggY29udGV4dC5wYXJhbXMucHJlc2VydmUgKSB7XG4gICAgICAgIGNvbnN0IGR2ID0gdiAtIGNvbnRleHQuZ2V0VmFsdWUoIGNvbnRleHQudGltZSAtIGR0ICk7XG4gICAgICAgIGNvbnRleHQuc3RhdGUudmVsID0gZHYgLyBkdDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnRleHQuc3RhdGUudmVsID0gMC4wO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnRleHQuc3RhdGUudmVsICs9IChcbiAgICAgIC1rICogKCBjb250ZXh0LnN0YXRlLnBvcyAtIHYgKVxuICAgICAgLSAyLjAgKiBjb250ZXh0LnN0YXRlLnZlbCAqIE1hdGguc3FydCggayApICogY29udGV4dC5wYXJhbXMucmF0aW9cbiAgICApICogZHQ7XG4gICAgY29udGV4dC5zdGF0ZS5wb3MgKz0gY29udGV4dC5zdGF0ZS52ZWwgKiBkdDtcbiAgICByZXR1cm4gY29udGV4dC5zdGF0ZS5wb3M7XG4gIH1cbn07XG4iLCJpbXBvcnQgeyBjbGFtcCBhcyByYXdDbGFtcCB9IGZyb20gJy4vdXRpbHMvY2xhbXAnO1xuaW1wb3J0IHsgc21pbiB9IGZyb20gJy4vdXRpbHMvc21pbic7XG5pbXBvcnQgdHlwZSB7IEZ4RGVmaW5pdGlvbiB9IGZyb20gJ0BmbXMtY2F0L2F1dG9tYXRvbic7XG5cbmV4cG9ydCBjb25zdCBjbGFtcDogRnhEZWZpbml0aW9uID0ge1xuICBuYW1lOiAnQ2xhbXAnLFxuICBkZXNjcmlwdGlvbjogJ0NvbnN0cmFpbiB0aGUgY3VydmUgYmV0d2VlbiB0d28gdmFsdWVzLCBmZWF0dXJpbmcgc21vb3RoIG1pbmltdW0uJyxcbiAgcGFyYW1zOiB7XG4gICAgbWluOiB7IG5hbWU6ICdNaW4nLCB0eXBlOiAnZmxvYXQnLCBkZWZhdWx0OiAwLjAgfSxcbiAgICBtYXg6IHsgbmFtZTogJ01heCcsIHR5cGU6ICdmbG9hdCcsIGRlZmF1bHQ6IDEuMCB9LFxuICAgIHNtb290aDogeyBuYW1lOiAnU21vb3RoJywgdHlwZTogJ2Zsb2F0JywgZGVmYXVsdDogMC4wLCBtaW46IDAuMCB9XG4gIH0sXG4gIGZ1bmMoIGNvbnRleHQgKSB7XG4gICAgaWYgKCBjb250ZXh0LnBhcmFtcy5zbW9vdGggPT09IDAuMCApIHtcbiAgICAgIHJldHVybiByYXdDbGFtcCggY29udGV4dC52YWx1ZSwgY29udGV4dC5wYXJhbXMubWluLCBjb250ZXh0LnBhcmFtcy5tYXggKTtcbiAgICB9XG5cbiAgICBjb25zdCB2ID0gLXNtaW4oIC1jb250ZXh0LnBhcmFtcy5taW4sIC1jb250ZXh0LnZhbHVlLCBjb250ZXh0LnBhcmFtcy5zbW9vdGggKTtcbiAgICByZXR1cm4gc21pbiggY29udGV4dC5wYXJhbXMubWF4LCB2LCBjb250ZXh0LnBhcmFtcy5zbW9vdGggKTtcbiAgfVxufTtcbiIsImltcG9ydCB0eXBlIHsgRnhEZWZpbml0aW9uIH0gZnJvbSAnQGZtcy1jYXQvYXV0b21hdG9uJztcblxuZXhwb3J0IGNvbnN0IGV4cDogRnhEZWZpbml0aW9uID0ge1xuICBuYW1lOiAnRXhwb25lbnRpYWwgU21vb3RoaW5nJyxcbiAgZGVzY3JpcHRpb246ICdTbW9vdGggdGhlIGN1cnZlLiBTaW1wbGUgYnV0IGdvb2QuJyxcbiAgcGFyYW1zOiB7XG4gICAgZmFjdG9yOiB7IG5hbWU6ICdGYWN0b3InLCB0eXBlOiAnZmxvYXQnLCBkZWZhdWx0OiAxMC4wLCBtaW46IDAuMCB9XG4gIH0sXG4gIGZ1bmMoIGNvbnRleHQgKSB7XG4gICAgY29uc3QgdiA9IGNvbnRleHQudmFsdWU7XG5cbiAgICBpZiAoIGNvbnRleHQuaW5pdCApIHtcbiAgICAgIGNvbnRleHQuc3RhdGUucG9zID0gdjtcbiAgICB9XG5cbiAgICBjb25zdCBrID0gTWF0aC5leHAoIC1jb250ZXh0LmRlbHRhVGltZSAqIGNvbnRleHQucGFyYW1zLmZhY3RvciApO1xuICAgIGNvbnRleHQuc3RhdGUucG9zID0gY29udGV4dC5zdGF0ZS5wb3MgKiBrICsgdiAqICggMS4wIC0gayApO1xuICAgIHJldHVybiBjb250ZXh0LnN0YXRlLnBvcztcbiAgfVxufTtcbiIsImltcG9ydCB0eXBlIHsgRnhEZWZpbml0aW9uIH0gZnJvbSAnQGZtcy1jYXQvYXV0b21hdG9uJztcblxuZXhwb3J0IGNvbnN0IGdyYXZpdHk6IEZ4RGVmaW5pdGlvbiA9IHtcbiAgbmFtZTogJ0dyYXZpdHknLFxuICBkZXNjcmlwdGlvbjogJ0FjY2VsZXJhdGUgYW5kIGJvdW5jZSB0aGUgY3VydmUuJyxcbiAgcGFyYW1zOiB7XG4gICAgYTogeyBuYW1lOiAnQWNjZWxlcmF0aW9uJywgdHlwZTogJ2Zsb2F0JywgZGVmYXVsdDogOS44IH0sXG4gICAgZTogeyBuYW1lOiAnUmVzdGl0dXRpb24nLCB0eXBlOiAnZmxvYXQnLCBkZWZhdWx0OiAwLjUsIG1pbjogMC4wIH0sXG4gICAgcHJlc2VydmU6IHsgbmFtZTogJ1ByZXNlcnZlIFZlbG9jaXR5JywgdHlwZTogJ2Jvb2xlYW4nLCBkZWZhdWx0OiBmYWxzZSB9XG4gIH0sXG4gIGZ1bmMoIGNvbnRleHQgKSB7XG4gICAgY29uc3QgZHQgPSBjb250ZXh0LmRlbHRhVGltZTtcbiAgICBjb25zdCB2ID0gY29udGV4dC52YWx1ZTtcblxuICAgIGlmICggY29udGV4dC5pbml0ICkge1xuICAgICAgY29udGV4dC5zdGF0ZS5wb3MgPSB2O1xuICAgICAgaWYgKCBjb250ZXh0LnBhcmFtcy5wcmVzZXJ2ZSApIHtcbiAgICAgICAgY29uc3QgZHYgPSB2IC0gY29udGV4dC5nZXRWYWx1ZSggY29udGV4dC50aW1lIC0gZHQgKTtcbiAgICAgICAgY29udGV4dC5zdGF0ZS52ZWwgPSBkdiAvIGR0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29udGV4dC5zdGF0ZS52ZWwgPSAwLjA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgYSA9IE1hdGguc2lnbiggdiAtIGNvbnRleHQuc3RhdGUucG9zICkgKiBjb250ZXh0LnBhcmFtcy5hO1xuICAgIGNvbnRleHQuc3RhdGUudmVsICs9IGEgKiBkdDtcbiAgICBjb250ZXh0LnN0YXRlLnBvcyArPSBjb250ZXh0LnN0YXRlLnZlbCAqIGR0O1xuXG4gICAgaWYgKCBNYXRoLnNpZ24oIGEgKSAhPT0gTWF0aC5zaWduKCB2IC0gY29udGV4dC5zdGF0ZS5wb3MgKSApIHtcbiAgICAgIGNvbnRleHQuc3RhdGUudmVsICo9IC1jb250ZXh0LnBhcmFtcy5lO1xuICAgICAgY29udGV4dC5zdGF0ZS5wb3MgPSB2ICsgY29udGV4dC5wYXJhbXMuZSAqICggdiAtIGNvbnRleHQuc3RhdGUucG9zICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbnRleHQuc3RhdGUucG9zO1xuICB9XG59O1xuIiwiaW1wb3J0IHR5cGUgeyBGeERlZmluaXRpb24gfSBmcm9tICdAZm1zLWNhdC9hdXRvbWF0b24nO1xuXG5leHBvcnQgY29uc3QgaGVybWl0ZVBhdGNoOiBGeERlZmluaXRpb24gPSB7XG4gIG5hbWU6ICdIZXJtaXRlIFBhdGNoJyxcbiAgZGVzY3JpcHRpb246ICdQYXRjaCBhIGN1cnZlIHVzaW5nIGhlcm1pdGUgc3BsaW5lLicsXG4gIHBhcmFtczoge30sXG4gIGZ1bmMoIGNvbnRleHQgKSB7XG4gICAgaWYgKCBjb250ZXh0LmluaXQgKSB7XG4gICAgICBjb25zdCBkdCA9IGNvbnRleHQuZGVsdGFUaW1lO1xuXG4gICAgICBjb25zdCB2MCA9IGNvbnRleHQuZ2V0VmFsdWUoIGNvbnRleHQudDAgKTtcbiAgICAgIGNvbnN0IGR2MCA9IHYwIC0gY29udGV4dC5nZXRWYWx1ZSggY29udGV4dC50MCAtIGR0ICk7XG4gICAgICBjb25zdCB2MSA9IGNvbnRleHQuZ2V0VmFsdWUoIGNvbnRleHQudDEgKTtcbiAgICAgIGNvbnN0IGR2MSA9IHYxIC0gY29udGV4dC5nZXRWYWx1ZSggY29udGV4dC50MSAtIGR0ICk7XG5cbiAgICAgIGNvbnRleHQuc3RhdGUucDAgPSB2MDtcbiAgICAgIGNvbnRleHQuc3RhdGUubTAgPSBkdjAgLyBkdCAqIGNvbnRleHQubGVuZ3RoO1xuICAgICAgY29udGV4dC5zdGF0ZS5wMSA9IHYxO1xuICAgICAgY29udGV4dC5zdGF0ZS5tMSA9IGR2MSAvIGR0ICogY29udGV4dC5sZW5ndGg7XG4gICAgfVxuXG4gICAgY29uc3QgeyBwMCwgbTAsIHAxLCBtMSB9ID0gY29udGV4dC5zdGF0ZTtcbiAgICBjb25zdCB0ID0gY29udGV4dC5wcm9ncmVzcztcblxuICAgIHJldHVybiAoXG4gICAgICAoICggMi4wICogdCAtIDMuMCApICogdCAqIHQgKyAxLjAgKSAqIHAwICtcbiAgICAgICggKCAoIHQgLSAyLjAgKSAqIHQgKyAxLjAgKSAqIHQgKSAqIG0wICtcbiAgICAgICggKCAtMi4wICogdCArIDMuMCApICogdCAqIHQgKSAqIHAxICtcbiAgICAgICggKCB0IC0gMS4wICkgKiB0ICogdCApICogbTFcbiAgICApO1xuICB9XG59O1xuIiwiaW1wb3J0IHR5cGUgeyBGeERlZmluaXRpb24gfSBmcm9tICdAZm1zLWNhdC9hdXRvbWF0b24nO1xuXG5leHBvcnQgY29uc3QgbG9maTogRnhEZWZpbml0aW9uID0ge1xuICBuYW1lOiAnTG8tRmknLFxuICBkZXNjcmlwdGlvbjogJ01ha2UgY3VydmUgbW9yZSBjcnVuY2h5LicsXG4gIHBhcmFtczoge1xuICAgIHJhdGU6IHsgbmFtZTogJ0ZyYW1lIFJhdGUnLCB0eXBlOiAnZmxvYXQnLCBkZWZhdWx0OiAxMC4wLCBtaW46IDAuMCwgbWF4OiAxMDAwLjAgfSxcbiAgICByZWxhdGl2ZTogeyBuYW1lOiAnUmVsYXRpdmUnLCB0eXBlOiAnYm9vbGVhbicsIGRlZmF1bHQ6IGZhbHNlIH0sXG4gICAgcmVzbzogeyBuYW1lOiAnUmVzbyBQZXIgVW5pdCcsIHR5cGU6ICdmbG9hdCcsIGRlZmF1bHQ6IDEwLjAsIG1pbjogMC4wLCBtYXg6IDEwMDAuMCB9LFxuICAgIHJvdW5kOiB7IG5hbWU6ICdSb3VuZCcsIHR5cGU6ICdib29sZWFuJywgZGVmYXVsdDogZmFsc2UgfVxuICB9LFxuICBmdW5jKCBjb250ZXh0ICkge1xuICAgIGxldCB0O1xuICAgIGlmICggY29udGV4dC5wYXJhbXMucmF0ZSA9PT0gMC4wICkge1xuICAgICAgdCA9IGNvbnRleHQudGltZTtcbiAgICB9IGVsc2UgaWYgKCBjb250ZXh0LnBhcmFtcy5yZWxhdGl2ZSApIHtcbiAgICAgIHQgPSBjb250ZXh0LnQwICsgTWF0aC5mbG9vcihcbiAgICAgICAgKCBjb250ZXh0LnRpbWUgLSBjb250ZXh0LnQwICkgKiBjb250ZXh0LnBhcmFtcy5yYXRlXG4gICAgICApIC8gY29udGV4dC5wYXJhbXMucmF0ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdCA9IE1hdGguZmxvb3IoICggY29udGV4dC50aW1lICkgKiBjb250ZXh0LnBhcmFtcy5yYXRlICkgLyBjb250ZXh0LnBhcmFtcy5yYXRlO1xuICAgIH1cblxuICAgIGxldCB2ID0gY29udGV4dC5nZXRWYWx1ZSggdCApO1xuICAgIGlmICggY29udGV4dC5wYXJhbXMucmVzbyAhPT0gMC4wICkge1xuICAgICAgdiA9IE1hdGguZmxvb3IoXG4gICAgICAgIHYgKiBjb250ZXh0LnBhcmFtcy5yZXNvICsgKCBjb250ZXh0LnBhcmFtcy5yb3VuZCA/IDAuNSA6IDAuMCApXG4gICAgICApIC8gY29udGV4dC5wYXJhbXMucmVzbztcbiAgICB9XG4gICAgcmV0dXJuIHY7XG4gIH1cbn07XG4iLCJpbXBvcnQgeyBzbW9vdGhzdGVwIH0gZnJvbSAnLi91dGlscy9zbW9vdGhzdGVwJztcbmltcG9ydCBYb3JzaGlmdCBmcm9tICcuL3V0aWxzL3hvcnNoaWZ0JztcbmltcG9ydCB0eXBlIHsgRnhEZWZpbml0aW9uIH0gZnJvbSAnQGZtcy1jYXQvYXV0b21hdG9uJztcblxuY29uc3QgeG9yc2hpZnQgPSBuZXcgWG9yc2hpZnQoKTtcblxuZXhwb3J0IGNvbnN0IG5vaXNlOiBGeERlZmluaXRpb24gPSB7XG4gIG5hbWU6ICdGcmFjdGFsIE5vaXNlJyxcbiAgZGVzY3JpcHRpb246ICd3aWdnbGUoKScsXG4gIHBhcmFtczoge1xuICAgIHJlY3Vyc2lvbjogeyBuYW1lOiAnUmVjdXJzaW9uJywgdHlwZTogJ2ludCcsIGRlZmF1bHQ6IDQsIG1pbjogMSwgbWF4OiA5OSB9LFxuICAgIGZyZXE6IHsgbmFtZTogJ0ZyZXF1ZW5jeScsIHR5cGU6ICdmbG9hdCcsIGRlZmF1bHQ6IDEuMCwgbWluOiAwLjAgfSxcbiAgICByZXNvOiB7IG5hbWU6ICdSZXNvbHV0aW9uJywgdHlwZTogJ2Zsb2F0JywgZGVmYXVsdDogOC4wLCBtaW46IDEuMCB9LFxuICAgIHNlZWQ6IHsgbmFtZTogJ1NlZWQnLCB0eXBlOiAnaW50JywgZGVmYXVsdDogMSwgbWluOiAwIH0sXG4gICAgYW1wOiB7IG5hbWU6ICdBbXAnLCB0eXBlOiAnZmxvYXQnLCBkZWZhdWx0OiAwLjIgfVxuICB9LFxuICBmdW5jKCBjb250ZXh0ICkge1xuICAgIGlmICggY29udGV4dC5pbml0ICkge1xuICAgICAgeG9yc2hpZnQuZ2VuKCBjb250ZXh0LnBhcmFtcy5zZWVkICk7XG5cbiAgICAgIGNvbnRleHQuc3RhdGUudGFibGUgPSBuZXcgRmxvYXQzMkFycmF5KCBNYXRoLmZsb29yKCBjb250ZXh0LnBhcmFtcy5yZXNvICkgKyAyICk7XG4gICAgICBmb3IgKCBsZXQgaSA9IDE7IGkgPCBjb250ZXh0LnBhcmFtcy5yZXNvOyBpICsrICkge1xuICAgICAgICBjb250ZXh0LnN0YXRlLnRhYmxlWyBpIF0gPSB4b3JzaGlmdC5nZW4oKSAqIDIuMCAtIDEuMDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgdiA9IGNvbnRleHQudmFsdWU7XG4gICAgY29uc3QgcCA9IGNvbnRleHQucHJvZ3Jlc3M7XG5cbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBjb250ZXh0LnBhcmFtcy5yZWN1cnNpb247IGkgKysgKSB7XG4gICAgICBjb25zdCBpbmRleCA9IChcbiAgICAgICAgcCAqIGNvbnRleHQucGFyYW1zLmZyZXEgKiBjb250ZXh0LnBhcmFtcy5yZXNvICogTWF0aC5wb3coIDIuMCwgaSApXG4gICAgICApICUgY29udGV4dC5wYXJhbXMucmVzbztcbiAgICAgIGNvbnN0IGluZGV4aSA9IE1hdGguZmxvb3IoIGluZGV4ICk7XG4gICAgICBjb25zdCBpbmRleGYgPSBpbmRleCAtIGluZGV4aTtcbiAgICAgIGNvbnN0IGZhY3RvciA9IE1hdGgucG93KCAwLjUsIGkgKyAxLjAgKTtcblxuICAgICAgdiArPSBjb250ZXh0LnBhcmFtcy5hbXAgKiBmYWN0b3IgKiBzbW9vdGhzdGVwKFxuICAgICAgICBjb250ZXh0LnN0YXRlLnRhYmxlWyBpbmRleGkgXSxcbiAgICAgICAgY29udGV4dC5zdGF0ZS50YWJsZVsgaW5kZXhpICsgMSBdLFxuICAgICAgICBpbmRleGZcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiB2O1xuICB9XG59O1xuIiwiaW1wb3J0IHR5cGUgeyBGeERlZmluaXRpb24gfSBmcm9tICdAZm1zLWNhdC9hdXRvbWF0b24nO1xuXG5leHBvcnQgY29uc3QgcG93OiBGeERlZmluaXRpb24gPSB7XG4gIG5hbWU6ICdQb3dlcicsXG4gIGRlc2NyaXB0aW9uOiAnWW91IGdvdCBib29zdCBwb3dlciEnLFxuICBwYXJhbXM6IHtcbiAgICBwb3c6IHsgbmFtZTogJ1Bvd2VyJywgdHlwZTogJ2Zsb2F0JywgZGVmYXVsdDogMi4wIH0sXG4gICAgYmlhczogeyBuYW1lOiAnQmlhcycsIHR5cGU6ICdmbG9hdCcsIGRlZmF1bHQ6IDAuMCB9LFxuICAgIHBvc2l0aXZlOiB7IG5hbWU6ICdGb3JjZSBQb3NpdGl2ZScsIHR5cGU6ICdib29sZWFuJywgZGVmYXVsdDogZmFsc2UgfVxuICB9LFxuICBmdW5jKCBjb250ZXh0ICkge1xuICAgIGNvbnN0IHYgPSBjb250ZXh0LnZhbHVlIC0gY29udGV4dC5wYXJhbXMuYmlhcztcbiAgICBjb25zdCBzaWduID0gY29udGV4dC5wYXJhbXMucG9zaXRpdmUgPyAxLjAgOiBNYXRoLnNpZ24oIHYgKTtcbiAgICByZXR1cm4gTWF0aC5wb3coXG4gICAgICBNYXRoLmFicyggdiApLFxuICAgICAgY29udGV4dC5wYXJhbXMucG93XG4gICAgKSAqIHNpZ24gKyBjb250ZXh0LnBhcmFtcy5iaWFzO1xuICB9XG59O1xuIiwiaW1wb3J0IHR5cGUgeyBGeERlZmluaXRpb24gfSBmcm9tICdAZm1zLWNhdC9hdXRvbWF0b24nO1xuXG5leHBvcnQgY29uc3QgcmVwZWF0OiBGeERlZmluaXRpb24gPSB7XG4gIG5hbWU6ICdSZXBlYXQnLFxuICBkZXNjcmlwdGlvbjogJ1JlcGVhdCBhIHNlY3Rpb24gb2YgdGhlIGN1cnZlLicsXG4gIHBhcmFtczoge1xuICAgIGludGVydmFsOiB7IG5hbWU6ICdJbnRlcnZhbCcsIHR5cGU6ICdmbG9hdCcsIGRlZmF1bHQ6IDEuMCwgbWluOiAwLjAgfSxcbiAgfSxcbiAgZnVuYyggY29udGV4dCApIHtcbiAgICByZXR1cm4gY29udGV4dC5nZXRWYWx1ZSggY29udGV4dC50MCArIGNvbnRleHQuZWxhcHNlZCAlIGNvbnRleHQucGFyYW1zLmludGVydmFsICk7XG4gIH1cbn07XG4iLCJpbXBvcnQgdHlwZSB7IEZ4RGVmaW5pdGlvbiB9IGZyb20gJ0BmbXMtY2F0L2F1dG9tYXRvbic7XG5cbmNvbnN0IFRBVSA9IE1hdGguUEkgKiAyLjA7XG5cbmV4cG9ydCBjb25zdCBzaW5lOiBGeERlZmluaXRpb24gPSB7XG4gIG5hbWU6ICdTaW5ld2F2ZScsXG4gIGRlc2NyaXB0aW9uOiAnT3ZlcmxheSBhIHNpbmV3YXZlIHRvIHRoZSBjdXJ2ZS4nLFxuICBwYXJhbXM6IHtcbiAgICBhbXA6IHsgbmFtZTogJ0FtcCcsIHR5cGU6ICdmbG9hdCcsIGRlZmF1bHQ6IDAuMSB9LFxuICAgIGZyZXE6IHsgbmFtZTogJ0ZyZXF1ZW5jeScsIHR5cGU6ICdmbG9hdCcsIGRlZmF1bHQ6IDUuMCB9LFxuICAgIG9mZnNldDogeyBuYW1lOiAnT2Zmc2V0JywgdHlwZTogJ2Zsb2F0JywgZGVmYXVsdDogMC4wLCBtaW46IDAuMCwgbWF4OiAxLjAgfVxuICB9LFxuICBmdW5jKCBjb250ZXh0ICkge1xuICAgIGNvbnN0IHYgPSBjb250ZXh0LnZhbHVlO1xuICAgIGNvbnN0IHAgPSBjb250ZXh0LmVsYXBzZWQgKiBjb250ZXh0LnBhcmFtcy5mcmVxICsgY29udGV4dC5wYXJhbXMub2Zmc2V0O1xuICAgIHJldHVybiB2ICsgY29udGV4dC5wYXJhbXMuYW1wICogTWF0aC5zaW4oIHAgKiBUQVUgKTtcbiAgfVxufTtcbiJdLCJuYW1lcyI6WyJjbGFtcCIsInJhd0NsYW1wIiwiYWRkIiwiY2RzIiwiZXhwIiwiZ3Jhdml0eSIsImxvZmkiLCJ4b3JzaGlmdCIsIm5vaXNlIiwicG93IiwiVEFVIiwic2luZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFFTyxNQUFN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
