import { Serializable } from './Serializable';
import { WithID } from './WithID';
export declare abstract class SerializableWithID<T> {
    serializeWithID(): T & WithID;
}
export interface SerializableWithID<T> extends Serializable<T> {
}
export interface SerializableWithID<T> extends WithID {
}
