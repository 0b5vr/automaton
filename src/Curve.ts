import { Automaton } from './Automaton';
import { BezierNode } from './types/BezierNode';
import { FxContext } from './types/FxDefinition';
import { FxSection } from './types/FxSection';
import { SerializedCurve } from './types/SerializedCurve';
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
   * The length of this curve.
   */
  protected __length: number = 1.0;

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
  public get length(): number { return this.__length; }


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
    this.__nodes = data.nodes;
    this.__fxs = data.fxs || [];

    const lastNode = data.nodes[ data.nodes.length - 1 ];
    this.__length = lastNode.time;

    this.precalc();
  }

  /**
   * Precalculate value of samples.
   */
  public precalc(): void {
    this.__values = new Float32Array(
      Math.ceil( this.__automaton.resolution * this.__length ) + 1
    );

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

    for ( let iFx = 0; iFx < this.__fxs.length; iFx ++ ) {
      const fx = this.__fxs[ iFx ];
      if ( fx.bypass ) { continue; }
      const fxDef = this.__automaton.getFxDefinition( fx.def );
      if ( !fxDef ) { continue; }

      const i0 = Math.ceil( this.__automaton.resolution * fx.time );
      const i1 = Math.floor( this.__automaton.resolution * ( fx.time + fx.length ) );

      const tempValues = new Float32Array( i1 - i0 );
      const tempLength = tempValues.length;

      const context: FxContext = {
        index: i0,
        i0: i0,
        i1: i1,
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

  /**
   * Return the value of specified time point.
   * @param time Time at the point you want to grab the value.
   * @returns Result value
   */
  public getValue( time: number ): number {
    if ( time < 0.0 ) {
      // clamp left
      return this.__values[ 0 ];

    } else if ( this.__length <= time ) {
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
}
