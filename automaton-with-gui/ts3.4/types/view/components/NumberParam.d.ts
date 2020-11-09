/// <reference types="react" />
declare type ValueType = 'int' | 'float';
export interface NumberParamProps {
    type: ValueType;
    value: number;
    /**
     * Will be called whenever it changes its value.
     * See also: onSettle
     */
    onChange?: (value: number) => void;
    /**
     * Will be called when the user finished tweaking the value.
     * onChange will also be called.
     * See also: onChange
     */
    onSettle?: (value: number, valuePrev: number) => void;
    className?: string;
}
declare const NumberParam: (props: NumberParamProps) => JSX.Element;
export { NumberParam };
