import { Automaton } from './Automaton';
import { ChannelItem } from './ChannelItem';
import { Curve } from './Curve';
import { SerializedChannelItemCurve } from './types/SerializedChannelItemCurve';
import { mod } from './utils/mod';

/**
 * Represents a curve item of a [[Channel]].
 */
export class ChannelItemCurve extends ChannelItem {
  /**
   * The time offset of the item.
   */
  public offset!: number;

  /**
   * The speed rate of the item.
   */
  public speed!: number;

  /**
   * The curve of the item.
   */
  public curve!: Curve;

  /**
   * Constructor of the [[ChannelItemCurve]].
   * @param automaton Parent automaton
   * @param data Data of the item
   */
  public constructor( automaton: Automaton, data: SerializedChannelItemCurve ) {
    super( automaton, data );
  }

  public getValue( time: number ): number {
    return this.curve.getValue(
      mod( this.offset + ( time - this.time ) * this.speed, this.curve.length )
    );
  }

  /**
   * Deserialize a serialized data of item from [[SerializedChannelItemCurve]].
   * @param data A serialized item.
   */
  public deserialize( data: SerializedChannelItemCurve ): void {
    super.deserialize( data );
    this.curve = this.__automaton.getCurve( data.curve );
    this.offset = data.offset || 0.0;
    this.speed = data.speed || 1.0;
    this.length = this.length || this.curve.length || 0.0;
  }
}
