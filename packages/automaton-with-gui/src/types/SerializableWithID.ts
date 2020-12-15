import { Serializable } from './Serializable';
import { WithID } from './WithID';

export abstract class SerializableWithID<T> {
  public serializeWithID(): T & WithID {
    const data = this.serialize();
    return {
      ...data,
      $id: this.$id
    };
  }
}

export interface SerializableWithID<T> extends Serializable<T> {}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface SerializableWithID<T> extends WithID {}
