/// <reference types="react" />
export interface BoolParamProps {
    value: boolean;
    /**
     * Will be called whenever it changes its value.
     * See also: onSettle
     */
    onChange?: (value: boolean) => void;
    /**
     * Will be called when the user finished tweaking the value.
     * onChange will also be called.
     * See also: onChange
     */
    onSettle?: (value: boolean, valuePrev: boolean) => void;
    className?: string;
}
declare const BoolParam: (props: BoolParamProps) => JSX.Element;
export { BoolParam };
