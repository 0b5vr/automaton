/// <reference types="react" />
export declare enum MouseComboBit {
    LMB = 1,
    RMB = 2,
    MMB = 4,
    Shift = 8,
    Ctrl = 16,
    Alt = 32
}
export declare function mouseCombo(event: React.MouseEvent, callbacks: {
    [combo: number]: (event: React.MouseEvent) => void;
}): void;
