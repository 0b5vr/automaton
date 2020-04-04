import { ChannelItemCurve, SerializedChannelItemCurve } from '@fms-cat/automaton';
import { AutomatonWithGUI } from './AutomatonWithGUI';
import { CurveWithGUI } from './CurveWithGUI';
import { SerializableWithID } from './types/SerializableWithID';
import { WithID } from './types/WithID';
import { applyMixins } from './utils/applyMixins';

export class ChannelItemCurveWithGUI extends ChannelItemCurve {
  protected __automaton!: AutomatonWithGUI;

  public curve!: CurveWithGUI;

  public getValue( time: number ): number {
    const value = super.getValue( time );
    this.curve.setPreviewTimeValue( time, value );
    this.curve.markAsUsed();
    return value;
  }

  /**
   * Serialize its current state.
   * @returns Serialized state
   */
  public serialize(): SerializedChannelItemCurve {
    const data: SerializedChannelItemCurve = {
      curve: this.__automaton.getCurveIndex( this.curve )
    };

    if ( this.time !== 0.0 ) { data.time = this.time; }
    if ( this.length !== this.curve.length ) { data.length = this.length; }
    if ( this.offset !== 0.0 ) { data.offset = this.offset; }
    if ( this.speed !== 1.0 ) { data.speed = this.speed; }

    return data;
  }

  /**
   * Serialize its current state, but every fields are required + $id is there.
   * @returns Serialized state
   */
  public serializeGUI(): Required<SerializedChannelItemCurve> & WithID {
    const data: Required<SerializedChannelItemCurve> & WithID = {
      $id: this.$id,
      time: this.time,
      length: this.length,
      offset: this.offset,
      speed: this.speed,
      curve: this.__automaton.getCurveIndex( this.curve )
    };

    return data;
  }
}

export interface ChannelItemCurveWithGUI extends SerializableWithID<SerializedChannelItemCurve> {}
applyMixins( ChannelItemCurveWithGUI, [ SerializableWithID ] );
