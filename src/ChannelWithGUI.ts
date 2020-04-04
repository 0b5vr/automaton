import { Channel, SerializedChannel, SerializedChannelItem } from '@fms-cat/automaton';
import { ChannelItemWithGUI, deserializeChannelItem } from './ChannelItemWithGUI';
import { AutomatonWithGUI } from './AutomatonWithGUI';
import { ChannelItemConstantWithGUI } from './ChannelItemConstantWithGUI';
import { ChannelItemCurveWithGUI } from './ChannelItemCurveWithGUI';
import { ChannelUpdateEvent } from '@fms-cat/automaton/types/Channel';
import { EventEmittable } from './mixins/EventEmittable';
import { Serializable } from './types/Serializable';
import { WithID } from './types/WithID';
import { applyMixins } from './utils/applyMixins';
import { clamp } from './utils/clamp';
import { genID } from './utils/genID';

/**
 * Handles of a new node will be created in this length.
 */
export const CHANNEL_DEFAULT_HANDLE_LENGTH = 0.5;

export const CHANNEL_FX_ROW_MAX = 5;

/**
 * Represents "Status code" of a {@link ChannelStatus}.
 */
export enum ChannelStatusCode {
  NOT_USED,
}

/**
 * Represents fatality of a {@link ChannelStatus}.
 */
export enum ChannelStatusLevel {
  INFO,
  WARNING,
  ERROR,
}

/**
 * Interface represents a status of a {@link ChannelWithGUI}.
 * Status: info / warning / error...
 */
export interface ChannelStatus {
  /**
   * Status code of the status.
   */
  code: ChannelStatusCode;

  /**
   * Fatality of the status.
   */
  level: ChannelStatusLevel;

  /**
   * Message of the status.
   */
  message?: string;
}

/**
 * It represents a channel of Automaton.
 * It's `automaton.js` and `automaton.min.js` version.
 * It has even more pretty APIs yay
 * @param automaton Parent automaton
 * @param data Data of the channel
 */
export class ChannelWithGUI extends Channel implements Serializable<SerializedChannel> {
  /**
   * The parent automaton.
   */
  protected __automaton!: AutomatonWithGUI;

  /**
   * List of channel items.
   */
  protected __items!: Array<ChannelItemWithGUI>;

  /**
   * List of status (warning / error).
   * The array is empty = you're cool
   */
  private __statusList: ChannelStatus[];

  /**
   * List of fx sections.
   */
  public get items(): Array<ChannelItemWithGUI> {
    return this.__items;
  }

  public constructor( automaton: AutomatonWithGUI, data?: SerializedChannel ) {
    super( automaton, data || { items: [] } );

    this.__statusList = [
      {
        code: ChannelStatusCode.NOT_USED,
        level: ChannelStatusLevel.WARNING,
        message: 'This channel has not been used yet'
      }
    ];
  }

  /**
   * Its current status (warning / error).
   */
  public get status(): ChannelStatus | null {
    if ( this.__statusList.length === 0 ) {
      return null;
    }

    return this.__statusList[ 0 ];
  }

  /**
   * Load a channel data.
   * @param data Data of channel
   */
  public deserialize( data: SerializedChannel ): void {
    this.__items = data.items.map( ( item ) => {
      return deserializeChannelItem( this.__automaton, item );
    } );

    this.__items.forEach( ( item ) => item.$id = genID() );
  }

  /**
   * Reset the internal states.
   * Call this method when you seek the time.
   */
  public reset(): void {
    super.reset();

    this.__emit( 'reset' );
  }

  /**
   * This method is intended to be used by [[Automaton.update]].
   * @param time The current time of the parent [[Automaton]]
   */
  public update( time: number ): void {
    const prevValue = this.__value;

    // update
    super.update( time );

    // emit if the value is changed
    if ( prevValue !== this.__value ) {
      this.__emit( 'changeValue' );
    }
  }

  /**
   * Mark this channel as used.
   */
  public markAsUsed(): void {
    this.__setStatus( false, {
      code: ChannelStatusCode.NOT_USED,
      level: ChannelStatusLevel.WARNING
    } );
  }

  /**
   * Return how many items the channel currently have.
   * @returns Items count
   */
  public getNumItems(): number {
    return this.__items.length;
  }

  /**
   * Serialize its current state.
   * @returns Serialized state
   */
  public serialize(): SerializedChannel {
    return {
      items: this.__serializeItems()
    };
  }

  /**
   * Get the nth item.
   * @param index Index of the item
   * @returns Data of the item
   */
  public getItemByIndex( index: number ): ChannelItemWithGUI {
    const item = this.__items[ index ];
    if ( !item ) {
      throw new Error( `Given item index ${index} is invalid (Current count of items: ${this.__items.length})` );
    }
    return item;
  }

  /**
   * Dump data of an item.
   * @param id Id of the node you want to dump
   * @returns Data of the node
   */
  public getItem( id: string ): SerializedChannelItem & WithID {
    const index = this.__getItemIndexById( id );
    return {
      ...this.__items[ index ].serialize(),
      $id: id
    };
  }

  /**
   * Create a constant item.
   * @param time The timepoint you want to add
   * @returns Data of the item
   */
  public createItemConstant( time: number ): ChannelItemConstantWithGUI {
    const id = genID();
    const item = new ChannelItemConstantWithGUI( this.__automaton, { time } );
    item.$id = id;
    this.__items.push( item );
    this.__sortItems();

    this.__emit( 'createItem', { id, item } );

    return item;
  }

  /**
   * Create a curve item.
   * @param curve The curve number you want to add
   * @param time The timepoint you want to add
   * @returns Data of the item
   */
  public createItemCurve( curve: number, time: number ): ChannelItemCurveWithGUI {
    const id = genID();
    const item = new ChannelItemCurveWithGUI( this.__automaton, { curve, time } );
    item.$id = id;
    this.__items.push( item );
    this.__sortItems();

    this.__emit( 'createItem', { id, item } );

    return item;
  }

  /**
   * Create an item from dumped data.
   * @param item Dumped channel item object
   * @returns Data of the item
   */
  public createItemFromData( data: SerializedChannelItem & WithID ): ChannelItemWithGUI {
    const item = deserializeChannelItem( this.__automaton, data );
    item.$id = data.$id;
    this.__items.push( item );
    this.__sortItems();

    this.__emit( 'createItem', { id: item.$id, item } );

    return item;
  }

  /**
   * Remove an item.
   * @param id Id of the item you want to remove
   */
  public removeItem( id: string ): void {
    const index = this.__getItemIndexById( id );

    this.__items.splice( index, 1 );

    this.__emit( 'removeItem', { id } );
  }

  /**
   * Move an item.
   * @param id Id of the item you want to move
   * @param time Time
   */
  public moveItem( id: string, time: number ): void {
    const index = this.__getItemIndexById( id );

    const item = this.__items[ index ];

    const prev = this.__items[ index - 1 ];
    const next = this.__items[ index + 1 ];

    const left = prev ? ( prev.time + prev.length ) : 0.0;
    const right = next ? next.time : this.__automaton.length;
    item.time = Math.min( Math.max( time, left ), right - item.length );

    this.__sortItems();

    this.__emit( 'updateItem', { id, item } );
  }

  /**
   * Move an item --force.
   * Best for undo-redo operation. probably.
   * @param id Id of the item you want to move
   * @param time Beginning time
   */
  public forceMoveItem( id: string, time: number ): void {
    const index = this.__getItemIndexById( id );

    const item = this.__items[ index ];

    item.time = time;

    this.__sortItems();

    this.__emit( 'updateItem', { id, item } );
  }

  /**
   * Resize an item.
   * @param id Index of the item you want to resize
   * @param length Length
   */
  public resizeItem( id: string, length: number ): void {
    const index = this.__getItemIndexById( id );

    const item = this.__items[ index ];

    const next = this.__items[ index + 1 ];

    const right = next ? next.time : this.__automaton.length;

    let lengthMax = right - item.time;
    if ( item instanceof ChannelItemCurveWithGUI ) {
      lengthMax = Math.min( lengthMax, ( item.curve.length - item.offset ) / item.speed );
    }

    item.length = Math.min( Math.max( length, 0.0 ), lengthMax );

    this.__emit( 'updateItem', { id, item } );
  }

  /**
   * Resize an item by left side of the end.
   * It's very GUI dev friendly method. yeah.
   * @param id Index of the item you want to resize
   * @param length Length
   */
  public resizeItemByLeft( id: string, length: number ): void {
    const index = this.__getItemIndexById( id );

    const item = this.__items[ index ];

    const prev = this.__items[ index - 1 ];

    const left = prev ? ( prev.time + prev.length ) : 0.0;

    let lengthMax = item.end - left;
    if ( item instanceof ChannelItemCurveWithGUI ) {
      lengthMax = Math.min( lengthMax, ( item.curve.length - item.offset ) / item.speed );
    }

    const end = item.end;
    item.length = Math.min( Math.max( length, 0.0 ), lengthMax );
    item.time = end - item.length;

    this.__emit( 'updateItem', { id, item } );
  }

  /**
   * Change the value of a constant item.
   * @param id Id of the item you want to change
   * @param value Your desired value
   */
  public changeConstantValue( id: string, value: number ): void {
    const index = this.__getItemIndexById( id );

    const item = this.__items[ index ] as ChannelItemConstantWithGUI;

    item.value = value;

    this.__emit( 'updateItem', { id, item } );
  }

  /**
   * Change the speed and offset of a curve item.
   * @param id Id of the item you want to change
   * @param speed Your desired speed
   * @param offset Your desired offset
   */
  public changeCurveSpeedAndOffset( id: string, speed: number, offset: number ): void {
    const index = this.__getItemIndexById( id );

    const item = this.__items[ index ] as ChannelItemCurveWithGUI;

    item.speed = Math.max( speed, 0.0 );
    item.offset = clamp( offset, 0.0, item.length );
    item.length = Math.min( item.length, ( item.curve.length - item.offset ) / item.speed );

    this.__emit( 'updateItem', { id, item } );
  }

  /**
   * Call when you need to change the length of the automaton.
   * Should not be called by anywhere except {@link AutomatonWithGUI#setLength}.
   */
  public changeLength(): void {
    // iterating items from the tail
    for ( let i = this.__items.length - 1; 0 <= i; i -- ) {
      const item = this.__items[ i ];

      if ( this.__automaton.length < item.time ) {
        // if the beginning time of the fx is larger than the new length, remove it
        this.__items.splice( i, 1 );
        this.__emit( 'removeItem', { id: item.$id } );

      } else if ( this.__automaton.length < ( item.time + item.length ) ) {
        // if the ending time of the fx is larger than the new length, shorten it
        item.length = this.__automaton.length - item.time;
        this.__emit( 'updateItem', { id: item.$id, item } );

      }
    }
  }

  /**
   * Serialize its items.
   * @returns Serialized items
   */
  private __serializeItems(): SerializedChannelItem[] {
    return this.__items.map( ( item ) => item.serialize() );
  }

  /**
   * Set a status.
   * @param bool Boolean whether the status is currently active or not
   * @param status The status
   */
  private __setStatus( bool: boolean, status: ChannelStatus ): void {
    if ( !this.__statusList ) { // Channel.constructor -> ... -> ChannelWithGUI.precalc -> ChannelWithGUI.__setStatus
      return;
    }

    const prevStatus = this.status;

    // search for old entry, then delete it
    for ( let i = 0; i < this.__statusList.length; i ++ ) {
      if ( this.__statusList[ i ].code === status.code ) {
        this.__statusList.splice( i, 1 );
        break;
      }
    }

    if ( bool ) {
      this.__statusList.push( status );
      this.__statusList.sort( ( a, b ) => b.level - a.level );
    }

    if ( prevStatus !== this.status ) {
      this.__emit( 'updateStatus' );
    }
  }

  /**
   * Search for item that has given id then return index of it.
   * If it couldn't find the item, it will throw an error instead.
   * @param id Id of item you want to grab
   * @returns The index of the item
   */
  private __getItemIndexById( id: string ): number {
    const index = this.__items.findIndex( ( item ) => item.$id === id );
    if ( index === -1 ) { throw new Error( `Searched for item id: ${id} but not found` ); }
    return index;
  }

  /**
   * Sort items by time.
   */
  private __sortItems(): void {
    this.__items = this.__items.sort( ( a, b ) => ( a.time || 0.0 ) - ( b.time || 0.0 ) );
  }
}

export interface ChannelWithGUIEvents {
  createItem: { id: string; item: ChannelItemWithGUI };
  updateItem: { id: string; item: ChannelItemWithGUI };
  removeItem: { id: string };
  changeValue: void;
  reset: void;
  update: { id: string; item: ChannelItemWithGUI; event: ChannelUpdateEvent };
  updateStatus: void;
}

export interface ChannelWithGUI extends EventEmittable<ChannelWithGUIEvents> {}
applyMixins( ChannelWithGUI, [ EventEmittable ] );
