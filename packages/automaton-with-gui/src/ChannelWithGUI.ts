import { AutomatonWithGUI } from './AutomatonWithGUI';
import { Channel, SerializedChannel, SerializedChannelItem, binarySearch } from '@0b5vr/automaton';
import { ChannelItemWithGUI } from './ChannelItemWithGUI';
import { EventEmittable } from './mixins/EventEmittable';
import { Serializable } from './types/Serializable';
import { StatusLevel, WithStatus } from './types/Status';
import { applyMixins } from './utils/applyMixins';
import { clamp } from './utils/clamp';
import { genID } from './utils/genID';
import type { StateChannelItem } from './types/StateChannelItem';

const EPSILON = 1E-4;

/**
 * Represents "Status code" of a status of the {@link Channel}.
 */
export enum ChannelStatusCode {
  NOT_USED,
}

/**
 * It represents a channel of Automaton.
 * It has even more pretty APIs than raw {@link Channel} yay
 * It has even more pretty APIs yay
 * @param automaton Parent automaton
 * @param data Data of the channel
 */
export interface ChannelWithGUI extends EventEmittable<ChannelWithGUIEvents> {}
export interface ChannelWithGUI extends WithStatus<ChannelStatusCode> {}
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
   * List of fx sections.
   */
  public get items(): Array<ChannelItemWithGUI> {
    return this.__items;
  }

  /**
   * The initial value of the channel.
   */
  public get init(): number {
    return this.__init;
  }

  /**
   * Whether it should reset itself in next update call or not.
   */
  private __shouldReset = false;

  /**
   * Its length i.e. the end of the last item.
   */
  public get length(): number {
    if ( this.__items.length === 0 ) { return 0.0; }
    return this.__items[ this.__items.length - 1 ].end;
  }

  public constructor( automaton: AutomatonWithGUI, data?: SerializedChannel ) {
    super( automaton, data ?? {} );

    this.__watchStatus( () => {
      this.__setStatus( {
        code: ChannelStatusCode.NOT_USED,
        level: StatusLevel.WARNING,
        message: 'This channel has not been used yet'
      } );
    } );
  }

  /**
   * Load a channel data.
   * @param data Data of channel
   */
  public deserialize( data: SerializedChannel ): void {
    this.__items = data.items?.map( ( itemData ) => {
      const item = new ChannelItemWithGUI( this.__automaton, itemData );
      item.$id = genID();
      item.curve?.incrementUserCount();
      return item;
    } ) ?? [];
    this.__init = data.init ?? 0.0;
  }

  /**
   * Reset the internal states.
   * Call this method when you seek the time.
   */
  public reset(): void {
    const prevValue = this.__value;

    super.reset();

    this.__emit( 'reset' );

    // emit if the value is changed
    if ( prevValue !== this.__value ) {
      this.__emit( 'changeValue', { value: this.__value } );
    }
  }

  /**
   * Mark this channel as should be reset in next update call.
   * Almost same as {@link update}, but not instant.
   */
  public cueReset(): void {
    this.__shouldReset = true;
  }

  /**
   * If you want to grab a value from GUI for some reasons, use this.
   * This supresses updating the preview value for curves.
   * @param time Time at the point you want to grab the value.
   * @returns Result value
   */
  public getValueFromGUI( time: number ): number {
    // no items??? damn
    if ( this.__items.length === 0 ) {
      return this.__init;
    }

    const next = binarySearch( this.__items, ( item ) => ( item.time <= time ) );

    // it's the first one!
    if ( next === 0 ) {
      return this.__init;
    }

    const item = this.__items[ next - 1 ];
    return ( item.reset && item.end <= time )
      ? this.__init
      : item.getValue( time - item.time, true );
  }

  /**
   * This method is intended to be used by [[Automaton.update]].
   * Consume and return items.
   * @param time The current time of the parent [[Automaton]]
   * @returns Array of tuples, [ timing of the event, a function that execute the event ]
   */
  public consume( time: number ): [ time: number, update: () => void ][] {
    // Reset this, if required
    if ( this.__shouldReset ) {
      this.__shouldReset = false;
      this.reset();
    }

    // `this.reset()` also modifies the value and emit a `'changeValue'`
    let prevValue = this.__value;

    // consume
    const ret = super.consume( time );

    // replace the last event
    if ( ret.length !== 0 ) {
      const retLast = ret[ ret.length - 1 ];
      const retLastUpdate = retLast[ 1 ];

      retLast[ 1 ] = () => {
        // call the update
        retLastUpdate();

        // emit if the value is changed
        if ( prevValue !== this.__value ) {
          this.__emit( 'changeValue', { value: this.__value } );
          prevValue = this.__value;
        }
      };
    }

    return ret;
  }

  /**
   * Mark this channel as used.
   */
  public markAsUsed(): void {
    this.__watchStatus( () => {
      this.__deleteStatus( ChannelStatusCode.NOT_USED );
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
      items: this.__serializeItems(),
      init: this.__init,
    };
  }

  /**
   * Get the nth item.
   * @param index Index of the item
   * @returns Data of the item
   */
  public getItemByIndex( index: number ): StateChannelItem {
    const item = this.__items[ index ];
    if ( !item ) {
      throw new Error( `Given item index ${index} is invalid (Current count of items: ${this.__items.length})` );
    }
    return item.serializeGUI();
  }

  /**
   * Dump data of an item.
   * @param id Id of the node you want to dump
   * @returns Data of the node
   */
  public getItem( id: string ): StateChannelItem {
    const index = this.__getItemIndexById( id );
    return this.__items[ index ].serializeGUI();
  }

  /**
   * [[getItem]], but can return null when it cannot find the item.
   * @param id Id of the node you want to dump
   * @returns Data of the node
   */
  public tryGetItem( id: string ): ( StateChannelItem ) | null {
    const index = this.__tryGetItemIndexById( id );
    if ( index === -1 ) { return null; }
    return this.__items[ index ].serializeGUI();
  }

  /**
   * Check whether the item is the last item or not.
   * @param id Id of the item you want to check
   */
  public isLastItem( id: string ): boolean {
    const index = this.__getItemIndexById( id );
    return index === this.__items.length - 1;
  }

  /**
   * Duplicate an item.
   * @param time The timepoint you want to add
   * @param item The item you want to duplicate
   * @returns Data of created item
   */
  public duplicateItem(
    time: number,
    item: StateChannelItem
  ): StateChannelItem {
    const id = genID();
    const newItem = new ChannelItemWithGUI( this.__automaton, item );
    newItem.$id = id;
    newItem.time = time;
    newItem.curve?.incrementUserCount();
    this.__items.push( newItem );
    this.__sortItems();

    // shorten the item when the next item is too close
    const itemIndex = this.__items.findIndex( ( item ) => item.$id === id );
    const next = this.__items[ itemIndex + 1 ];
    const right = next ? next.time : Infinity;
    newItem.length = Math.min( newItem.length, right - newItem.time );

    this.reset();

    this.__emit( 'createItem', { id, item: newItem.serializeGUI() } );

    // if the item is the last item, change its length
    if ( this.isLastItem( id ) ) {
      this.__emit( 'changeLength', { length: this.length } );
    }

    this.__automaton.shouldSave = true;

    return newItem.serializeGUI();
  }

  /**
   * "Repeat" (duplicate) the given item.
   * @param id The item you want to repeat
   * @returns Data of created item
   */
  public repeatItem( id: string ): StateChannelItem {
    const index = this.__getItemIndexById( id );
    const item = this.__items[ index ];

    // pick the next vacancy
    let time = this.__items[ this.__items.length - 1 ].end;
    for ( let i = index; i < this.__items.length - 1; i ++ ) {
      const current = this.__items[ i ];
      const left = current.end;
      const next = this.__items[ i + 1 ];
      const right = next.time;
      if ( EPSILON < ( right - left ) ) {
        time = left;
        break;
      }
    }

    return this.duplicateItem( time, item.serializeGUI() );
  }

  /**
   * Create a constant item.
   * @param time The timepoint you want to add
   * @returns Data of the item
   */
  public createItemConstant( time: number ): StateChannelItem {
    const id = genID();
    const item = new ChannelItemWithGUI( this.__automaton, { time } );
    item.$id = id;
    this.__items.push( item );
    this.__sortItems();

    this.reset();

    this.__emit( 'createItem', { id, item: item.serializeGUI() } );

    // if the item is the last item, change its length
    if ( this.isLastItem( id ) ) {
      this.__emit( 'changeLength', { length: this.length } );
    }

    this.__automaton.shouldSave = true;

    return item.serializeGUI();
  }

  /**
   * Create a curve item.
   * @param curveId The curve id you want to add
   * @param time The timepoint you want to add
   * @returns Data of the item
   */
  public createItemCurve( curveId: string, time: number ): StateChannelItem {
    const id = genID();
    const curve = this.__automaton.getCurveIndexById( curveId );
    const item = new ChannelItemWithGUI( this.__automaton, { curve, time } );
    item.$id = id;
    item.curve?.incrementUserCount();
    this.__items.push( item );
    this.__sortItems();

    // shorten the item when the next item is too close
    const itemIndex = this.__items.findIndex( ( item ) => item.$id === id );
    const next = this.__items[ itemIndex + 1 ];
    const right = next ? next.time : Infinity;
    item.length = Math.min( item.length, right - item.time );

    this.reset();

    this.__emit( 'createItem', { id, item: item.serializeGUI() } );

    // if the item is the last item, change its length
    if ( this.isLastItem( id ) ) {
      this.__emit( 'changeLength', { length: this.length } );
    }

    this.__automaton.shouldSave = true;

    return item.serializeGUI();
  }

  /**
   * Create an item from dumped data.
   * @param item Dumped channel item object
   * @returns Data of the item
   */
  public createItemFromData(
    data: StateChannelItem
  ): StateChannelItem {
    const item = new ChannelItemWithGUI( this.__automaton, data );
    item.$id = data.$id;
    item.curve?.incrementUserCount();
    this.__items.push( item );
    this.__sortItems();

    this.reset();

    this.__emit( 'createItem', { id: item.$id, item: item.serializeGUI() } );

    // if the item is the last item, change its length
    if ( this.isLastItem( item.$id ) ) {
      this.__emit( 'changeLength', { length: this.length } );
    }

    this.__automaton.shouldSave = true;

    return item.serializeGUI();
  }

  /**
   * Remove an item.
   * @param id Id of the item you want to remove
   */
  public removeItem( id: string ): void {
    const index = this.__getItemIndexById( id );
    const item = this.__items[ index ];

    item.curve?.decrementUserCount();

    const isLastItem = this.isLastItem( id );
    this.__items.splice( index, 1 );

    this.reset();

    this.__emit( 'removeItem', { id } );

    // if we delete the last node, change the length
    if ( isLastItem ) {
      this.__emit( 'changeLength', { length: this.length } );
    }

    this.__automaton.shouldSave = true;
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
    const left = prev ? ( prev.time + prev.length ) : 0.0;
    const next = this.__items[ index + 1 ];
    const right = next ? next.time : Infinity;
    item.time = clamp( time, left, right - item.length );

    this.__sortItems();

    this.reset();

    this.__emit( 'updateItem', { id, item: item.serializeGUI() } );

    // if the item is the last item, change its length
    if ( this.isLastItem( item.$id ) ) {
      this.__emit( 'changeLength', { length: this.length } );
    }

    this.__automaton.shouldSave = true;
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

    this.reset();

    this.__emit( 'updateItem', { id, item: item.serializeGUI() } );

    // if the item is the last item, change its length
    if ( this.isLastItem( item.$id ) ) {
      this.__emit( 'changeLength', { length: this.length } );
    }

    this.__automaton.shouldSave = true;
  }

  /**
   * Resize an item.
   * @param id Index of the item you want to resize
   * @param length Length
   * @param mode 'default', 'stretch', or 'repeat'.
   */
  public resizeItem(
    id: string,
    length: number,
    mode?: 'default' | 'stretch' | 'repeat' | boolean,
  ): void {
    // Delet this in v5.0.0
    if ( typeof mode === 'boolean' ) {
      mode = mode ? 'repeat' : 'default';
      console.warn( `Giving boolean to the third argument of resizeItem is deprecated! Please replace with "${ mode }".` );
    }

    const index = this.__getItemIndexById( id );

    const item = this.__items[ index ];

    const next = this.__items[ index + 1 ];
    const right = next ? next.time : Infinity;
    const prevLength = item.length;
    item.length = clamp( length, 0.0, right - item.time );

    if ( mode === 'stretch' ) {
      item.repeat *= item.length / prevLength;
      item.speed *= prevLength / item.length;
    } else if ( mode === 'repeat' ) {
      // do nothing
    } else {
      item.repeat = item.length;
    }

    this.reset();

    this.__emit( 'updateItem', { id, item: item.serializeGUI() } );

    // if the item is the last item, change its length
    if ( this.isLastItem( item.$id ) ) {
      this.__emit( 'changeLength', { length: this.length } );
    }

    this.__automaton.shouldSave = true;
  }

  /**
   * Resize an item by left side of the end.
   * It's very GUI dev friendly method. yeah.
   * @param id Index of the item you want to resize
   * @param length Length
   * @param mode 'default', 'stretch', or 'repeat'.
   */
  public resizeItemByLeft(
    id: string,
    length: number,
    mode?: 'default' | 'stretch' | 'repeat' | boolean,
  ): void {
    // Delet this in v5.0.0
    if ( typeof mode === 'boolean' ) {
      mode = mode ? 'repeat' : 'default';
      console.warn( `Giving boolean to the third argument of resizeItem is deprecated! Please replace with "${ mode }".` );
    }

    const index = this.__getItemIndexById( id );

    const item = this.__items[ index ];

    const prev = this.__items[ index - 1 ];

    const left = prev ? ( prev.time + prev.length ) : 0.0;
    const prevLength = item.length;
    const endOffset = item.length * item.speed + item.offset;

    const lengthMax = item.end - left;

    const end = item.end;
    item.length = Math.min( Math.max( length, 0.0 ), lengthMax );
    item.time = end - item.length;

    if ( mode === 'stretch' ) {
      item.speed *= prevLength / item.length;
    } else if ( mode === 'repeat' ) {
      // do nothing
    } else {
      item.offset = endOffset - item.length * item.speed;
      item.repeat = item.length;
    }

    this.reset();

    this.__emit( 'updateItem', { id, item: item.serializeGUI() } );

    this.__automaton.shouldSave = true;
  }

  /**
   * Change the value of an item.
   * @param id Id of the item you want to change
   * @param value Your desired value
   */
  public changeItemValue( id: string, value: number ): void {
    const index = this.__getItemIndexById( id );

    const item = this.__items[ index ];

    item.value = value;

    this.reset();

    this.__emit( 'updateItem', { id, item: item.serializeGUI() } );

    this.__automaton.shouldSave = true;
  }

  /**
   * Change the reset of an item.
   * @param id Id of the item you want to change
   * @param reset Reset
   */
  public changeItemReset( id: string, reset: boolean ): void {
    const index = this.__getItemIndexById( id );

    const item = this.__items[ index ];

    item.reset = reset;

    this.reset();

    this.__emit( 'updateItem', { id, item: item.serializeGUI() } );

    this.__automaton.shouldSave = true;
  }

  /**
   * Change the repeat of a curve item.
   * @param id Id of the item you want to change
   * @param repeat Your desired repeat time
   */
  public changeCurveRepeat( id: string, repeat: number ): void {
    const index = this.__getItemIndexById( id );

    const item = this.__items[ index ];

    item.repeat = Math.max( repeat, 0.0 );

    this.reset();

    this.__emit( 'updateItem', { id, item: item.serializeGUI() } );

    this.__automaton.shouldSave = true;
  }

  /**
   * Change the speed and offset of a curve item.
   * @param id Id of the item you want to change
   * @param speed Your desired speed
   * @param offset Your desired offset
   */
  public changeCurveSpeedAndOffset( id: string, speed: number, offset: number ): void {
    const index = this.__getItemIndexById( id );

    const item = this.__items[ index ];

    item.speed = Math.max( speed, 0.0 );
    item.offset = offset;

    this.reset();

    this.__emit( 'updateItem', { id, item: item.serializeGUI() } );

    this.__automaton.shouldSave = true;
  }

  /**
   * Change the amp a curve item.
   * @param id Id of the item you want to change
   * @param amp Your desired amp
   */
  public changeCurveAmp( id: string, amp: number ): void {
    const index = this.__getItemIndexById( id );

    const item = this.__items[ index ];

    item.amp = amp;

    this.reset();

    this.__emit( 'updateItem', { id, item: item.serializeGUI() } );

    this.__automaton.shouldSave = true;
  }

  /**
   * Change the init of the channel.
   * @param init The initial value
   */
  public changeInit( init: number ): void {
    this.__init = init;

    this.reset();

    this.__emit( 'changeInit', { init } );

    this.__automaton.shouldSave = true;
  }

  /**
   * Serialize its items.
   * @returns Serialized items
   */
  private __serializeItems(): SerializedChannelItem[] {
    return this.__items.map( ( item ) => item.serialize() );
  }

  /**
   * Watch for status changes.
   * Execute given procedure immediately.
   * If the procedure changes its status, emit an event.
   * @param procedure A procedure that might change its status
   */
  private __watchStatus( procedure: () => void ): void {
    const prevStatus = this.status;

    procedure();

    if ( prevStatus !== this.status ) {
      this.__emit( 'updateStatus' );
    }
  }

  /**
   * [[__getItemIndexById]], but can return -1 when it cannot find the item.
   */
  private __tryGetItemIndexById( id: string ): number {
    return this.__items.findIndex( ( item ) => item.$id === id );
  }

  /**
   * Search for item that has given id then return index of it.
   * If it couldn't find the item, it will throw an error instead.
   * @param id Id of item you want to grab
   * @returns The index of the item
   */
  private __getItemIndexById( id: string ): number {
    const index = this.__tryGetItemIndexById( id );
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
  createItem: { id: string; item: StateChannelItem };
  updateItem: { id: string; item: StateChannelItem };
  removeItem: { id: string };
  changeValue: { value: number };
  reset: void;
  updateStatus: void;
  changeInit: { init: number };
  changeLength: { length: number };
}

applyMixins( ChannelWithGUI, [ EventEmittable, WithStatus ] );
