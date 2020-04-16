import { Automaton, Curve } from '.';
import { SerializedChannelItem } from './types/SerializedChannelItem';

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
   * Value of the item.
   */
  public value!: number;

  /**
   * This will only make sense when `curve` is specified.
   * The time offset of the item.
   */
  public offset!: number;

  /**
   * This will only make sense when `curve` is specified.
   * The speed rate of the item.
   */
  public speed!: number;

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
    if ( this.curve ) {
      const t = this.offset! + time * this.speed!;
      return this.curve.getValue( t );
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
    this.value = data.value ?? 0.0;
    this.offset = data.offset ?? 0.0;
    this.speed = data.speed ?? 1.0;
    if ( data.curve != null ) {
      this.curve = this.__automaton.getCurve( data.curve )!;
      this.length = data.length ?? this.curve.length ?? 0.0;
    }
  }
}
