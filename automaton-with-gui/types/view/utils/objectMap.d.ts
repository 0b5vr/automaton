declare type Keyable = number | string | symbol;
export declare function objectMapSize<K extends Keyable, T>(object: Record<K, T>): number;
export declare function objectMapValues<K extends Keyable, T>(object: Record<K, T>): T[];
export declare function objectMapHas<K extends Keyable, T>(object: Record<K, T>, key: K): boolean;
export {};
