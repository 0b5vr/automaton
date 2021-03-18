import { Automaton, Curve } from '.';
import type { SerializedChannelItem } from './types/SerializedChannelItem';

/**
 * Represents an item of a [[Channel]].
 */
export class ChannelItem {
  /**
   * The parent automaton.
   */
  protected readonly __automaton: Automaton;

  /**
   * Beginning timepoint of the item.
   */
  public time!: number;

  /**
   * Length of the item.
   */
  public length!: number;

  /**
   * Repeat interval of the item.
   */
  public repeat?: number;

  /**
   * Value of the item.
   */
  public value!: number;

  /**
   * Whether reset channels value to zero at the end of this item or not.
   */
  public reset?: boolean;

  /**
   * This will only make sense when {@link curve} is specified.
   * The time offset of the item.
   */
  public offset!: number;

  /**
   * This will only make sense when {@link curve} is specified.
   * The speed rate of the item.
   */
  public speed!: number;

  /**
   * This will only make sense when {@link curve} is specified.
   * The scale of the item in the value axis.
   */
  public amp!: number;

  /**
   * The curve of the item.
   */
  public curve?: Curve;

  /**
   * Ending timepoint of the item.
   */
  public get end(): number {
    return this.time + this.length;
  }

  /**
   * Constructor of the [[ChannelItem]].
   * @param automaton Parent automaton
   * @param data Data of the item
   */
  public constructor( automaton: Automaton, data: SerializedChannelItem ) {
    this.__automaton = automaton;

    this.deserialize( data );
  }

  public getValue( time: number ): number {
    if ( this.reset && this.length <= time ) {
      return 0.0;
    }

    if ( this.curve ) {
      const t = ( this.offset + time * this.speed ) % ( this.repeat || Infinity );
      //                                                            ^^ null and also blocking zero divisions!
      return this.value + this.amp * this.curve.getValue( t );
    } else {
      return this.value;
    }
  }

  /**
   * Deserialize a serialized data of item from [[SerializedChannelItem]].
   * @param data A serialized item.
   */
  public deserialize( data: SerializedChannelItem ): void {
    this.time = data.time ?? 0.0;
    this.length = data.length ?? 0.0;
    this.repeat = data.repeat;
    this.value = data.value ?? 0.0;
    this.offset = data.offset ?? 0.0;
    this.speed = data.speed ?? 1.0;
    this.amp = data.amp ?? 1.0;
    this.reset = data.reset;
    if ( data.curve != null ) {
      this.curve = this.__automaton.getCurve( data.curve )!;
      this.length = data.length ?? this.curve.length ?? 0.0;
    }
  }
}
