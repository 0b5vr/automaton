import { Automaton } from '.';
import { SerializedChannelItem } from './types/SerializedChannelItem';

/**
 * Represents an item of a [[Channel]].
 */
export abstract class ChannelItem {
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

  public abstract getValue( time: number ): number;

  /**
   * Deserialize a serialized data of item from [[SerializedChannelItem]].
   * @param data A serialized item.
   */
  public deserialize( data: SerializedChannelItem ): void {
    this.time = data.time || 0.0;
    this.length = data.length || 0.0;
  }
}
