import { Automaton } from './Automaton';
import { ChannelItem } from './ChannelItem';
import { SerializedChannelItemConstant } from './types/SerializedChannelItemConstant';

/**
 * Represents a constant item of a [[Channel]].
 */
export class ChannelItemConstant extends ChannelItem {
  /**
   * The value of the item.
   */
  public value!: number;

  /**
   * Constructor of the [[ChannelItemConstant]].
   * @param automaton Parent automaton
   * @param data Data of the item
   */
  public constructor( automaton: Automaton, data: SerializedChannelItemConstant ) {
    super( automaton, data );
  }

  public getValue(): number {
    return this.value;
  }

  /**
   * Deserialize a serialized data of item from [[SerializedChannelItemConstant]].
   * @param data A serialized item.
   */
  public deserialize( data: SerializedChannelItemConstant ): void {
    super.deserialize( data );
    this.value = data.value || 0.0;
  }
}
