import { SerializedChannelItemConstant, SerializedChannelItemCurve } from '@fms-cat/automaton';
import { AutomatonWithGUI } from './AutomatonWithGUI';
import { ChannelItemConstantWithGUI } from './ChannelItemConstantWithGUI';
import { ChannelItemCurveWithGUI } from './ChannelItemCurveWithGUI';

export type ChannelItemWithGUI = ChannelItemConstantWithGUI | ChannelItemCurveWithGUI;

export function deserializeChannelItem(
  automaton: AutomatonWithGUI,
  data: SerializedChannelItemConstant | SerializedChannelItemCurve
): ChannelItemWithGUI {
  if ( 'curve' in data ) {
    return new ChannelItemCurveWithGUI( automaton, data );
  } else { // constants
    return new ChannelItemConstantWithGUI( automaton, data );
  }
}
