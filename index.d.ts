// Generated from colors.json by build.mjs — do not edit by hand.
export type Shade = "50" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
export type Scale = Record<Shade, string>;
export type ScaleName = "charcoal" | "metal" | "haiti" | "purple" | "blueBerry" | "blue" | "sky" | "turquoise" | "persianGreen" | "pastelGreen" | "grass" | "carrot" | "orange" | "red" | "raspberry" | "fuchsia";

export interface Colors {
  white: string;
  black: string;
  charcoal: Scale;
  metal: Scale;
  haiti: Scale;
  purple: Scale;
  blueBerry: Scale;
  blue: Scale;
  sky: Scale;
  turquoise: Scale;
  persianGreen: Scale;
  pastelGreen: Scale;
  grass: Scale;
  carrot: Scale;
  orange: Scale;
  red: Scale;
  raspberry: Scale;
  fuchsia: Scale;
}

/** Best text color (white or black) for each shade, by WCAG 2 contrast. */
export type On = Record<ScaleName, Scale>;
/** WCAG 2 contrast ratios of each shade against white and black. */
export type Contrast = Record<ScaleName, Record<Shade, { white: number; black: number }>>;

export const colors: Colors;
export const on: On;
export const contrast: Contrast;
export default colors;
