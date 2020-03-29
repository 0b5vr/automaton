import { Automaton } from './Automaton';
import { ChannelItem } from './types/ChannelItem';
import { Curve } from './Curve';
import { SerializedChannel } from './types/SerializedChannel';

/**
 * Represent an event that is emitted by [[Channel.update]].
 */
export interface ChannelUpdateEvent {
  /**
   * Current value of the channel.
   */
  value: number;

  /**
   * `true` if the update was the first call of the item.
   */
  init?: true;

  /**
   * `true` if the update was the last call of the item.
   */
  uninit?: true;

  /**
   * The progress of the item.
   */
  progress: number;
}

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
  public get value(): number { return this.__value; }

  /**
   * The time that was used for the calculation of [[__lastValue]].
   */
  public get time(): number { return this.__time; }

  /**
   * Load a serialized data of a channel.
   * @param data Data of a channel
   */
  public deserialize( data: SerializedChannel ): void {
    this.__items = data.items;
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
   * This method is intended to be used by [[Automaton.update]].
   * @param time The current time of the parent [[Automaton]]
   * @returns whether the value has been changed or not
   */
  public update( time: number ): void {
    let value = this.__value;
    const prevTime = this.__time;

    for ( let i = this.__head; i < this.__items.length; i ++ ) {
      const item = this.__items[ i ];

      let curve: Curve | undefined;
      if ( 'curve' in item ) {
        curve = this.__automaton.getCurve( item.curve );
      }

      const begin = item.time || 0.0;
      const length = item.length || curve?.length || 0.0;
      const end = begin + length;

      if ( time < begin ) {
        break;
      }

      if ( begin <= time && prevTime <= end ) {
        let progress: number;
        let init: true | undefined;
        let uninit: true | undefined;

        if ( end < time ) {
          progress = 1.0;
          uninit = true;

          if ( i === this.__head ) {
            this.__head ++;
          }
        } else {
          progress = length !== 0.0
            ? ( time - begin ) / length
            : 1.0;
        }

        if ( prevTime < begin ) {
          init = true;
        }

        if ( 'curve' in item ) {
          const curveTime = ( item.offset || 0.0 ) + ( time - begin ) * ( item.speed || 1.0 );
          const curve = this.__automaton.getCurve( item.curve );
          value = curve.getValue( curveTime );
        } else { // constant
          value = item.value || 0.0;
        }

        this.__listeners.forEach( ( listener ) => listener( {
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
