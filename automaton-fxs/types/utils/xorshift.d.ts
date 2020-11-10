export declare class Xorshift {
    private __seed;
    constructor(seed?: number);
    gen(seed?: number): number;
    set(seed?: number): void;
}
export default Xorshift;
