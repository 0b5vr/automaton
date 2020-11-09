/// <reference types="react" />
import { TimeRange } from '../utils/TimeValueRange';
interface Props {
    className?: string;
    range: TimeRange;
    length: number;
    width: number;
}
declare const RangeBar: (props: Props) => JSX.Element;
export { RangeBar };
