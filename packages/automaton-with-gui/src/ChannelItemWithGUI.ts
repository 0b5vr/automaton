import { AutomatonWithGUI } from './AutomatonWithGUI';
import { ChannelItem, SerializedChannelItem } from '@0b5vr/automaton';
import { CurveWithGUI } from './CurveWithGUI';
import { SerializableWithID } from './types/SerializableWithID';
import { applyMixins } from './utils/applyMixins';
import type { StateChannelItem } from './types/StateChannelItem';

export interface ChannelItemWithGUI extends SerializableWithID<SerializedChannelItem> {}
export class ChannelItemWithGUI extends ChannelItem {
  protected __automaton!: AutomatonWithGUI;

  public curve?: CurveWithGUI;

  /**
   * TODO
   * @param time The timepoint you want to grab the value
   * @param isFromGUI If you're poking the method from Automaton GUI, set this to true otherwise you are going to suffer in redux hell
   */
  public getValue( time: number, isFromGUI?: boolean ): number {
    const value = super.getValue( time );

    if ( this.curve && !isFromGUI ) {
      this.curve.emitPreviewTime( {
        time: this.offset + time * this.speed,
        value: this.curve.getValue( this.offset + time * this.speed ),
        itemTime: this.time,
        itemOffset: this.offset,
        itemSpeed: this.speed,
      } );
    }

    return value;
  }

  public deserialize( data: SerializedChannelItem | StateChannelItem ): void {
    if ( 'curveId' in data && data.curveId != null ) {
      super.deserialize( {
        ...data,
        curve: this.__automaton.getCurveIndexById( data.curveId )
      } );
    } else {
      super.deserialize( data );
    }
  }

  /**
   * Serialize its current state.
   * @returns Serialized state
   */
  public serialize(): SerializedChannelItem {
    const data: SerializedChannelItem = {};

    if ( this.time !== 0.0 ) { data.time = this.time; }
    if ( this.length !== 0.0 ) { data.length = this.length; }
    if ( this.value !== 0.0 ) { data.value = this.value; }
    if ( this.repeat != null && this.repeat !== this.length ) {
      data.repeat = this.repeat;
    }
    if ( this.reset ) { data.reset = true; }
    if ( this.curve ) {
      data.curve = this.__automaton.getCurveIndex( this.curve );
      if ( this.offset !== 0.0 ) { data.offset = this.offset; }
      if ( this.speed !== 1.0 ) { data.speed = this.speed; }
      if ( this.amp !== 1.0 ) { data.amp = this.amp; }
    }

    return data;
  }

  /**
   * Serialize its current state, but every fields are required + $id is there.
   * @returns Serialized state
   */
  public serializeGUI(): StateChannelItem {
    const data: StateChannelItem = {
      $id: this.$id,
      time: this.time,
      length: this.length,
      value: this.value,
      repeat: this.repeat || this.length,
      reset: this.reset ?? false,
      offset: this.offset,
      speed: this.speed,
      amp: this.amp,
      curveId: this.curve?.$id ?? null,
    };

    return data;
  }
}

applyMixins( ChannelItemWithGUI, [ SerializableWithID ] );
