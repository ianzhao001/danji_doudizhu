/**
 * v1.4 主题令牌纯岛——颜色/字号/间距/圆角/透明度唯一真相源。零依赖，禁 `cc`。
 * 取值源自 ui-helpers、lobby-scene、game-scene 渲染器现存内联常量归并（P-THEME-APPLY 接线）。
 */

export interface ThemeColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Theme {
  palette: {
    brand: ThemeColor;
    brandDark: ThemeColor;
    surface: ThemeColor;
    surfaceRaised: ThemeColor;
    overlayScrim: ThemeColor;
    textPrimary: ThemeColor;
    textSecondary: ThemeColor;
    textDisabled: ThemeColor;
    textOnAccent: ThemeColor;
    accentGold: ThemeColor;
    accentCream: ThemeColor;
    danger: ThemeColor;
    success: ThemeColor;
    warning: ThemeColor;
    selectedTint: ThemeColor;
    tableFelt: ThemeColor;
  };
  typography: { xs: number; sm: number; md: number; lg: number; xl: number; display: number };
  spacing: { xs: number; sm: number; md: number; lg: number; xl: number };
  radius: { sm: number; md: number; lg: number; pill: number };
  alpha: { disabled: number; hover: number; pressed: number; scrim: number };
}

function color(r: number, g: number, b: number, a = 255): ThemeColor {
  return { r, g, b, a };
}

function deepFreeze<T extends object>(value: T): T {
  Object.freeze(value);
  for (const key of Object.keys(value) as (keyof T)[]) {
    const child = value[key];
    if (child && typeof child === 'object' && !Object.isFrozen(child)) {
      deepFreeze(child as object);
    }
  }
  return value;
}

const themeData: Theme = {
  palette: {
    // lobby PANEL_ACCENT / result PANEL_ACCENT
    brand: color(198, 68, 124),
    // lobby PANEL_TEXT / BRIGHT_PANEL_TEXT
    brandDark: color(108, 46, 76),
    // result PANEL_FALLBACK
    surface: color(255, 237, 246, 238),
    // hud drawPanel 48,40,58 / seats 37,42,58
    surfaceRaised: color(48, 40, 58, 178),
    // tween-helpers scrim
    overlayScrim: color(0, 0, 0, 218),
    textPrimary: color(108, 46, 76),
    // lobby PANEL_MUTED / pause BRIGHT_PANEL_MUTED
    textSecondary: color(142, 88, 108, 235),
    // lobby BUTTON_DISABLED_TEXT
    textDisabled: color(118, 108, 114, 180),
    // ui-helpers labelColor enabled / BUTTON_SECONDARY_TEXT
    textOnAccent: color(255, 255, 255),
    // seats last-action cream / hud memory accent
    accentGold: color(255, 244, 209),
    // bid STATUS_TEXT / hud memory row
    accentCream: color(255, 250, 228),
    // lobby PANEL_BAD
    danger: color(176, 72, 88, 245),
    // lobby PANEL_GOOD / ui-runtime strong tone
    success: color(77, 126, 88, 245),
    // ui-runtime mid tone
    warning: color(255, 210, 112, 230),
    // ui-helpers selected button bg 255,224,232
    selectedTint: color(255, 224, 232, 150),
    // play-area TABLE_TEXT
    tableFelt: color(74, 70, 72, 235),
  },
  typography: {
    xs: 11,
    sm: 13,
    md: 16,
    lg: 20,
    xl: 24,
    display: 28,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    pill: 999,
  },
  alpha: {
    disabled: 24,
    hover: 100,
    pressed: 150,
    scrim: 218,
  },
};

export const THEME: Theme = deepFreeze(themeData);
