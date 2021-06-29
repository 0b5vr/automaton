/// <reference types="react" />
export declare enum MouseComboBit {
    LMB = 1,
    RMB = 2,
    MMB = 4,
    Shift = 8,
    Ctrl = 16,
    Alt = 32,
    DoubleClick = 64
}
/**
 * Do a job based on mouse button + key combination.
 * It will event.preventDefault + event.stopPropagation automatically.
 *
 * @param event The mouse event
 * @param callbacks A map of mouse button + key combination bits vs. callbacks. set or return `false` to bypass
 * @returns The return value of the callback it executed. If it couldn't execute any callbacks, returns `null` instead.
 */
export declare function mouseCombo<T>(event: React.MouseEvent, callbacks: {
    [combo: number]: ((event: React.MouseEvent) => T | false) | false;
}): T | false | null;
