/**
 * Interface of a fx section.
 */
export interface FxSection {
  /**
   * Beginning time of the section.
   */
  time: number;

  /**
   * Time length of the section.
   */
  length: number;

  /**
   * Row of the section.
   */
  row: number;

  /**
   * Fx definition name of the section.
   */
  def: string;

  /**
   * Params of the section.
   */
  params: any;
}

/**
 * Serialized variant of {@link FxSection}.
 * Some values are optional.
 */
export interface SerializedFxSection {
  /**
   * Beginning time of the section.
   * `0.0` by default.
   */
  time?: number;

  /**
   * Time length of the section.
   * `0.0` by default.
   */
  length?: number;

  /**
   * Row of the section.
   * `0` by default.
   */
  row?: number;

  /**
   * Whether the section would be bypassed or not.
   */
  bypass?: boolean;

  /**
   * Fx definition name of the section.
   */
  def: string;

  /**
   * Params of the section.
   */
  params: any;
}
