import { ChannelItem, SerializedChannelItem } from '@fms-cat/automaton';
import { AutomatonWithGUI } from './AutomatonWithGUI';
import { CurveWithGUI } from './CurveWithGUI';
import { SerializableWithID } from './types/SerializableWithID';
import { WithID } from './types/WithID';
import { applyMixins } from './utils/applyMixins';

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
      this.curve.setPreviewTime( time );
      this.curve.markAsUsed();
    }
    return value;
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
  public serializeGUI(): Required<SerializedChannelItem> & WithID {
    const data: Required<SerializedChannelItem> & WithID = {
      $id: this.$id,
      time: this.time,
      length: this.length,
      value: this.value,
      offset: this.offset,
      speed: this.speed,
      amp: this.amp,
      curve: this.curve ? this.__automaton.getCurveIndex( this.curve ) : null
    };

    return data;
  }
}

export interface ChannelItemWithGUI extends SerializableWithID<SerializedChannelItem> {}
applyMixins( ChannelItemWithGUI, [ SerializableWithID ] );
