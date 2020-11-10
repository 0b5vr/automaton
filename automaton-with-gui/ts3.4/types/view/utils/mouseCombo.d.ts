/// <reference types="react" />
export declare enum MouseComboBit {
    LMB = 1,
    RMB = 2,
    MMB = 4,
    Shift = 8,
    Ctrl = 16,
    Alt = 32
}
/**
 * Do a job based on mouse button + key combination.
 * It will event.preventDefault + event.stopPropagation automatically.
 *
 * @param event The mouse event
 * @param callbacks A map of mouse button + key combination bits vs. callbacks. set `false` to bypass
 */
export declare function mouseCombo(event: React.MouseEvent, callbacks: {
    [combo: number]: ((event: React.MouseEvent) => void) | false;
}): void;
