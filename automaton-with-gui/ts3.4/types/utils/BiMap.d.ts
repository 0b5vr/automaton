export declare class BiMap<TKey, TValue> extends Map<TKey, TValue> {
    private readonly __secondary;
    constructor(map: Map<TKey, TValue>);
    set(key: TKey, value: TValue): this;
    delete(key: TKey): boolean;
    clear(): this;
    getFromValue(value: TValue): TKey | undefined;
}
