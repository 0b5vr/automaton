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
   * Whether the section would be bypassed or not.
   * Can be undefined.
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
