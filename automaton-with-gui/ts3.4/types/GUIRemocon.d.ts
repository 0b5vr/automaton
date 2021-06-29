import { EventEmittable } from './mixins/EventEmittable';
import { ToastyParams } from './types/ToastyParams';
export interface GUIRemocon extends EventEmittable<GUIRemoconEvents> {
}
export declare class GUIRemocon {
    undo(): void;
    redo(): void;
    openAbout(): void;
    toasty(params: ToastyParams): void;
}
export interface GUIRemoconEvents {
    undo: void;
    redo: void;
    openAbout: void;
    toasty: ToastyParams;
}
