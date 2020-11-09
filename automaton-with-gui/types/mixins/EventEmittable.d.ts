export declare type EventListener<T> = (event: T) => void;
export declare class EventEmittable<TEvents extends {
    [type: string]: any;
}> {
    protected __eventListeners?: Map<keyof TEvents, EventListener<any>[]>;
    on<TType extends keyof TEvents & string>(type: TType, listener: EventListener<TEvents[TType]>): EventListener<TEvents[TType]>;
    off<TType extends keyof TEvents & string>(type: TType, listener: EventListener<TEvents[TType]>): void;
    protected __emit<TType extends keyof TEvents>(...[type, event]: TEvents[TType] extends void ? [TType] : [TType, TEvents[TType]]): void;
}
