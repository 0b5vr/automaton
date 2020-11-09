import React from 'react';
/**
 * See: https://github.com/facebook/react/issues/14856
 */
export declare function useWheelEvent<T extends HTMLElement>(ref: React.RefObject<T>, callback: (event: WheelEvent) => void): void;
