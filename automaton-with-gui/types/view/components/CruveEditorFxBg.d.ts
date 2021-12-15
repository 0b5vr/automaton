/// <reference types="react" />
import { FxSection } from '@0b5vr/automaton';
import { Resolution } from '../utils/Resolution';
import { TimeValueRange } from '../utils/TimeValueRange';
import { WithBypass } from '../../types/WithBypass';
import { WithID } from '../../types/WithID';
declare const CurveEditorFxBg: (props: {
    fx: FxSection & WithBypass & WithID;
    range: TimeValueRange;
    size: Resolution;
}) => JSX.Element | null;
export { CurveEditorFxBg };
