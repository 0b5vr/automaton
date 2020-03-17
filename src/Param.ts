import { Automaton } from './Automaton';
import { BezierNode } from './types/BezierNode';
import { FxContext } from './types/FxDefinition';
import { FxSection } from './types/FxSection';
import { SerializedParam } from './types/SerializedParam';
import { bezierEasing } from './utils/bezierEasing';

/**
 * It represents a param of Automaton.
 * It's `automaton.nogui.js` version and also base class for {@link ParamWithGUI}
 * @param automaton Parent automaton
 * @param data Data of the param
 */
export class Param {
  /**
   * The parent automaton.
   */
  protected __automaton: Automaton;

  /**
   * An array of precalculated value.
   * Its length is same as `param.__automaton.resolution * param.__automaton.length + 1`.
  */
  protected __values: Float32Array;

  /**
   * List of bezier node.
   */
  protected __nodes: BezierNode[] = [];

  /**
   * List of fx sections.
   */
  protected __fxs: FxSection[] = [];

  /**
   * A cache of last calculated value.
   */
  protected __value: number = 0.0;

  /**
   * The time that was used for the calculation of [[__lastValue]].
   */
  protected __time: number = 0.0;

  public constructor( automaton: Automaton, data?: SerializedParam ) {
    this.__automaton = automaton;

    this.__values = new Float32Array( this.__automaton.resolution * this.__automaton.length + 1 );

    data && this.deserialize( data );
  }

  /**
   * A cache of last calculated value.
   */
  public get value(): number { return this.__value; }

  /**
   * The time that was used for the calculation of [[__lastValue]].
   */
  public get time(): number { return this.__time; }

  /**
   * Load a param data.
   * @param data Data of param
   */
  public deserialize( data: SerializedParam ): void {
    this.__nodes = data.nodes;
    this.__fxs = data.fxs;

    this.precalc();
  }

  /**
   * Precalculate value of samples.
   */
  public precalc(): void {
    for ( let iNode = 0; iNode < this.__nodes.length - 1; iNode ++ ) {
      const node0 = this.__nodes[ iNode ];
      const node1 = this.__nodes[ iNode + 1 ];
      const i0 = Math.floor( node0.time * this.__automaton.resolution );
      const i1 = Math.floor( node1.time * this.__automaton.resolution );

      this.__values[ i0 ] = node0.value;
      for ( let i = i0 + 1; i <= i1; i ++ ) {
        const time = i / this.__automaton.resolution;
        const value = bezierEasing( node0, node1, time );
        this.__values[ i ] = value;
      }
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

    // reset the __lastTime / __lastValue
    this.__value = this.getValue( this.__time );
  }

  /**
   * This method is intended to be used by [[Automaton.update]].
   * @param time The current time of the parent [[Automaton]]
   * @returns whether the value has been changed or not
   */
  public update( time: number ): boolean {
    const value = this.getValue( time );

    const isChanged = this.__value !== value;

    // store lastValue
    this.__time = time;
    this.__value = value;

    return isChanged;
  }

  /**
   * Return the value of specified time point.
   * @param time Time at the point you want to grab the value.
   * @returns Result value
   */
  public getValue( time: number ): number {
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
