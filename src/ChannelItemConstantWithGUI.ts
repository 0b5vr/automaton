import { ChannelItemConstant, SerializedChannelItemConstant } from '@fms-cat/automaton';
import { AutomatonWithGUI } from './AutomatonWithGUI';
import { SerializableWithID } from './types/SerializableWithID';
import { WithID } from './types/WithID';
import { applyMixins } from './utils/applyMixins';

export class ChannelItemConstantWithGUI extends ChannelItemConstant {
  protected __automaton!: AutomatonWithGUI;

  /**
   * Serialize its current state.
   * @returns Serialized state
   */
  public serialize(): SerializedChannelItemConstant {
    const data: SerializedChannelItemConstant = {};

    if ( this.time !== 0.0 ) { data.time = this.time; }
    if ( this.length !== 0.0 ) { data.length = this.length; }
    if ( this.value !== 0.0 ) { data.value = this.value; }

    return data;
  }

  /**
   * Serialize its current state, but every fields are required + $id is there.
   * @returns Serialized state
   */
  public serializeGUI(): Required<SerializedChannelItemConstant> & WithID {
    const data: Required<SerializedChannelItemConstant> & WithID = {
      $id: this.$id,
      time: this.time,
      length: this.length,
      value: this.value
    };

    return data;
  }
}

export interface ChannelItemConstantWithGUI
  extends SerializableWithID<SerializedChannelItemConstant> {}
applyMixins( ChannelItemConstantWithGUI, [ SerializableWithID ] );
