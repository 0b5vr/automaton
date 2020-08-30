import { Automaton } from './Automaton';
import type { BezierNode } from './types/BezierNode';
import type { FxContext } from './types/FxDefinition';
import type { FxSection } from './types/FxSection';
import type { SerializedCurve } from './types/SerializedCurve';
import { bezierEasing } from './utils/bezierEasing';

/**
 * It represents a curve of Automaton.
 */
export class Curve {
  /**
   * The parent automaton.
   */
  protected __automaton: Automaton;

  /**
   * An array of precalculated value.
   * Its length is same as `curve.__automaton.resolution * curve.__automaton.length + 1`.
  */
  protected __values!: Float32Array;

  /**
   * List of bezier node.
   */
  protected __nodes: BezierNode[] = [];

  /**
   * List of fx sections.
   */
  protected __fxs: FxSection[] = [];

  /**
   * The length of this curve.
   */
  public get length(): number {
    return this.__nodes[ this.__nodes.length - 1 ].time;
  }


  /**
   * Constructor of a [[Curve]].
   * @param automaton Parent automaton
   * @param data Data of the curve
   */
  public constructor( automaton: Automaton, data: SerializedCurve ) {
    this.__automaton = automaton;

    this.deserialize( data );
  }

  /**
   * Load a serialized data of a curve.
   * @param data Data of a curve
   */
  public deserialize( data: SerializedCurve ): void {
    this.__nodes = data.nodes.map( ( node ) => ( {
      time: node.time ?? 0.0,
      value: node.value ?? 0.0,
      in: node.in ?? { time: 0.0, value: 0.0 },
      out: node.out ?? { time: 0.0, value: 0.0 }
    } ) );

    this.__fxs = [];
    data.fxs?.forEach( ( fx ) => {
      if ( fx.bypass ) { return; }
      this.__fxs.push( {
        time: fx.time ?? 0.0,
        length: fx.length ?? 0.0,
        row: fx.row ?? 0,
        def: fx.def,
        params: fx.params
      } );
    } );

    this.precalc();
  }

  /**
   * Precalculate value of samples.
   */
  public precalc(): void {
    this.__values = new Float32Array(
      Math.ceil( this.__automaton.resolution * this.length ) + 1
    );

    this.__generateCurve();
    this.__applyFxs();
  }

  /**
   * Return the value of specified time point.
   * @param time Time at the point you want to grab the value.
   * @returns Result value
   */
  public getValue( time: number ): number {
    if ( time < 0.0 ) {
      // clamp left
      return this.__values[ 0 ];

    } else if ( this.length <= time ) {
      // clamp right
      return this.__values[ this.__values.length - 1 ];

    } else {
      // fetch two values then do the linear interpolation
      const index = time * this.__automaton.resolution;
      const indexi = Math.floor( index );
      const indexf = index % 1.0;

      const v0 = this.__values[ indexi ];
      const v1 = this.__values[ indexi + 1 ];

      const v = v0 + ( v1 - v0 ) * indexf;

      return v;

    }
  }

  /**
   * The first step of {@link precalc}: generate a curve out of nodes.
   */
  protected __generateCurve(): void {
    let nodeTail = this.__nodes[ 0 ];
    let iTail = 0;
    for ( let iNode = 0; iNode < this.__nodes.length - 1; iNode ++ ) {
      const node0 = nodeTail;
      nodeTail = this.__nodes[ iNode + 1 ];
      const i0 = iTail;
      iTail = Math.floor( nodeTail.time * this.__automaton.resolution );

      this.__values[ i0 ] = node0.value;
      for ( let i = i0 + 1; i <= iTail; i ++ ) {
        const time = i / this.__automaton.resolution;
        const value = bezierEasing( node0, nodeTail, time );
        this.__values[ i ] = value;
      }
    }

    for ( let i = iTail + 1; i < this.__values.length; i ++ ) {
      this.__values[ i ] = nodeTail.value;
    }
  }

  /**
   * The second step of {@link precalc}: apply fxs to the generated curves.
   */
  protected __applyFxs(): void {
    for ( let iFx = 0; iFx < this.__fxs.length; iFx ++ ) {
      const fx = this.__fxs[ iFx ];
      const fxDef = this.__automaton.getFxDefinition( fx.def );
      if ( !fxDef ) { continue; }

      const availableEnd = Math.min( this.length, fx.time + fx.length );
      const i0 = Math.ceil( this.__automaton.resolution * fx.time );
      const i1 = Math.floor( this.__automaton.resolution * availableEnd );
      if ( i1 <= i0 ) { continue; }

      const tempLength = i1 - i0 + 1;
      const tempValues = new Float32Array( tempLength );

      const context: FxContext = {
        index: i0,
        i0,
        i1,
        time: fx.time,
        t0: fx.time,
        t1: fx.time + fx.length,
        deltaTime: 1.0 / this.__automaton.resolution,
        value: 0.0,
        progress: 0.0,
        resolution: this.__automaton.resolution,
        length: fx.length,
        params: fx.params,
        array: this.__values,
        getValue: this.getValue.bind( this ),
        init: true,
        state: {}
      };

      for ( let i = 0; i < tempLength; i ++ ) {
        context.index = i + i0;
        context.time = context.index / this.__automaton.resolution;
        context.value = this.__values[ i + i0 ];
        context.progress = ( context.time - fx.time ) / fx.length;
        tempValues[ i ] = fxDef.func( context );

        context.init = false;
      }

      this.__values.set( tempValues, i0 );
    }
  }
}
