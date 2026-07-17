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

export interface TypographyStep {
  readonly size: number;
  readonly lineHeight: number;
}

export type TypographyRole =
  | 'assistive'
  | 'secondary'
  | 'meta'
  | 'body'
  | 'action'
  | 'prominentAction'
  | 'sectionTitle'
  | 'cardRank'
  | 'hero'
  | 'display';

export type SpacingRole = 'tight' | 'default' | 'card' | 'comfortable' | 'section' | 'safe' | 'wide';

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
  typography: Record<TypographyRole, TypographyStep>;
  spacing: Record<SpacingRole, number>;
  radius: { sm: number; md: number; lg: number; pill: number };
  alpha: { disabled: number; hover: number; pressed: number; scrim: number };
}

function color(r: number, g: number, b: number, a = 255): ThemeColor {
  return { r, g, b, a };
}

function typography(size: number, lineHeight: number): TypographyStep {
  return { size, lineHeight };
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
    // lobby PANEL_MUTED / pause BRIGHT_PANEL_MUTED / 席位副行 / 药丸弱化档
    // v1.6 二次终审:原 (142,88,108,235) 压奶油底仅 4.40:1(差 AA 一线,s4-image-gates.py 门C 实测);
    // 加深并去半透 → 奶油底 5.6:1、v18 浅粉药丸 4.9:1,仍明显弱于正文深莓 (108,46,76)。
    textSecondary: color(138, 78, 102),
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
    // 小字档行高按 v18 药丸/名牌的实测净区收紧，避免门 B 将字形带判出皮肤。
    assistive: typography(11, 12),
    secondary: typography(12, 13),
    meta: typography(13, 15),
    body: typography(14, 18),
    action: typography(16, 20),
    prominentAction: typography(18, 24),
    sectionTitle: typography(22, 30),
    // v1.7 R2 用户裁决：牌面排印回退 v1.6，小王/大王再由 card-node 覆盖 11/13。
    cardRank: typography(13, 16),
    hero: typography(24, 32),
    display: typography(30, 38),
  },
  spacing: {
    tight: 4,
    default: 8,
    card: 10,
    comfortable: 12,
    section: 16,
    safe: 20,
    wide: 24,
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
