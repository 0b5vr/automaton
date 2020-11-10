import { Automaton } from './Automaton';
import { ChannelItem } from './ChannelItem';
import type { ChannelUpdateEvent } from './types/ChannelUpdateEvent';
import type { SerializedChannel } from './types/SerializedChannel';

/**
 * It represents a channel of Automaton.
 */
export class Channel {
  /**
   * The parent automaton.
   */
  protected __automaton: Automaton;

  /**
   * List of channel items.
   */
  protected __items: ChannelItem[] = [];

  /**
   * A cache of last calculated value.
   */
  protected __value: number = 0.0;

  /**
   * The time that was used for the calculation of [[__lastValue]].
   */
  protected __time: number = -Infinity;

  /**
   * The index of [[__items]] it should evaluate next.
   */
  protected __head: number = 0;

  /**
   * An array of listeners.
   */
  protected __listeners: Array<( event: ChannelUpdateEvent ) => void> = [];

  /**
   * Constructor of the [[Channel]].
   * @param automaton Parent automaton
   * @param data Data of the channel
   */
  public constructor( automaton: Automaton, data: SerializedChannel ) {
    this.__automaton = automaton;

    this.deserialize( data );
  }

  /**
   * A cache of last calculated value.
   */
  public get currentValue(): number { return this.__value; }

  /**
   * The time that was used for the calculation of [[__lastValue]].
   */
  public get currentTime(): number { return this.__time; }

  /**
   * Load a serialized data of a channel.
   * @param data Data of a channel
   */
  public deserialize( data: SerializedChannel ): void {
    this.__items = data.items.map( ( item ) => new ChannelItem( this.__automaton, item ) );
  }

  /**
   * Reset the internal states.
   * Call this method when you seek the time.
   */
  public reset(): void {
    this.__time = -Infinity;
    this.__value = 0;
    this.__head = 0;
  }

  /**
   * Add a new listener that receives a [[ChannelUpdateEvent]] when an update is happened.
   * @param listener A subscribing listener
   */
  public subscribe( listener: ( event: ChannelUpdateEvent ) => void ): void {
    this.__listeners.push( listener );
  }

  /**
   * Return the value of specified time point.
   * @param time Time at the point you want to grab the value.
   * @returns Result value
   */
  public getValue( time: number ): number {
    let next = this.__items.findIndex( ( item ) => ( time < item.time ) );

    // it's the first one!
    if ( next === 0 ) {
      return 0.0;
    }

    // it's the last one!
    if ( next === -1 ) {
      next = this.__items.length;
    }

    const item = this.__items[ next - 1 ];
    if ( item.end < time ) {
      return item.getValue( item.length );
    } else {
      return item.getValue( time - item.time );
    }
  }

  /**
   * This method is intended to be used by [[Automaton.update]].
   * @param time The current time of the parent [[Automaton]]
   * @returns whether the value has been changed or not
   */
  public update( time: number ): void {
    let value = this.__value;
    const prevTime = this.__time;

    for ( let i = this.__head; i < this.__items.length; i ++ ) {
      const item = this.__items[ i ];
      const { time: begin, end, length } = item;
      let elapsed = time - begin;

      if ( elapsed < 0.0 ) {
        break;
      } else {
        let progress: number;
        let init: true | undefined;
        let uninit: true | undefined;

        if ( length <= elapsed ) {
          elapsed = length;
          progress = 1.0;
          uninit = true;

          if ( i === this.__head ) {
            this.__head ++;
          }
        } else {
          progress = length !== 0.0
            ? elapsed / length
            : 1.0;
        }

        if ( prevTime < begin ) {
          init = true;
        }

        value = item.getValue( elapsed );

        this.__listeners.forEach( ( listener ) => listener( {
          time,
          elapsed,
          begin,
          end,
          length,
          value,
          progress,
          init,
          uninit,
        } ) );
      }
    }

    this.__time = time;
    this.__value = value;
  }
}