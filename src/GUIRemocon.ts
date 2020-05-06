import { EventEmittable } from './mixins/EventEmittable';
import type { ToastyParams } from './types/ToastyParams';
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

  public toasty( params: ToastyParams ): void {
    this.__emit( 'toasty', params );
  }
}

export interface GUIRemoconEvents {
  undo: void;
  redo: void;
  openAbout: void;
  toasty: ToastyParams;
}

export interface GUIRemocon extends EventEmittable<GUIRemoconEvents> {}
applyMixins( GUIRemocon, [ EventEmittable ] );
