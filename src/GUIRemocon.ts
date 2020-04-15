import { EventEmittable } from './mixins/EventEmittable';
import { applyMixins } from './utils/applyMixins';

export class GUIRemocon {
  public undo(): void {
    this.__emit( 'undo' );
  }

  public redo(): void {
    this.__emit( 'redo' );
  }

  public openAbout(): void {
    this.__emit( 'openAbout' );
  }
}

export interface GUIRemoconEvents {
  undo: void;
  redo: void;
  openAbout: void;
}

export interface GUIRemocon extends EventEmittable<GUIRemoconEvents> {}
applyMixins( GUIRemocon, [ EventEmittable ] );
