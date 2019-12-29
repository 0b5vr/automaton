import { SerializedData, defaultData } from '@fms-cat/automaton';

/**
 * Interface for automaton GUI settings.
 */
export interface GUISettings {
  /**
   * Whether the time snap is activated or not.
   */
  snapTimeActive: boolean;

  /**
   * Interval of time axis snap.
   */
  snapTimeInterval: number;

  /**
   * Whether the value snap is activated or not.
   */
  snapValueActive: boolean;

  /**
   * Interval of value axis snap.
   */
  snapValueInterval: number;
}

export interface WithGUISettings {
  /**
   * Field that contains [[GUISettings]].
   */
  guiSettings: GUISettings;
}

export const defaultGUISettings: Readonly<GUISettings> = {
  snapTimeActive: false,
  snapTimeInterval: 0.1,
  snapValueActive: false,
  snapValueInterval: 0.1
};

export const defaultDataWithGUISettings: Readonly<SerializedData & WithGUISettings> = (
  Object.assign(
    {},
    defaultData,
    { guiSettings: defaultGUISettings }
  )
);
