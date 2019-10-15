import { WithID } from '../types/WithID';

export function removeID<T>( object: T & WithID ): T {
  delete object.$id;
  return object;
}
