/// <reference types="react" />
import { BezierNode } from '@fms-cat/automaton';
import { Resolution } from '../utils/Resolution';
import { TimeValueRange } from '../utils/TimeValueRange';
import { WithID } from '../../types/WithID';
declare const CurveEditorNode: (props: {
    curveId: string;
    node: BezierNode & WithID;
    range: TimeValueRange;
    size: Resolution;
}) => JSX.Element;
export { CurveEditorNode };
