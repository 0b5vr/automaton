import { SerializedData, defaultData } from '@fms-cat/automaton';

/**
 * Interface for automaton GUI settings.
 */
export interface GUISettings {
  /**
   * Whether snap is activeted or not.
   */
  snapActive: boolean;

  /**
   * Interval of snap, in time axis.
   */
  snapTime: number;

  /**
   * Interval of snap, in value axis.
   */
  snapValue: number;
}

export interface WithGUISettings {
  /**
   * Field that contains [[GUISettings]].
   */
  guiSettings: GUISettings;
}

export const defaultDataWithGUISettings: Readonly<SerializedData & WithGUISettings> = (
  Object.assign(
    {},
    defaultData,
    {
      guiSettings: {
        snapActive: false,
        snapTime: 0.1,
        snapValue: 0.1
      }
    }
  )
);
