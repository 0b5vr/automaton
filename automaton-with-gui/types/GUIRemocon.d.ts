import { EventEmittable } from './mixins/EventEmittable';
import type { ToastyParams } from './types/ToastyParams';
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
export interface GUIRemocon extends EventEmittable<GUIRemoconEvents> {
}
