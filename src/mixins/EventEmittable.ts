export type EventListener = ( event?: any ) => void;

export class EventEmittable<T extends string> {
  protected __eventListeners?: { [ event: string ]: EventListener[] };

  public on( event: T, listener: EventListener ): void {
    this.__eventListeners = this.__eventListeners || {};
    this.__eventListeners[ event ] = this.__eventListeners[ event ] || [];
    this.__eventListeners[ event ].push( listener );
  }

  public off( event: T, listener: EventListener ): void {
    this.__eventListeners = this.__eventListeners || {};
    this.__eventListeners[ event ] = this.__eventListeners[ event ] || [];
    const index = this.__eventListeners[ event ].indexOf( listener );
    if ( index !== -1 ) {
      this.__eventListeners[ event ].splice( index, 1 );
    }
  }

  protected __emit( event: T, args?: any ): void {
    this.__eventListeners &&
    this.__eventListeners[ event ] &&
    this.__eventListeners[ event ].forEach( ( listener ) => listener( args ) );
  }
}
