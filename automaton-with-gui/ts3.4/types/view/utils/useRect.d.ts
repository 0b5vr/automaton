/// <reference types="react" />
export interface RectResult {
    bottom: number;
    height: number;
    left: number;
    right: number;
    top: number;
    width: number;
}
export declare function useRect<T extends HTMLElement | SVGElement>(ref: React.RefObject<T>): RectResult;
