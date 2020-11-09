/// <reference types="react" />
import { FxSection } from '@fms-cat/automaton';
import { Resolution } from '../utils/Resolution';
import { TimeValueRange } from '../utils/TimeValueRange';
import { WithBypass } from '../../types/WithBypass';
import { WithID } from '../../types/WithID';
export declare const FX_HEIGHT = 16;
declare const CurveEditorFx: (props: {
    curveId: string;
    fx: FxSection & WithBypass & WithID;
    range: TimeValueRange;
    size: Resolution;
}) => JSX.Element;
export { CurveEditorFx };
