import { AutomatonWithGUI } from './AutomatonWithGUI';
import { ChannelItem, SerializedChannelItem } from '@0b5vr/automaton';
import { CurveWithGUI } from './CurveWithGUI';
import { SerializableWithID } from './types/SerializableWithID';
import type { StateChannelItem } from './types/StateChannelItem';
export interface ChannelItemWithGUI extends SerializableWithID<SerializedChannelItem> {
}
export declare class ChannelItemWithGUI extends ChannelItem {
    protected __automaton: AutomatonWithGUI;
    curve?: CurveWithGUI;
    /**
     * TODO
     * @param time The timepoint you want to grab the value
     * @param isFromGUI If you're poking the method from Automaton GUI, set this to true otherwise you are going to suffer in redux hell
     */
    getValue(time: number, isFromGUI?: boolean): number;
    deserialize(data: SerializedChannelItem | StateChannelItem): void;
    /**
     * Serialize its current state.
     * @returns Serialized state
     */
    serialize(): SerializedChannelItem;
    /**
     * Serialize its current state, but every fields are required + $id is there.
     * @returns Serialized state
     */
    serializeGUI(): StateChannelItem;
}
