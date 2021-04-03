import { FxContext } from './FxContext';
import { FxParam } from './FxParam';

export interface FxDefinition {
  name?: string;
  description?: string;
  params?: { [ key: string ]: FxParam };
  func: ( context: FxContext ) => number;
}
