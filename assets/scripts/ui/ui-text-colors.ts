/**
 * UI text colors for recolorable presentation surfaces.
 *
 * This pure island keeps readable foreground roles independent from Cocos and
 * from the raster skins whose rendered backgrounds are verified separately.
 */

export interface UiTextColor {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

export interface UiTextColors {
  readonly primary: UiTextColor;
  readonly bidCall: UiTextColor;
  readonly bidPass: UiTextColor;
  readonly neutralButton: UiTextColor;
  readonly disabledButton: UiTextColor;
  readonly activeAccent: UiTextColor;
}

function frozenColor(r: number, g: number, b: number, a = 255): UiTextColor {
  return Object.freeze({ r, g, b, a });
}

export const UI_TEXT_COLORS: UiTextColors = Object.freeze({
  primary: frozenColor(74, 45, 35),
  bidCall: frozenColor(90, 40, 0),
  bidPass: frozenColor(16, 58, 36),
  neutralButton: frozenColor(74, 72, 70),
  disabledButton: frozenColor(120, 116, 112),
  // Darkened within the violet mid-tone band so small status text also clears
  // AA on the final ivory nameplate (manifest-measured 4.75:1).
  activeAccent: frozenColor(145, 85, 190),
});
