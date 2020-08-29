export type { BezierControlPoint, BezierNode, SerializedBezierNode } from './types/BezierNode';
export type { ChannelUpdateEvent } from './types/ChannelUpdateEvent';
export type { FxContext, FxDefinition, FxParam } from './types/FxDefinition';
export type { FxSection, SerializedFxSection } from './types/FxSection';
export type { SerializedAutomaton } from './types/SerializedAutomaton';
export type { SerializedChannel } from './types/SerializedChannel';
export type { SerializedChannelItem } from './types/SerializedChannelItem';
export type { SerializedCurve } from './types/SerializedCurve';

export { Automaton } from './Automaton';
export { Channel } from './Channel';
export { ChannelItem } from './ChannelItem';
export { Curve } from './Curve';

import { Automaton } from './Automaton';
export default Automaton;
