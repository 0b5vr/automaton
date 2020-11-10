import type { FxDefinition } from '@fms-cat/automaton';

export const hermitePatch: FxDefinition = {
  name: 'Hermite Patch',
  description: 'Patch a curve using hermite spline.',
  params: {},
  func( context ) {
    if ( context.init ) {
      const dt = context.deltaTime;

      const v0 = context.getValue( context.t0 );
      const dv0 = v0 - context.getValue( context.t0 - dt );
      const v1 = context.getValue( context.t1 );
      const dv1 = v1 - context.getValue( context.t1 - dt );

      context.state.p0 = v0;
      context.state.m0 = dv0 / dt * context.length;
      context.state.p1 = v1;
      context.state.m1 = dv1 / dt * context.length;
    }

    const { p0, m0, p1, m1 } = context.state;
    const t = context.progress;

    return (
      ( ( 2.0 * t - 3.0 ) * t * t + 1.0 ) * p0 +
      ( ( ( t - 2.0 ) * t + 1.0 ) * t ) * m0 +
      ( ( -2.0 * t + 3.0 ) * t * t ) * p1 +
      ( ( t - 1.0 ) * t * t ) * m1
    );
  }
};
