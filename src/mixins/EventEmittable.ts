// Ref: https://github.com/andywer/typed-emitter/blob/master/index.d.ts

export type EventListener<T> = ( event: T ) => void;

export class EventEmittable<TEvents extends { [ type: string ]: any }> {
  protected __eventListeners?: Map<keyof TEvents, EventListener<any>[]>;

  public on<TType extends keyof TEvents & string>(
    type: TType,
    listener: EventListener<TEvents[ TType ]>
  ): EventListener<TEvents[ TType ]> {
    this.__eventListeners = this.__eventListeners || new Map();
    let array = this.__eventListeners.get( type );
    if ( !array ) {
      array = [];
      this.__eventListeners.set( type, array );
    }

    array.push( listener );

    return listener;
  }

  public off<TType extends keyof TEvents & string>(
    type: TType,
    listener: EventListener<TEvents[ TType ]>
  ): void {
    this.__eventListeners = this.__eventListeners || new Map();
    let array = this.__eventListeners.get( type );
    if ( !array ) {
      array = [];
      this.__eventListeners.set( type, array );
    }

    const index = array.indexOf( listener );
    if ( index !== -1 ) {
      array.splice( index, 1 );
    }
  }

  protected __emit<TType extends keyof TEvents>(
    ...[ type, event ]: TEvents[ TType ] extends void ? [ TType ] : [ TType, TEvents[ TType ] ]
  ): void {
    this.__eventListeners = this.__eventListeners || new Map();
    this.__eventListeners.get( type )?.forEach( ( listener ) => listener( event ) );
  }
}
