/// <reference types="react" />
import { Resolution } from '../utils/Resolution';
import { TimeValueRange } from '../utils/TimeValueRange';
declare const CurveEditorGraph: (props: {
    curveId: string;
    range: TimeValueRange;
    size: Resolution;
}) => JSX.Element;
export { CurveEditorGraph };
